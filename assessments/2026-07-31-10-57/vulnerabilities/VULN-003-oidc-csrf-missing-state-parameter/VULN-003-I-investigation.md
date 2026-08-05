# VULN-003-I: Investigation Report - oidc-csrf-missing-state-parameter

**Phase**: Inquisitor
**Vulnerability ID**: VULN-003
**Descriptor**: oidc-csrf-missing-state-parameter
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

The OpenID Connect authorization code flow implemented in [`RouteGuardService`](src/app/services/route-guard.service.ts:51) and [`OAuth2HandlerService`](src/app/services/oauth2-handler.service.ts:39) contains zero OAuth2 state parameter handling. `redirectToIDPLoginPage()` initiates the IdP redirect with no state generation. On callback, `route.queryParams.code` is extracted with no state validation. RFC 6749 Section 10.12 and the OAuth 2.0 Security Best Current Practice (RFC 9700) mandate state parameter validation to prevent CSRF. Without state, any party able to craft a URL with a valid OIDC code can inject that code into a victim's session.

---

## Attack Scenario

**CSRF Authorization Code Injection**:
1. Attacker registers with the same OIDC IdP and obtains a valid authorization code for this application's `client_id`
2. Attacker crafts URL: `https://app.example.com/instant?code=ATTACKER_CODE`
3. Attacker tricks victim into visiting this URL (phishing, clickjacking, XSS redirect)
4. [`RouteGuardService.canActivate()`](src/app/services/route-guard.service.ts:51) extracts `ATTACKER_CODE` — no state check
5. [`OAuth2HandlerService.sendCodeAndConnectSession()`](src/app/services/oauth2-handler.service.ts:56) sends code to ApplinX REST API
6. ApplinX REST API exchanges code — creates session for the **attacker's** OIDC identity
7. Victim's browser is now logged in as the attacker's identity
8. Victim unknowingly performs host terminal operations under attacker's account

---

## Prerequisites

- OIDC authentication mode must be configured (ApplinX `/info` returns `auth=OPEN_ID_CONNECT`)
- Attacker must have a valid OIDC account at the same IdP and obtain a valid auth code for this application
- Attacker must deliver the crafted URL to the victim (phishing, XSS redirect, clickjacking)
- ApplinX REST API must not perform server-side user-agent binding beyond code validation

---

## Privilege Boundary Analysis

**Starting Privilege**: Attacker with valid IdP account (cannot authenticate as victim)
**Achieved Privilege**: Victim's browser session bound to attacker's OIDC identity — session fixation enabling cross-account attack
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: HIGH
**Availability**: NONE

### Impact Description

Session fixation to attacker's OIDC identity: victim performs mainframe terminal operations under attacker's account. If attacker's account has elevated privileges (admin OIDC identity), victim unknowingly gains those privileges. Compounded by VULN-009: the authorization code is also stored in sessionStorage and never cleaned up.

---

## Data Flow Analysis

**Sources**:
- Browser URL query parameter: `route.queryParams.code` — attacker-controlled in CSRF scenario
- Browser navigation to attacker-crafted URL

**Transformations**:
- `const idPcode = route.queryParams.code` — line 51, no state validation, no nonce check
- `sessionStorage.setItem('idPcode', code)` — stored without cleanup (VULN-009)
- `this.oAuth2handler.sendCodeAndConnectSession(idPcode, ...)` — forwarded to ApplinX REST API

**Sinks**:
- ApplinX REST API `SessionService.connect()` — code exchanged for session token
- `storageService.setConnected(res.token)` — attacker-identity session token stored and used for all subsequent API calls

---

## Affected Components

### Direct Impact

- **[`RouteGuardService.canActivate()`](src/app/services/route-guard.service.ts:51)**: OIDC code extracted from URL with no state validation
- **[`OAuth2HandlerService.redirectToIDPLoginPage()`](src/app/services/oauth2-handler.service.ts:39)**: No state parameter generated before IdP redirect
- **[`OAuth2HandlerService.sendCodeAndConnectSession()`](src/app/services/oauth2-handler.service.ts:56)**: Code forwarded without state validation

### Indirect Impact

- **`StorageService.setConnected()`**: Attacker's session token stored — victim authenticates as attacker
- **VULN-009**: Code persists in sessionStorage after exchange, compounding exposure

---

## Classification Refinement

### Initial Classification (Scanner)
- CWE: CWE-352
- OWASP: A07:2021
- CVSS: 7.0 (HIGH)

### Refined Classification (Inquisitor)
- CWE: CWE-352, CWE-384 (Session Fixation)
- OWASP: A07:2021 — Identification and Authentication Failures
- CVSS: **6.8 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:H/I:H/A:N`

### Justification
- **PR: Low** — attacker must have valid IdP account to obtain a valid code for this application's `client_id`
- **AC: High** — requires attacker to trick victim into clicking crafted URL
- Standard OAuth2 CSRF textbook vulnerability (RFC 6749 §10.12 violation)

---

## Remediation Guidance

### Recommended Fix

Generate a cryptographic state parameter before IdP redirect:
```typescript
const state = crypto.randomUUID();
sessionStorage.setItem('oidc_state', state);
// Append to IdP redirect URL
```
On callback, validate state before processing code:
```typescript
if (route.queryParams.state !== sessionStorage.getItem('oidc_state')) {
  this.router.navigate(['webLogin']); return false;
}
sessionStorage.removeItem('oidc_state');
```

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Use `crypto.randomUUID()` or `crypto.getRandomValues()` for state — never `Math.random()`
2. Implement PKCE (Proof Key for Code Exchange) as additional binding mechanism
3. Validate state before ANY OIDC callback processing
4. Fix VULN-009: remove `idPcode` from sessionStorage after successful exchange

---

## References

**Scan Finding**: [VULN-003-S-scan-finding.md](VULN-003-S-scan-finding.md)

**Threat Model References**:
- TM-002

**Attack Surface References**:
- AS-005, AS-006

**External References**:
- RFC 6749 Section 10.12 — Cross-Site Request Forgery
- RFC 9700 — OAuth 2.0 Security Best Current Practice
- CWE-352: Cross-Site Request Forgery (CSRF)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
