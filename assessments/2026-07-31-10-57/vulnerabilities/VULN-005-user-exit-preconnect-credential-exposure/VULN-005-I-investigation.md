# VULN-005-I: Investigation Report - user-exit-preconnect-credential-exposure

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-005  
**Descriptor**: user-exit-preconnect-credential-exposure  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as credential exposure via API design flaw.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: MEDIUM

---

## Root Cause Analysis

The [`IUserExits.preConnect()`](src/app/user-exits/IUserExits.ts:24) interface signature includes `authHeader?: string`. [`WebLoginComponent.sessionConnect()`](src/app/webLogin/webLogin.component.ts:101) calls `userExitsEventThrower.firePreConnect(createSessionRequest, authHeader)` where `authHeader = 'Basic ' + btoa(username+':'+password)` — a base64-encoded credential that is **plaintext-equivalent** (`atob()` trivially reverses it). [`UserExitsEventThrowerService.firePreConnect()`](src/app/services/user-exits-event-thrower.service.ts:40) delivers this credential to **every registered `IUserExits` implementation** without filtering or masking.

---

## Attack Scenario

**Malicious Third-Party User Exit**: Developer integrates a third-party analytics or monitoring library implementing `IUserExits`. Library's `preConnect()` captures `authHeader`: `const decoded = atob(authHeader.split(' ')[1]);` → `'username:password'`. Credentials exfiltrated to vendor server for every user login.

**Accidental Logging**: Developer adds debug user exit logging all `preConnect` parameters. Log entry contains `'Basic dXNlcm5hbWU6cGFzc3dvcmQ='` — trivially decoded to plaintext.

**Combined with VULN-004**: Malicious generated page displaces security hooks (VULN-004), installs credential-capturing user exit, receives all subsequent login credentials via `preConnect`.

---

## Prerequisites

- A user-exit implementation must be registered
- User must authenticate using ApplinX or LDAP auth method (OIDC and Natural paths do NOT pass `authHeader`)
- The user-exit implementer must have code execution capability to exfiltrate data

---

## Privilege Boundary Analysis

**Starting Privilege**: Developer/integrator with ability to register custom `IUserExits` implementation
**Achieved Privilege**: Access to plaintext-equivalent Basic-auth credentials for every ApplinX/LDAP login
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH  
**Integrity**: NONE  
**Availability**: NONE

### Impact Description

Plaintext-equivalent credentials (base64 `username:password`) exposed to all registered user-exit implementations. Any implementation can decode via `atob(authHeader.split(' ')[1])`. Enables: password capture for all ApplinX/LDAP authenticated users, credential reuse attacks. Specific to ApplinX/LDAP auth modes — OIDC and Natural auth do NOT pass `authHeader`.

---

## Data Flow Analysis

**Sources**:
- `WebLoginComponent` form fields — username and password entered by user

**Transformations**:
- `authHeader = 'Basic ' + btoa(unescape(encodeURIComponent(username + ':' + password)))`
- `userExitsEventThrower.firePreConnect(createSessionRequest, authHeader)`
- `forEach(u => u.preConnect(createSessionRequest, authHeader))` — delivered to all listeners

**Sinks**:
- Any `IUserExits.preConnect()` implementation — can call `atob()` to get `'username:password'`

---

## Affected Components

### Direct Impact

- **[`IUserExits.preConnect()`](src/app/user-exits/IUserExits.ts:24)**: API contract exposes credential to all implementers
- **[`UserExitsEventThrowerService.firePreConnect()`](src/app/services/user-exits-event-thrower.service.ts:40)**: Distributes credential to all registered implementations

### Indirect Impact

- **VULN-004 (listener global replacement)**: Malicious generated page can displace security hooks and capture credentials

---

## Classification Refinement

### Initial Classification (Scanner)
- CVSS: 5.9 (MEDIUM)

### Refined Classification (Inquisitor)
- CWE: CWE-522, CWE-312
- CVSS: **4.4 (MEDIUM)**
- Vector: `CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:H/I:N/A:N`

---

## Remediation Guidance

### Recommended Fix

Remove the `authHeader` parameter from `IUserExits.preConnect()` entirely. If connection context is needed by user exits, pass only sanitized info: `{ username: string, authMethod: string, timestamp: number }` — never password or auth header.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Remove `authHeader` from `preConnect()` signature
2. Audit all `IUserExits` implementations for `authHeader` logging/storage
3. Static analysis rule: flag access to `authHeader` in `preConnect()`
4. Document API security contract

---

## References

**Scan Finding**: [VULN-005-S-scan-finding.md](VULN-005-S-scan-finding.md)  
**Threat Model References**: TM-006  
**Attack Surface References**: AS-012

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
