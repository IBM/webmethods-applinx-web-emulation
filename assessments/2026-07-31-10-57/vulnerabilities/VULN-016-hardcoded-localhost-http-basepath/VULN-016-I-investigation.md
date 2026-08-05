# VULN-016-I: Investigation Report - hardcoded-localhost-http-basepath

**Phase**: Inquisitor
**Vulnerability ID**: VULN-016
**Descriptor**: hardcoded-localhost-http-basepath
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

`MacroComponent` has a class-level field [`basePath = 'http://localhost:2380/applinx/rest'`](src/app/macro/macro.component.ts:49). Similarly, [`GXUtils.MACRO_BASE_URL = 'http://localhost:2380/'`](src/utils/GXUtils.ts:260). However, investigation reveals that `MacroComponent` uses `@ibm/applinx-rest-apis` `MacroService` for its actual API calls (`macroService.getMacro`, `deleteMacro`, `viewMacro`, `playMacro`, `saveMacro`) — NOT the hardcoded `basePath`. The `MacroService` uses the `basePath` configured in the ApplinX Angular module (`app.module.ts`, `environment.ts`). The declared `basePath` field in `MacroComponent` appears to be an UNUSED leftover from a previous implementation. Similarly `GXUtils.MACRO_BASE_URL` and `GXUtils.MACRO_URL` appear to be constants that may not be actively wiring production API calls.

---

## Attack Scenario

If `basePath` were actually used by `MacroComponent` for API calls, it would route macro API traffic to `HTTP://localhost:2380` in production, bypassing HTTPS — enabling plaintext transmission of Bearer tokens and macro data (including base64-encoded passwords from VULN-006). However, trace shows `MacroService` (from ApplinX SDK) is used instead, which reads `basePath` from the configured environment. The risk is: if a developer adds new `MacroComponent` code that uses `this.basePath` directly, it would send unencrypted API calls.

---

## Prerequisites

- The hardcoded `basePath` in `MacroComponent` must actually be used for HTTP calls
- Investigation shows current production API calls use `MacroService` with environment-configured URL — NOT this field directly
- Risk: future code changes could use `this.basePath` inadvertently, re-introducing the HTTP transmission vulnerability

---

## Privilege Boundary Analysis

**Starting Privilege**: Network attacker on same network as client
**Achieved Privilege**: Credential interception via HTTP sniffing — if hardcoded basePath were used
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: NONE
**Availability**: NONE

### Impact Description

REDUCED SEVERITY from scanner's assessment: investigation reveals the hardcoded HTTP `basePath` in `MacroComponent` is NOT actively used for production API calls — `MacroService` from the ApplinX SDK handles actual requests. The field is a dead-code leftover. The `GXUtils.MACRO_BASE_URL` constant is similarly not observed wiring production traffic. The risk is future code debt — if someone uses `this.basePath` in new code, it would route over HTTP. The field should be removed to eliminate this future risk.

---

## Data Flow Analysis

**Sources**:
- `MacroComponent` class field `basePath = 'http://localhost:2380/applinx/rest'` — hardcoded dead code

**Transformations**:
- `MacroService` from ApplinX SDK used for actual API calls — uses environment-configured URL
- `basePath` field declared but NOT passed to `MacroService` constructor or API calls

**Sinks**:
- `MacroService` API calls — use environment URL (HTTPS in production), NOT the hardcoded `basePath`

---

## Affected Components

### Direct Impact

- **[`MacroComponent.basePath`](src/app/macro/macro.component.ts:49)**: Dead code — hardcoded HTTP URL that is NOT used in current production API calls; risk is future code reuse
- **[`GXUtils.MACRO_BASE_URL`](src/utils/GXUtils.ts:260)**: Hardcoded HTTP constant — confirm whether actively wiring API traffic

### Indirect Impact

- **VULN-006 (macro credential storage)**: If HTTP basePath were used, base64-encoded passwords in macros would transit unencrypted

---

## Remediation Guidance

### Recommended Fix

Remove the class-level `basePath` field from `MacroComponent` and the `MACRO_BASE_URL` / `MACRO_URL` / `GET_MACROLIST_URL` constants from `GXUtils` that reference localhost HTTP. All macro API calls should use the environment-configured `basePath` from the ApplinX SDK configuration.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Remove hardcoded `basePath` fields from `MacroComponent`
2. Remove localhost HTTP constants from `GXUtils`
3. Add a CI lint rule or grep check: flag any occurrence of `'http://localhost'` in source code
4. Confirm all `MacroService` API calls route through ApplinX SDK environment configuration

---

## References

**Scan Finding**: [vulnerabilities/VULN-016-hardcoded-localhost-http-basepath/VULN-016-S-scan-finding.md](vulnerabilities/VULN-016-hardcoded-localhost-http-basepath/VULN-016-S-scan-finding.md)

**Threat Model References**:
- TM-007

**Attack Surface References**:
- AS-008

**External References**:
- CWE-319: Cleartext Transmission of Sensitive Information
- CWE-798: Use of Hard-coded Credentials
- OWASP A02:2021 — Cryptographic Failures
- CVSS:3.1/AV:A/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N — Score: 3.1 LOW (dead code; adjacent network required if activated)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
