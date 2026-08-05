# VULN-008-I: Investigation Report - oidc-state-consumed-before-validation

**Phase**: Inquisitor
**Vulnerability ID**: VULN-008
**Descriptor**: oidc-state-consumed-before-validation
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: FALSE_POSITIVE

---

## Investigation Summary

**Determination**: This finding has been determined to be a FALSE POSITIVE.

**Exploitability**: THEORETICAL

---

## Root Cause Analysis

Scanner identified the state `removeItem` at line 58 before the validation check at line 59 as a security issue. Investigation confirms this is correct OIDC behavior: the state parameter is a single-use CSRF token that must be consumed (deleted) regardless of validation outcome. If validation fails, the state is gone and no session is created — this is the intended defense. No CSRF window exists: the IdP authorization code is also single-use; an attacker cannot reuse a consumed state. The separate concern (poor error recovery if `sendCodeAndConnectSession` fails) is a UX reliability issue only.

---

## Attack Scenario

No viable attack exists against this pattern. Attacker sends user to `/?code=evil&state=wrong`. State is consumed, validation fails (mismatched), no session created, user redirected to `/webLogin`. Attacker cannot replay a valid code because: (1) the valid code was never submitted, (2) even if attacker had the valid code+state pair, the state is now consumed, and (3) IdP codes are one-time use. The `removeItem`-before-compare ordering creates no exploitable window.

---

## Prerequisites

- N/A — this is a false positive; no exploitation prerequisites exist for the claimed vulnerability

---

## Privilege Boundary Analysis

**Starting Privilege**: Unauthenticated user
**Achieved Privilege**: Unauthenticated user — no escalation
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: LOW

### Impact Description

No security impact from the state ordering. Residual availability concern: if `sendCodeAndConnectSession()` fails (network error), `catchError` does not explicitly navigate to `/webLogin`, leaving user on current URL without a clear recovery path. User can recover by manually navigating to `/webLogin` and clicking Login again.

---

## Data Flow Analysis

**Sources**:
- `route.queryParams.state` (OIDC callback URL parameter)
- `sessionStorage.getItem('oidc_state')` (previously stored nonce)

**Transformations**:
- `sessionStorage.removeItem('oidc_state')` — single-use consumption (correct OIDC practice)
- `receivedState !== storedState` comparison — CSRF validation
- `router.navigate(['webLogin'])` on mismatch

**Sinks**:
- `sendCodeAndConnectSession(idPcode)` — only reached when state validates correctly
- sessionStorage (state cleared, no residual)

---

## Affected Components

### Direct Impact

- **RouteGuardService.canActivate()**: No security impact. Reliability gap: catchError handler should call `router.navigate(['webLogin'])` explicitly.

### Indirect Impact

(none)

---

## Remediation Guidance

### Recommended Fix

No security fix required — the state ordering is correct. For reliability: in the `catchError` handler at lines 73-76, add an explicit `router.navigate(['webLogin'])` before returning `of(false)` to ensure users see the login screen when code exchange fails. Optionally add explicit `sessionStorage.removeItem('oidc_state')` in `StorageService.setNotConnected()` as defense-in-depth (currently relies on constructor `clear()`).

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Add `router.navigate(['webLogin'])` to `catchError` handler in `canActivate()` for explicit error recovery
2. Add `sessionStorage.removeItem('oidc_state')` to `StorageService.setNotConnected()` for defense-in-depth
3. Consider logging the code exchange failure to NGX logger for observability

---

## References

**Scan Finding**: [VULN-008-S-scan-finding.md](VULN-008-S-scan-finding.md)

**Threat Model References**:
- TM-001

**Attack Surface References**:
- AS-002
- AS-003

**External References**:
- RFC 6749 Section 10.12: CSRF — state parameter must be single-use
- OIDC Core 1.0 Section 3.1.2.1: state parameter lifecycle

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Closed (False Positive)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
