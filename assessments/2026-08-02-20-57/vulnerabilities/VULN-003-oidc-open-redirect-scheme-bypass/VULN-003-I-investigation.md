# VULN-003-I: Investigation Report - oidc-open-redirect-scheme-bypass

**Phase**: Inquisitor
**Vulnerability ID**: VULN-003
**Descriptor**: oidc-open-redirect-scheme-bypass
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: FALSE_POSITIVE

---

## Investigation Summary

**Determination**: This finding has been determined to be a FALSE POSITIVE.

**Exploitability**: THEORETICAL

---

## Root Cause Analysis

Scanner claimed protocol-relative URLs (`//evil.com`) bypass the `https:` scheme check by inheriting the page protocol. This is only true when a base URL is supplied: `new URL('//evil.com', baseURI)`. The actual code calls `new URL(res.redirectUri)` with **NO base parameter**. Per WHATWG URL Standard, `new URL('//evil.com')` without a base throws `TypeError`. This `TypeError` is caught by the existing `catch(e) { return; }` block, which aborts the redirect. The bypass technique is inapplicable to this code.

---

## Attack Scenario

ApplinX backend (compromised) returns `redirectUri='//evil.com/callback'`. Code executes `new URL('//evil.com/callback')` with no base → `TypeError` thrown → catch block executes → `return;` → redirect does NOT occur. Attack fails. Residual risk: if backend returns `'https://evil.com/callback'` (absolute HTTPS), the scheme check passes and redirect proceeds to attacker IdP. This is a server-requires-compromise scenario with no client-side bypass.

---

## Prerequisites

- ApplinX REST API backend fully compromised (required for any redirect manipulation)
- Attacker must supply a syntactically valid absolute HTTPS URL (for residual risk scenario)
- Protocol-relative bypass specifically: not applicable — no base URL in constructor call

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX REST API backend
**Achieved Privilege**: None for protocol-relative bypass (TypeError thrown). Residual: OIDC code redirect to attacker IdP (requires full backend compromise — no privilege escalation beyond what attacker already has).
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: NONE

### Impact Description

The specific protocol-relative bypass does not work. The code is safe against the claimed attack. Residual risk (absolute HTTPS to attacker IdP) requires full backend compromise and does not represent a client-side escalation.

---

## Data Flow Analysis

**Sources**:
- `CreateSessionResponse.redirectUri` from ApplinX REST API (`@ibm/applinx-rest-apis` SDK)

**Transformations**:
- `new URL(res.redirectUri)` — no base parameter — `TypeError` on protocol-relative input
- `parsed.protocol !== 'https:'` — scheme validation (only reached for valid absolute URLs)
- `catch(e) { return; }` — aborts redirect on any URL parsing error

**Sinks**:
- `window.location.href` — only reachable with syntactically valid absolute HTTPS URL

---

## Affected Components

### Direct Impact

- **OAuth2HandlerService.redirectToIDPLoginPage()**: No impact from protocol-relative bypass. Residual: lacks hostname allowlist validation.

### Indirect Impact

- **OIDC authorization code flow**: Residual: if backend is fully compromised and supplies valid HTTPS attacker URL, authorization code could be redirected to attacker IdP (requires backend compromise, not a client bypass)

---

## Remediation Guidance

### Recommended Fix

The protocol-relative bypass finding is a false positive — no code change required for that specific claim. For defense-in-depth against the residual risk (absolute HTTPS to attacker domain): add hostname allowlist validation. Pre-register the expected IdP hostname(s) in `sessionConfig.json` and verify `parsed.hostname` matches an allowlist entry before proceeding with the redirect.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Add IdP hostname allowlist to sessionConfig.json: `{ "allowedIdpHosts": ["idp.example.com"] }`
2. Validate `parsed.hostname` against allowlist after URL construction: `if (!allowedHosts.includes(parsed.hostname)) return;`
3. Consider adding CSP `form-action 'self'` header to prevent unexpected navigation targets
4. Document that redirectUri origin validation requires server-side configuration

---

## References

**Scan Finding**: [VULN-003-S-scan-finding.md](VULN-003-S-scan-finding.md)

**Threat Model References**:
- TM-002

**Attack Surface References**:
- AS-001
- AS-002

**External References**:
- WHATWG URL Standard §4.1: `new URL(url, base)` — base required for relative URLs
- MDN URL constructor: TypeError thrown when input is not absolute and no base is provided

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Closed (False Positive)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
