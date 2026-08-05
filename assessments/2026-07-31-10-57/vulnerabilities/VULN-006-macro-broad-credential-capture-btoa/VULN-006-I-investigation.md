# VULN-006-I: Investigation Report - macro-broad-credential-capture-btoa

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-006  
**Descriptor**: macro-broad-credential-capture-btoa  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: HIGH

---

## Root Cause Analysis

[`SharedService.recordMacro()`](src/app/services/shared.service.ts:88) uses `document.querySelectorAll("input[type='password']")` — a **global DOM query** capturing ALL password-type inputs in the entire document (not scoped to ApplinX fields). Password values are encoded with `window.btoa()` — base64 encoding is trivially reversible via `window.atob()` and provides **no confidentiality protection**. Encoded credentials are stored in the macro object and transmitted to the ApplinX server via `MacroService.saveMacro()`. Additionally, `decryptBeforePlay()` ([macro.component.ts:202](src/app/macro/macro.component.ts:202)) accesses `element.fields` without null guard.

---

## Attack Scenario

**Server-Side Recovery**: Any entity with ApplinX server file system access (admin, compromised server) reads macro JSON files. For each step with `type='password'` and a base64 value: `window.atob(value)` → plaintext password. **Trivial single-step recovery**.

**API-Level Recovery**: The `viewMacro` REST endpoint returns macro JSON with base64-encoded password fields. If the API lacks per-user authorization controls, any authenticated user can retrieve another user's macros and decode credentials.

**XSS Recovery**: During playback, `decryptBeforePlay()` decodes passwords into DOM form fields. An XSS attack during playback can read these decoded values.

---

## Prerequisites

- User must use macro recording during a workflow involving password entry
- Recovery requires: ApplinX server file access OR macro REST API access OR XSS at playback time

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated user (any user with macro access)
**Achieved Privilege**: Access to plaintext-equivalent passwords for all recorded workflows
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH  
**Integrity**: NONE  
**Availability**: NONE

### Impact Description

Passwords stored in macro files using base64-only encoding are trivially recoverable via `atob()`. Creates a persistent credential store on the ApplinX server. All users who have ever recorded macros with password fields are at risk. Combined with VULN-016 (HTTP basePath), macro transmission may occur over unencrypted HTTP.

---

## Data Flow Analysis

**Sources**:
- `document.querySelectorAll("input[type='password']")` — global DOM query capturing ALL password inputs

**Transformations**:
- `pwdField['value'] = window.btoa(pwdField['value'])` — base64 encoding (NOT encryption)
- Macro object serialized to JSON: `{ type: 'password', value: '<base64>' }`

**Sinks**:
- ApplinX server macro file storage (persistent, server-accessible)
- `MacroService` REST API `viewMacro` endpoint (returns base64 values)
- Playback: `window.atob(fieldElement.value)` — decoded into DOM form field

---

## Affected Components

### Direct Impact

- **[`SharedService.recordMacro()`](src/app/services/shared.service.ts:88)**: Global password capture and base64 encoding
- **[`MacroComponent.decryptBeforePlay()`](src/app/macro/macro.component.ts:202)**: Credential decoding at playback + null-deref risk if `element.fields` undefined

### Indirect Impact

- **ApplinX macro REST API (`viewMacro`)**: Returns base64-encoded passwords — requires authorization controls
- **VULN-016 (hardcoded HTTP basePath)**: Macro transmission may occur over HTTP

---

## Classification Refinement

### Initial Classification (Scanner)
- CVSS: 5.7 (MEDIUM)

### Refined Classification (Inquisitor)
- CWE: CWE-312, CWE-522
- OWASP: A02:2021 — Cryptographic Failures
- CVSS: **6.5 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:H/I:N/A:N`

### Justification
- Severity confirmed HIGH for Confidentiality — passwords trivially recoverable
- Requires authenticated user who records macros
- Any server admin can recover passwords from macro files

---

## Remediation Guidance

### Recommended Fix

Replace `window.btoa()` with Web Crypto API AES-GCM encryption. Generate a per-session key via `crypto.subtle.generateKey()`, encrypt password values before storage. Key stored in-memory (never transmitted to server). Alternatively, avoid storing passwords in macros — prompt user for re-entry at playback time.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Replace `window.btoa()` with `crypto.subtle.encrypt(AES-GCM)` for password values
2. Scope `querySelectorAll` to ApplinX container element instead of global DOM
3. Fix VULN-016: remove hardcoded HTTP basePath
4. Enforce per-user authorization on `viewMacro`/`getMacro` API endpoints
5. Add null guard in `decryptBeforePlay()`: check `element.fields` before accessing

---

## References

**Scan Finding**: [VULN-006-S-scan-finding.md](VULN-006-S-scan-finding.md)  
**Threat Model References**: TM-007  
**Attack Surface References**: AS-008

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
