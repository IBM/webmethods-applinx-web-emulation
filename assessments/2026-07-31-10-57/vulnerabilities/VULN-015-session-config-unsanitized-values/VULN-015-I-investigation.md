# VULN-015-I: Investigation Report - session-config-unsanitized-values

**Phase**: Inquisitor
**Vulnerability ID**: VULN-015
**Descriptor**: session-config-unsanitized-values
**Assessment**: 2026-07-31-10-57
**Investigated**: 2026-07-31T12:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z

**Exploitability**: LOW

---

## Root Cause Analysis

[`ConfigurationService.loadConfig()`](src/app/services/configuration.service.ts:38) reads `sessionConfig.json` via HTTP GET and stores `config.applicationName`, `config.connectionPool`, and `config.autoLoginIfDisabledAuth` without schema validation. `applicationName` is used in macro API calls ([`macro.component.ts:127`](src/app/macro/macro.component.ts:127), 144, 178, 228, 253) as a path parameter. `autoLoginIfDisabledAuth` is a boolean flag that, when true combined with server returning `auth=DISABLED`, bypasses all authentication. `sessionOptions` values pass through `isValidVariable()` which validates key prefix (`GX_VAR*`) and non-empty string — but does not validate value content.

---

## Attack Scenario

**Path Traversal in applicationName**: If `sessionConfig.json` is tampered (supply chain attack) and `applicationName` is set to `'../../../sensitive-path'`, the macro API call becomes: `/applinx/rest/macro?applicationName=../../../sensitive-path` — potential path traversal in ApplinX server macro file access. ApplinX server may or may not sanitize this server-side.

**autoLoginIfDisabledAuth Abuse**: If `sessionConfig.json` is modified (tampered static asset) to set `autoLoginIfDisabledAuth=true` AND the ApplinX server reports `auth=DISABLED`, the application auto-logs in without any credentials. This could allow unauthorized host sessions if the server is in a maintenance/test mode with auth disabled.

This attack requires `sessionConfig.json` tampering — effectively a supply chain attack on the static assets. Combined with VULN-014/018, static assets can be tampered.

---

## Prerequisites

- `sessionConfig.json` must be tampered with malicious `applicationName` or `autoLoginIfDisabledAuth=true`
- Tampered `sessionConfig.json` must be deployed (requires build pipeline access or static asset replacement)
- For autoLogin bypass: ApplinX server must report `auth=DISABLED`

---

## Privilege Boundary Analysis

**Starting Privilege**: Static asset tampering capability (supply chain threat)
**Achieved Privilege**: Path traversal in ApplinX macro API (if applicationName contains traversal chars) OR unauthenticated session creation (if autoLogin enabled and server reports DISABLED auth)
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: LOW
**Availability**: NONE

### Impact Description

`applicationName` path traversal risk is conditional on ApplinX server's sanitization — client-side validation is absent, server-side mitigation unverified. `autoLoginIfDisabledAuth` risk is conditional on server configuration. Without `sessionConfig.json` tampering, this is not directly exploitable by an unauthenticated attacker.

---

## Data Flow Analysis

**Sources**:
- `assets/config/sessionConfig.json` — HTTP GET at startup (served as static asset)

**Transformations**:
- `config.applicationName` stored without validation
- `config.autoLoginIfDisabledAuth` stored as boolean control flag
- `sessionOptions` filtered by `GX_VAR*` key prefix (value not validated)

**Sinks**:
- MacroService API calls: `macroService.getMacro(user, applicationName, token)` — `applicationName` as URL parameter
- [`WebLoginComponent.autoLogin()`](src/app/webLogin/webLogin.component.ts) — gated by `autoLoginIfDisabledAuth` flag
- `CreateSessionRequest.options` — sessionOptions passed to ApplinX REST API

---

## Affected Components

### Direct Impact

- **[`ConfigurationService.loadConfig()`](src/app/services/configuration.service.ts:38)**: Consumes `sessionConfig.json` without schema validation
- **MacroComponent — applicationName in API calls**: `applicationName` used as URL parameter in macro CRUD operations without sanitization
- **[`WebLoginComponent.autoLogin()`](src/app/webLogin/webLogin.component.ts)**: Authentication bypass when autoLogin enabled and server reports `auth=DISABLED`

### Indirect Impact

- **VULN-014 (no lock file), VULN-018 (no artifact signing)**: Supply chain attacks that modify `sessionConfig.json` go undetected

---

## Remediation Guidance

### Recommended Fix

Implement JSON schema validation for `sessionConfig.json` on load. Validate `applicationName` against a strict allowlist pattern (alphanumeric, hyphens, underscores only). Reject configs that don't match schema. Add explicit security review for `autoLoginIfDisabledAuth` feature — document intended use cases.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Add JSON schema validation for `sessionConfig.json` (Ajv or similar)
2. Validate `applicationName`: `/^[a-zA-Z0-9_-]+$/` — reject path traversal characters
3. Validate `connectionPool` similarly
4. Document and restrict `autoLoginIfDisabledAuth` to explicit test/admin deployments only
5. Enable artifact signing (VULN-018) to detect `sessionConfig.json` tampering

---

## References

**Scan Finding**: [vulnerabilities/VULN-015-session-config-unsanitized-values/VULN-015-S-scan-finding.md](vulnerabilities/VULN-015-session-config-unsanitized-values/VULN-015-S-scan-finding.md)

**Threat Model References**:
- TM-010
- TM-003

**Attack Surface References**:
- AS-014

**External References**:
- CWE-20: Improper Input Validation
- CWE-22: Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)
- OWASP A05:2021 — Security Misconfiguration
- CVSS:3.1/AV:L/AC:H/PR:H/UI:N/S:U/C:L/I:L/A:N — Score: 2.9 LOW (requires static asset tampering)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
