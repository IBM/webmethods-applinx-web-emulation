# VULN-008-I: Investigation Report - bearer-token-sessionStorage

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-008  
**Descriptor**: bearer-token-sessionStorage  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: MEDIUM

---

## Root Cause Analysis

[`StorageService.setConnected()`](src/app/services/storage.service.ts:44) stores the ApplinX Bearer session token in browser `sessionStorage['gx_token']`. `sessionStorage` is accessible to all JavaScript code in the same origin — any XSS can call `sessionStorage.getItem('gx_token')`. Additionally, [`logger.service.ts:19`](src/app/services/logger.service.ts:19) reads `sessionStorage` directly, bypassing `StorageService` abstraction. No httpOnly cookie mechanism is used.

---

## Attack Scenario

**Attack Chain**: VULN-001 (CSS injection) or VULN-002 (keyboard mapping eval) → JavaScript execution in app origin → `sessionStorage.getItem('gx_token')` → token exfiltration via `fetch()` to attacker server → attacker uses token in `Authorization: Bearer` header → full ApplinX REST API access as victim. Attacker can read terminal screen data, issue `sendKeys` commands, execute macros, and perform all operations the victim is authorized to do on the mainframe host.

---

## Prerequisites

- User must be authenticated (token present in `sessionStorage`)
- A prior XSS vulnerability (VULN-001, VULN-002, or any other XSS) must be exploitable
- Session must be active (`sessionStorage` cleared on tab close)

---

## Privilege Boundary Analysis

**Starting Privilege**: Attacker with XSS execution in app origin (no session token)
**Achieved Privilege**: Full authenticated ApplinX REST API session — all operations the victim is authorized for on the host
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH  
**Integrity**: HIGH  
**Availability**: NONE

### Impact Description

Full session hijack: attacker impersonates authenticated user to ApplinX REST API. Includes reading all terminal screen content, issuing arbitrary host commands via `sendKeys`, executing/reading/deleting macros (including those with stored passwords from VULN-006), and full host session takeover.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `CreateSessionResponse.token` — issued on successful authentication

**Transformations**:
- `sessionStorage.setItem('gx_token', authToken)` — stored in JS-accessible storage
- `getAuthToken()` returns `'Bearer ' + sessionStorage.getItem('gx_token')` — used for all API calls

**Sinks**:
- `sessionStorage['gx_token']` — accessible to all same-origin JavaScript
- `Authorization` header of all ApplinX REST API calls
- `Authorization` header of all ngx-logger remote log requests (VULN-012)

---

## Affected Components

### Direct Impact

- **[`StorageService.setConnected()`](src/app/services/storage.service.ts:44)**: Token storage in JS-accessible sessionStorage
- **[`AuthTokenServerService.getAuthToken()`](src/app/services/logger.service.ts:19)**: Direct `sessionStorage` access bypassing `StorageService`

### Indirect Impact

- **VULN-001 (CSS injection) / VULN-002 (keyboard mapping eval)**: XSS attack chain entry points
- **VULN-012 (ngx-logger token logging)**: Token also sent to remote logging endpoint

---

## Classification Refinement

### Refined Classification (Inquisitor)
- CWE: CWE-922
- OWASP: A02:2021 — Cryptographic Failures
- CVSS: **6.8 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N`
- Note: HIGH impact, but HIGH complexity due to required XSS prerequisite

---

## Remediation Guidance

### Recommended Fix

Migrate to httpOnly/Secure cookie-based session token storage. This requires ApplinX REST API to support `Set-Cookie` response headers with `HttpOnly; Secure; SameSite=Strict` flags. Angular client removes all `sessionStorage` token handling.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Migrate Bearer token to httpOnly/Secure cookie (requires backend change to ApplinX REST API)
2. Eliminate all non-`StorageService` `sessionStorage` token reads (fix `logger.service.ts:19`)
3. Implement CSP to restrict XSS vectors
4. Remediate VULN-001 and VULN-002 to eliminate attack chain entry points

---

## References

**Scan Finding**: [VULN-008-S-scan-finding.md](VULN-008-S-scan-finding.md)  
**Threat Model References**: TM-001, TM-006  
**Attack Surface References**: AS-007

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
