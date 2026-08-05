# VULN-008-S: Scanner Finding - oidc-state-consumed-before-validation

**Phase**: Scanner
**Vulnerability ID**: VULN-008
**Descriptor**: oidc-state-consumed-before-validation
**Assessment**: 2026-08-02-20-57
**Task**: R-H-001 - OIDC Auth Flow and Session Token Handling
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/route-guard.service.ts`
**Line**: 54
**Function**: `canActivate`
**Detected By**: LLM analysis

---

## Preliminary Assessment

The OIDC state parameter (VULN-003 fix) is consumed (`removeItem`) at line 58 BEFORE the validation comparison at line 59. While single-use consumption is correct behavior, if `sendCodeAndConnectSession()` at line 72 fails after `canActivate()` returns true, the session is orphaned: state consumed, code exchange attempted but token never stored. The `catchError` handler logs the error and returns `of(false)` but does not explicitly clean up any partial session state. This affects reliability of OIDC retry flows.

### Code Snippet

```typescript
} else if (idPcode) {
  const receivedState = route.queryParams.state;
  const storedState = sessionStorage.getItem('oidc_state');
  sessionStorage.removeItem('oidc_state');  // LINE 58: consumed BEFORE validation at line 59
  if (!receivedState || !storedState || receivedState !== storedState) {
    this.router.navigate(['webLogin']);
    return false;
  }
  // ... sendCodeAndConnectSession() at line 72 ...
  // If this fails: state already consumed, token never stored, orphaned session
```

---

## Context

**Scan Task**: [R-H-001](../../01-recon/tasks/R-H-001-oidc-auth-session.md)
**Target**: oauth2-handler.service.ts, route-guard.service.ts, storage.service.ts, webLogin.component.ts
**Coverage**: 100% — all four target files read

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-001: OIDC State Parameter Bypass / CSRF Code Injection

**Related Attack Surface**:
- AS-002: Browser ↔ OIDC Identity Provider — state nonce, code in URL query params
- AS-003: sessionStorage — gx_token, oidc_state, userName lifecycle

---

## Analysis Notes

**Patterns Observed**:
- State consumed at line 58 before validation at line 59 — ordering issue
- Single-use consumption is correct; the issue is post-failure cleanup
- catchError at line 73-76 does not explicitly clean up orphaned session state

**Coverage Assessment**: Complete — full OIDC flow analyzed. Secondary finding from R-H-001 scan; primary finding for this task is VULN-003 (open redirect).

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

This finding requires detailed investigation by the Inquisitor phase to:
- Confirm exploitability
- Assess real-world impact
- Identify affected components
- Recommend remediation strategy

---

## Next Steps

**For Inquisitor**:
- Verify what happens when sendCodeAndConnectSession() fails: can user retry OIDC flow successfully?
- Test: OIDC flow → intentionally break code exchange → attempt OIDC retry — verify app recovers
- Evaluate whether state ordering creates any CSRF window during the fail-and-retry path

**For Registry**:
- Assign VULN-008 to oidc-state-consumed-before-validation
- Set status: flagged, severity: medium

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
