# VULN-011-I: Investigation Report - error-message-disclosure-null-deref

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-011  
**Descriptor**: error-message-disclosure-null-deref  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: PROVEN

---

## Root Cause Analysis

[`NavigationService.errorHandler()`](src/app/services/navigation/navigation.service.ts:103) accesses `errorResponse.error.message` without a null guard. Angular's `HttpErrorResponse.error` is **null** for network-level errors: connection timeouts, CORS failures, network disconnections, and SSL errors. When `checkScreenUpdated()` polling encounters such an error, `errorHandler()` is called with `error.error=null`, causing `TypeError: Cannot read properties of null (reading 'message')`. The `TypeError` propagates, `errorHandler()` exits abnormally, and `screenLockerService` state is never reset — leaving the UI **permanently locked**.

---

## Attack Scenario

**DoS via Network Error**: Any network-level disruption (TCP timeout, CORS error, network drop) during `checkScreenUpdated()` polling triggers the `TypeError`. UI becomes permanently locked (all keyboard input disabled) until the user manually refreshes the page.

**Error Message Disclosure**: ApplinX server error messages displayed directly in `webLogin` error panel (`webLogin.component.ts:157`) and forwarded to `ngx-logger` remote endpoint. Internal server details potentially exposed.

---

## Prerequisites

- Active login session with `checkScreenUpdated()` polling running
- Network-level HTTP error (not an HTTP response error — network/transport-level failure producing `HttpErrorResponse` with `error=null`)

---

## Privilege Boundary Analysis

**Starting Privilege**: No authentication required to trigger network error during polling
**Achieved Privilege**: Permanent screen lock (DoS) for authenticated user
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: LOW  
**Integrity**: NONE  
**Availability**: LOW

### Impact Description

Null dereference on network-level error permanently locks the UI (DoS until page refresh). Error message disclosure exposes ApplinX internal server details to browser users and log systems. Note: `webLogin.component.ts:157` uses safer `errorResponse.error.message || errorResponse.message` fallback — but `navigation.service.ts:103` does not.

---

## Data Flow Analysis

**Sources**:
- `HttpErrorResponse` from Angular HTTP client — `error.error` is null for network-level failures

**Transformations**:
- `errorHandler()` called with null `error.error`
- `errorResponse.error.message.indexOf()` → `TypeError: Cannot read properties of null`
- `errorHandler()` exits abnormally — no cleanup

**Sinks**:
- `screenLockerService` state — never reset → UI permanently locked
- webLogin error panel — raw server message displayed (information disclosure)
- ngx-logger remote endpoint — raw server message shipped (VULN-012)

---

## Affected Components

### Direct Impact

- **[`NavigationService.errorHandler()`](src/app/services/navigation/navigation.service.ts:102)**: Null dereference at line 103
- **[`NavigationService.checkScreenUpdated()`](src/app/services/navigation/navigation.service.ts:82)**: Polling loop calls crashing `errorHandler()`

### Indirect Impact

- **`WebLoginComponent.handleError()`**: Better pattern but still displays raw server messages
- **VULN-012 (ngx-logger)**: Raw error messages forwarded to remote logging

---

## Classification Refinement

### Refined Classification (Inquisitor)
- CWE: CWE-476, CWE-209
- OWASP: A05:2021 — Security Misconfiguration
- CVSS: **6.5 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L`

---

## Remediation Guidance

### Recommended Fix

Add optional chaining: `errorResponse.error?.message?.indexOf(...)`. Wrap `errorHandler()` in `try/catch` with guaranteed cleanup in `finally` block (reset `screenLockerService`). Replace raw server error messages with sanitized user-friendly text.

**Priority**: HIGH

---

## References

**Scan Finding**: [VULN-011-S-scan-finding.md](VULN-011-S-scan-finding.md)  
**Threat Model References**: TM-005, TM-008  
**Attack Surface References**: AS-013

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
