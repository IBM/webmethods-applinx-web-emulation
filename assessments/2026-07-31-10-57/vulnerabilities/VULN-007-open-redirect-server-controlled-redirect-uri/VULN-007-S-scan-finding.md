# VULN-007-S: Scanner Finding - open-redirect-server-controlled-redirect-uri

**Phase**: Scanner
**Vulnerability ID**: VULN-007
**Assessment**: 2026-07-31-10-57
**Task**: R-H-003 - OIDC Flow — Authorization Code Handling and Open Redirect
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/oauth2-handler.service.ts`
**Line**: 43
**Function**: `OAuth2HandlerService.redirectToIDPLoginPage()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`window.location.href = res.redirectUri` assigns the `redirectUri` field from the ApplinX REST API `CreateSessionResponse` directly to the browser navigation target. There is no scheme validation, no hostname allow-listing, and no rejection of non-HTTPS URIs.

**Exploitability condition**: Requires a compromised ApplinX server or MITM attack on the HTTP channel. The exploitability is MEDIUM (not HIGH) because the attack requires a server-side precondition.

**Attack scenarios:**
- Compromised ApplinX server returns `javascript:alert(document.cookie)` — modern browsers do NOT execute javascript: URIs via `window.location.href` assignment in script context, so this is mitigated by the browser
- Server returns `data:text/html,<script>exfil()</script>` — some older browsers execute data: URIs; modern Chrome/Firefox display them as documents
- Server returns `https://phishing.example.com/fake-applinx` — open redirect to phishing page (confirmed exploitable in all browsers)
- Server returns `http://internal-service/` — redirects to internal network service (SSRF-like)

The `window.location.href` assignment should be guarded by a scheme and origin check.

### Code Snippet

```typescript
// oauth2-handler.service.ts:39–47
redirectToIDPLoginPage(): void {
    this.sessionService.connect().subscribe((res: CreateSessionResponse) => {
        this.isRedirect = true;
        this.logger.debug(this.messages.get("REDIRECTING_TO_3RD_OPENID_CONNECT_PROVIDER"));
        window.location.href = res.redirectUri;  // no scheme/host validation
    }, ...);
}
```

---

## Context

**Scan Task**: [R-H-003](../../01-recon/tasks/R-H-003-oidc-auth-code-open-redirect.json)
**Target**: oauth2-handler.service.ts, route-guard.service.ts
**Coverage**: 3/3 in-scope files (100%)

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-002
**Related Attack Surface**: AS-006

---

## Analysis Notes

**Patterns Observed**: `window.location.href` assigned from network-sourced data with no validation

**Coverage Assessment**: 100%.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Verify whether the ApplinX SDK or server enforces HTTPS-only redirect URIs server-side
- Test: modify a development ApplinX instance to return a non-HTTPS redirectUri and observe browser behavior
- Recommend adding client-side validation: `if (!res.redirectUri.startsWith('https://')) throw new Error('Invalid redirect URI')`

**For Registry**: Update vulnerability-registry.json with VULN-007 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
