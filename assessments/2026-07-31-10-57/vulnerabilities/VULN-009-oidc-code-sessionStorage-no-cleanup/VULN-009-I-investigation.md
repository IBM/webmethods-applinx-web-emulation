# VULN-009-I: Investigation Report - oidc-code-sessionStorage-no-cleanup

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-009  
**Descriptor**: oidc-code-sessionStorage-no-cleanup  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: Confirmed as information exposure / security hygiene issue.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: LOW

---

## Root Cause Analysis

[`OAuth2HandlerService.sendCodeAndConnectSession()`](src/app/services/oauth2-handler.service.ts:58) stores the OIDC authorization code in `sessionStorage['idPcode']` before forwarding it to ApplinX REST API for exchange. [`StorageService.setNotConnected()`](src/app/services/storage.service.ts:51) only removes `'gx_token'` — **NOT** `'idPcode'`. The authorization code therefore persists in `sessionStorage` for the entire browser tab lifetime after successful exchange.

---

## Attack Scenario

**Practical Impact Limited**: OIDC authorization codes are **single-use** — the IdP invalidates them after first exchange. By the time code reaches `sessionStorage`, it has been exchanged and is worthless. Post-exchange, reading the stale code has zero replay value.

**Narrow Pre-Exchange Window**: XSS triggered in the milliseconds between `sessionStorage.setItem('idPcode', code)` and the backend exchange completing could intercept a valid code. This timing is extremely difficult to exploit reliably.

---

## Prerequisites

- OIDC authentication mode must be active
- XSS vulnerability must be exploitable within the brief pre-exchange window for meaningful risk
- For post-exchange: reading stale code has no practical attack value

---

## Privilege Boundary Analysis

**Starting Privilege**: XSS execution context during OIDC callback flow
**Achieved Privilege**: Read single-use authorization code (already invalidated after exchange)
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: LOW  
**Integrity**: NONE  
**Availability**: NONE

---

## Data Flow Analysis

**Sources**:
- OIDC authorization code from IdP — delivered via URL query parameter `?code=`

**Transformations**:
- `sessionStorage.setItem('idPcode', code)` — stored at line 58
- Code forwarded to ApplinX backend → IdP invalidates after exchange
- Code remains in `sessionStorage` — never removed

**Sinks**:
- `sessionStorage['idPcode']` — persists indefinitely until tab close

---

## Remediation Guidance

### Recommended Fix

Remove `sessionStorage.setItem('idPcode', code)` — use local variable only. Add `sessionStorage.removeItem('idPcode')` to `StorageService.setNotConnected()`.

**Priority**: MEDIUM

---

## References

**Scan Finding**: [VULN-009-S-scan-finding.md](VULN-009-S-scan-finding.md)  
**Threat Model References**: TM-002  
**Attack Surface References**: AS-007

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
