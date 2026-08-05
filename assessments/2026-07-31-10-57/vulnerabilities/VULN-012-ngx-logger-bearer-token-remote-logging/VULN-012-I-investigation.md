# VULN-012-I: Investigation Report - ngx-logger-bearer-token-remote-logging

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-012  
**Descriptor**: ngx-logger-bearer-token-remote-logging  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: MEDIUM (conditional on serverLoggingUrl configuration)

---

## Root Cause Analysis

[`AuthTokenServerService.alterHttpRequest()`](src/app/services/logger.service.ts:8) unconditionally injects `Authorization: Bearer <token>` into every ngx-logger remote log HTTP request. The token is read directly from `sessionStorage['gx_token']` at line 19 — bypassing the `StorageService` abstraction. If `serverLoggingUrl` is configured in the Angular environment, every ERROR-level log event generates an HTTP request to the remote log endpoint carrying the full Bearer token.

---

## Attack Scenario

**Log Infrastructure Compromise**: Attacker compromises the ngx-logger remote endpoint. Extracts Bearer tokens from all incoming log request `Authorization` headers. Enables full session replay for any user whose session generated an error log.

**HTTP Log Endpoint**: If `serverLoggingUrl` uses HTTP (not HTTPS), tokens transmitted in cleartext — network interception possible.

---

## Prerequisites

- `serverLoggingUrl` must be configured in Angular environment (log shipping must be active)
- An ERROR-level log event must occur during the session
- Attacker must intercept HTTP traffic or compromise the log endpoint

---

## Privilege Boundary Analysis

**Starting Privilege**: Network attacker or log infrastructure access
**Achieved Privilege**: Bearer token extracted from log request headers — full ApplinX session hijack possible
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH  
**Integrity**: NONE  
**Availability**: NONE

---

## Data Flow Analysis

**Sources**:
- `sessionStorage['gx_token']` — read directly at `logger.service.ts:19`

**Transformations**:
- `'Bearer ' + sessionStorage.getItem('gx_token')` — token with prefix
- `httpRequest.clone({ setHeaders: { Authorization: token } })` — injected into every remote log request

**Sinks**:
- Remote log HTTP endpoint (`serverLoggingUrl`) — receives Bearer token in Authorization header

---

## Remediation Guidance

### Recommended Fix

Remove the `Authorization` header from log requests entirely — log endpoints do not require user session tokens. If log endpoint authentication is needed, use a dedicated log-specific API key. Update `getAuthToken()` to use `StorageService` rather than direct `sessionStorage` access.

**Priority**: MEDIUM

---

## References

**Scan Finding**: [VULN-012-S-scan-finding.md](VULN-012-S-scan-finding.md)  
**Threat Model References**: TM-005  
**Attack Surface References**: AS-013

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
