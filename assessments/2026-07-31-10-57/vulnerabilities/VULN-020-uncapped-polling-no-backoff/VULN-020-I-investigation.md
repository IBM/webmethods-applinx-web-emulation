# VULN-020-I: Investigation Report - uncapped-polling-no-backoff

**Phase**: Inquisitor
**Vulnerability ID**: VULN-020
**Descriptor**: uncapped-polling-no-backoff
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

[`NavigationService.checkHostScreenUpdate()`](src/app/services/navigation/navigation.service.ts:73) calls `setInterval()` and discards the return value — the interval ID is never stored, so `clearInterval()` cannot be called. This means the polling interval runs for the entire page lifetime with no way to stop it programmatically. Additionally: (1) `CHECK_HOST_SCREEN_UPDATE_INTERVAL` and `CHECK_HOST_SCREEN_UPDATE_TIMEOUT` are public mutable fields — any code can change polling frequency; (2) `isThereError` only stops polling for 3 hardcoded error message strings — other error conditions continue polling; (3) no exponential backoff on repeated errors. Combined with the null dereference in `errorHandler` (VULN-011), polling continues silently even after a crash.

---

## Attack Scenario

**Self-Inflicted DoS**: Under adverse network conditions, polling generates continuous failed HTTP requests to ApplinX. With no backoff, requests pile up. Combined with null dereference (VULN-011), `errorHandler` crashes abnormally, `isThereError` is never set to `true` for non-matching error strings, and polling continues indefinitely — flooding the ApplinX server with requests from all affected clients simultaneously.

**Interval Storm**: If `NavigationService` is instantiated multiple times (e.g., module reloading, navigation events), multiple intervals may be started. Without `clearInterval()`, each accumulates. The polling rate multiplies with each instance.

Note: An unauthenticated external attacker cannot directly control the polling — this is a client-side issue. The impact is to the ApplinX server load and the client browser experience.

---

## Prerequisites

- User must be logged in (`checkHostScreenUpdate` starts in `NavigationService` constructor)
- Adverse network conditions or ApplinX server issues trigger error responses
- `errorHandler` crash (VULN-011) allows polling to continue on some error types

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated user
**Achieved Privilege**: N/A — no privilege escalation
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: LOW

### Impact Description

Polling without backoff can generate excessive requests to ApplinX under error conditions. The discarded `setInterval` ID prevents programmatic stop. Public mutable interval fields allow unintended external modification. Combined with VULN-011 (errorHandler crash), some error conditions can cause continuous polling without `isThereError=true` ever being set.

---

## Data Flow Analysis

**Sources**:
- `setInterval()` return value — immediately discarded

**Transformations**:
- No `clearInterval()` call possible — interval runs for page lifetime
- `isThereError` guards only 3 hardcoded error strings — other errors don't stop polling

**Sinks**:
- ApplinX REST API `getScreenNumber()` — called every 5 seconds indefinitely
- Browser HTTP connection pool — concurrent requests consume connections

---

## Affected Components

### Direct Impact

- **[`NavigationService.checkHostScreenUpdate()`](src/app/services/navigation/navigation.service.ts:73)**: `setInterval` ID discarded — no programmatic stop possible
- **`NavigationService.CHECK_HOST_SCREEN_UPDATE_INTERVAL` (public)**: Public mutable field — any code can change polling frequency

### Indirect Impact

- **VULN-011 (errorHandler null deref)**: When `errorHandler` crashes, `isThereError` never set true → polling continues on some error types
- **ApplinX REST API /info endpoint**: Polling target — excessive requests under error conditions

---

## Remediation Guidance

### Recommended Fix

Store the `setInterval` return value and implement `clearInterval` in `ngOnDestroy`. Convert to RxJS `interval` observable with `takeUntil(destroy$)` for Angular lifecycle management. Add exponential backoff with jitter: after 3 consecutive errors, increase interval by 2x up to max 60s.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Store interval ID and call `clearInterval(this.intervalId)` in `ngOnDestroy`
2. Convert to RxJS: `interval(5000).pipe(takeUntil(this.destroy$), switchMap(() => this.checkScreenUpdated()))`
3. Add exponential backoff: double interval after consecutive errors, cap at 60s
4. Make `CHECK_HOST_SCREEN_UPDATE_INTERVAL` private readonly
5. Fix VULN-011 null guard to ensure all error paths properly set `isThereError`

---

## References

**Scan Finding**: [vulnerabilities/VULN-020-uncapped-polling-no-backoff/VULN-020-S-scan-finding.md](vulnerabilities/VULN-020-uncapped-polling-no-backoff/VULN-020-S-scan-finding.md)

**Threat Model References**:
- TM-009

**Attack Surface References**:
- AS-015

**External References**:
- CWE-400: Uncontrolled Resource Consumption
- OWASP A04:2021 — Insecure Design
- CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L — Score: 4.3 MEDIUM (self-inflicted load amplification)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
