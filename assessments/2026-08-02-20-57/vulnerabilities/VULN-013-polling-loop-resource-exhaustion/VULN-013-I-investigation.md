# VULN-013-I: Investigation Report - polling-loop-resource-exhaustion

**Phase**: Inquisitor
**Vulnerability ID**: VULN-013
**Descriptor**: polling-loop-resource-exhaustion
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: LOW

---

## Root Cause Analysis

`stopHostScreenUpdate()` is defined correctly in `NavigationService` but has zero call sites in the entire codebase. `StorageService.setNotConnected()` clears session tokens but does not call `stopHostScreenUpdate()`. The VULN-020 fix stored the `intervalId` correctly and created the stop method but failed to wire it into the logout path. After logout, the 5-second polling interval continues indefinitely. The `!isConnected()` guard in `checkScreenUpdated()` prevents any API calls from being made — the only consequence is wasted function calls every 5 seconds.

---

## Attack Scenario

User logs out from the ApplinX SPA. `setNotConnected()` clears tokens and navigates to `webLogin`. The `setInterval()` callback continues firing every 5 seconds, checking `!isConnected()` (returns true — no longer connected) and returning immediately. No API calls are made. Resource waste: ~1-2ms CPU per callback × 12 callbacks/minute = ~12-24ms/minute — negligible. No security escalation possible from this finding.

---

## Prerequisites

- User must authenticate and then logout
- Browser tab must remain open after logout

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated user (before logout)
**Achieved Privilege**: Same — no escalation possible from resource waste
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: LOW

### Impact Description

Trivial resource waste: one function call every 5 seconds after logout. The guard clause (`!isConnected()`) prevents any API calls or data access. No user data is accessed, no tokens are transmitted, no state is modified after logout. The polling interval fires harmlessly until the browser tab is closed.

---

## Data Flow Analysis

**Sources**:
- `NavigationService` constructor (line 66) — starts `setInterval` unconditionally on service instantiation

**Transformations**:
- `setNotConnected()` — clears session tokens but does NOT call `stopHostScreenUpdate()`
- `checkScreenUpdated()` fires every 5 seconds
- `!isConnected()` check returns true (not connected) → early return

**Sinks**:
- CPU/event loop: ~1-2ms per callback wasted
- No network requests, no data access, no side effects after `!isConnected()` guard

---

## Affected Components

### Direct Impact

- **NavigationService (`stopHostScreenUpdate` dead code)**: Polling interval not stopped on logout — VULN-020 fix incomplete
- **StorageService.setNotConnected()**: Does not call `stopHostScreenUpdate()`

### Indirect Impact

(none)

---

## Remediation Guidance

### Recommended Fix

Add a call to `this.navigationService.stopHostScreenUpdate()` in `StorageService.setNotConnected()`. This requires injecting `NavigationService` into `StorageService`. As a defense-in-depth, also add `stopHostScreenUpdate()` call to `AppComponent.ngOnDestroy()` and `AppComponent.onBrowserClose()`.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Call `stopHostScreenUpdate()` in `StorageService.setNotConnected()`
2. Call `stopHostScreenUpdate()` in `AppComponent.ngOnDestroy()` as defense-in-depth
3. Implement `ngOnDestroy()` in `NavigationService` to stop the interval when the service is destroyed
4. Consider lazy-starting the polling interval: only start after successful login, not in constructor

---

## References

**Scan Finding**: [VULN-013-S-scan-finding.md](VULN-013-S-scan-finding.md)

**Threat Model References**:
- TM-009

**Attack Surface References**:
- AS-001

**External References**:
- CWE-400: Uncontrolled Resource Consumption (minor — no real security risk here)
- VULN-020: Incomplete polling interval management — parent issue

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
