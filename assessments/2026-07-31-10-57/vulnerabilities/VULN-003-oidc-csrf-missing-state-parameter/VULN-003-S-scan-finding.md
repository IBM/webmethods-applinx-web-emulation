# VULN-003-S: Scanner Finding - oidc-csrf-missing-state-parameter

**Phase**: Scanner
**Vulnerability ID**: VULN-003
**Descriptor**: oidc-csrf-missing-state-parameter
**Assessment**: 2026-07-31-10-57
**Task**: R-H-003 - OIDC Flow — Authorization Code Handling and Open Redirect
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/route-guard.service.ts`
**Line**: 51–62
**Function**: `RouteGuardService.canActivate()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The OIDC authorization code flow implementation in `RouteGuardService` accepts authorization codes from URL query parameters without any OAuth2 `state` parameter validation. RFC 6749 §10.12 mandates that clients generate an unguessable `state` value, include it in the authorization request, and verify it matches on the redirect callback. Neither generation nor validation occurs anywhere in this codebase.

**CSRF / Code Injection Attack:**
1. Attacker navigates victim's browser to the OIDC initiation endpoint → victim's browser starts an OIDC flow
2. Attacker simultaneously completes their own OIDC login to obtain a valid authorization code
3. Attacker injects their code into victim's browser (via CSRF: e.g., `<img src="https://app/instant?code=ATTACKER_CODE">`) before the victim completes login
4. `RouteGuardService.canActivate()` extracts `route.queryParams.code` at line 51 and calls `sendCodeAndConnectSession(idPcode, ...)` at line 62
5. The attacker's code is exchanged → the victim's browser session is bound to the attacker's identity (**account hijacking**)

**Additional issue — query parameter forwarding:**
At line 56, when `url === 'webLogin'` and `idPcode` is present, ALL query parameters are forwarded:
```typescript
this.router.navigate(['instant', { queryParams: route.queryParams }]);
```
Attacker-controlled query parameters beyond `code` propagate into the `instant` route unnecessarily.

### Code Snippet

```typescript
// route-guard.service.ts:51–62
const idPcode = route.queryParams.code;  // extracted from URL, no state validation
if (isLoggedIn && (url === 'instant' || url === screenName)) {
  return true;
} else if (idPcode) {
  if (url === 'webLogin') {
    this.router.navigate(['instant', { queryParams: route.queryParams }]);  // ALL params forwarded
    return true;
  }
  return this.configurationService.getConfigObservable()
  .pipe(
    mergeMap((config) => {
      return this.oAuth2handler.sendCodeAndConnectSession(idPcode, ...);  // no state check
    })
  )
}
// No state parameter generated in redirectToIDPLoginPage() either:
// oauth2-handler.service.ts:43 window.location.href = res.redirectUri (no ?state= appended)
```

---

## Context

**Scan Task**: [R-H-003](../../01-recon/tasks/R-H-003-oidc-auth-code-open-redirect.json)
**Target**: oauth2-handler.service.ts, route-guard.service.ts, webLogin.component.ts
**Coverage**: 3/3 in-scope files examined (100%)

**Tools Used**:
- LLM static analysis (no external tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-002: OIDC Authorization Code Injection / Open Redirect — crafted redirectUri or code replay

**Related Attack Surface**:
- AS-005: URL Query Parameters ↔ RouteGuardService — OIDC code from URL passed to REST API
- AS-006: ApplinX REST API /session connect response — redirectUri field used for window.location.href

---

## Analysis Notes

**Patterns Observed**:
- Zero state parameter handling anywhere in the OIDC flow (confirmed by searching entire codebase for 'state', 'nonce', 'crypto.getRandomValues', 'localStorage.setItem')
- `route.queryParams.code` extracted directly from URL without anti-CSRF protection
- `router.navigate` at line 56 forwards all query params — unnecessary widening of attack surface
- `idPcode` written to sessionStorage and never removed (related: VULN-009)

**False Positives**:
- `autoLogin()` — only fires when auth=DISABLED, not an OIDC concern
- `idPcode` check at line 54 — intended functionality, not a bypass; the issue is the missing state check

**Coverage Assessment**: 100%. All three target files fully read. Full OIDC flow traced from initiation to callback.

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
- Confirm that `sendCodeAndConnectSession()` is the only path where OIDC codes are processed (no secondary handler)
- Verify whether the ApplinX IdP integration imposes its own CSRF protection that would compensate for the missing client-side state check
- Construct CSRF PoC: attacker code injection via cross-origin iframe to the OIDC callback URL
- Check whether the `code` query param from the IdP callback is validated server-side by ApplinX before session creation
- Assess whether the `queryParams` forwarding at line 56 can be used to inject values into subsequent `instant` route navigation

**For Scanner**:
- No follow-up needed

**For Registry**:
- Update vulnerability-registry.json with VULN-003 as flagged HIGH

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
