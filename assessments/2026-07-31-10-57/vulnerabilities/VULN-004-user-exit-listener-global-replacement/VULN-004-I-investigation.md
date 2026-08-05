# VULN-004-I: Investigation Report - user-exit-listener-global-replacement

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-004  
**Descriptor**: user-exit-listener-global-replacement  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as a design-level API flaw.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: LOW (requires developer/deployer access)

---

## Root Cause Analysis

[`GXGeneratedPage.addUserExits()`](src/app/generated-pages/GXGeneratedPage.ts:88) calls `this.userExitsEventThrower.clearEventListeners()` **unconditionally** before adding the caller's user-exit implementation. [`clearEventListeners()`](src/app/services/user-exits-event-thrower.service.ts:28) destructively empties the `_userExitsList` array — removing ALL previously registered listeners from the root-scoped singleton `UserExitsEventThrowerService`. Any `GXGeneratedPage` subclass calling `addUserExits()` silently removes all security and audit hooks registered by other application parts.

---

## Attack Scenario

**Malicious Generated Page Component**: Developer creates a `GXGeneratedPage` subclass that calls `this.addUserExits(new MaliciousUserExits())`. The `MaliciousUserExits` implementation's `preConnect()` captures the `authHeader` credential (VULN-005), `postConnect()` captures the Bearer token, and `preSendKey/postSendKey` captures all keystrokes and screen data. Upon component activation, all legitimate security hooks are silently cleared. For the remainder of the session, all lifecycle events go exclusively to the malicious implementation.

---

## Prerequisites

- Attacker must have source code access and ability to deploy a custom `GXGeneratedPage` subclass
- The malicious component must be loaded/instantiated during a user session
- Knowledge of the `IUserExits` interface

---

## Privilege Boundary Analysis

**Starting Privilege**: Developer with code repository and deployment access
**Achieved Privilege**: Ability to disable all security lifecycle hooks and capture session credentials + terminal data
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW  
**Integrity**: LOW  
**Availability**: NONE

### Impact Description

Security lifecycle hook displacement allows: (1) silent removal of all audit/monitoring user exits, (2) installation of credential-capturing hooks (VULN-005 authHeader accessible). Risk is architectural — security controls can be silently removed by any generated page component. Requires developer-level access to deploy.

---

## Data Flow Analysis

**Sources**:
- `GXGeneratedPage` subclass (customer-written or ApplinX-generated code component)

**Transformations**:
- `addUserExits(maliciousImpl)` calls `clearEventListeners()` — empties `_userExitsList` globally
- All subsequent `firePreConnect`, `firePostConnect`, `firePreSendKey` events dispatched to malicious impl

**Sinks**:
- Malicious `IUserExits.preConnect()` — receives `authHeader` credential (VULN-005)
- Malicious `IUserExits.postConnect()` — receives `CreateSessionResponse` including Bearer token
- Malicious `IUserExits.preSendKey/postSendKey` — receives all keystrokes and screen responses

---

## Affected Components

### Direct Impact

- **[`GXGeneratedPage.addUserExits()`](src/app/generated-pages/GXGeneratedPage.ts:88)**: Unconditional global listener clear
- **[`UserExitsEventThrowerService.clearEventListeners()`](src/app/services/user-exits-event-thrower.service.ts:28)**: Destructive global operation

### Indirect Impact

- **`LifecycleUserExits`**: Silently displaced; security audit events stop
- **VULN-005 (authHeader in preConnect)**: Malicious displacement enables credential capture

---

## Classification Refinement

### Initial Classification (Scanner)
- CVSS: 8.2 (HIGH)

### Refined Classification (Inquisitor)
- CWE: CWE-269, CWE-284
- CVSS: **3.8 (LOW)**
- Vector: `CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:L/I:L/A:N`

### Justification
- **AV:L** — requires local developer access to deploy malicious component
- **PR:H** — requires high privilege (developer + deployment capability)
- Insider threat model, not external attack

---

## Remediation Guidance

### Recommended Fix

Remove `clearEventListeners()` from `addUserExits()`. Implement component-lifecycle-scoped user-exit registration using Angular `ngOnDestroy` to automatically unregister listeners.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Remove `clearEventListeners()` from `addUserExits()` — change to append-only
2. Tie user-exit registration to component lifecycle (`ngOnDestroy` removes registered exits)
3. Log all `clearEventListeners()` calls with stack trace
4. Require security review of all `GXGeneratedPage` subclasses calling `addUserExits()`

---

## References

**Scan Finding**: [VULN-004-S-scan-finding.md](VULN-004-S-scan-finding.md)  
**Threat Model References**: TM-003  
**Attack Surface References**: AS-012

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
