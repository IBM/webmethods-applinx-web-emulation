# VULN-003-S: Scanner Finding - oidc-open-redirect-scheme-bypass

**Phase**: Scanner
**Vulnerability ID**: VULN-003
**Descriptor**: oidc-open-redirect-scheme-bypass
**Assessment**: 2026-08-02-20-57
**Task**: R-H-001 - OIDC Auth Flow and Session Token Handling
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/oauth2-handler.service.ts`
**Line**: 49
**Function**: `redirectToIDPLoginPage`
**Detected By**: LLM analysis

---

## Preliminary Assessment

The VULN-007 fix validates `redirectUri` using `new URL(res.redirectUri)` and checks `parsed.protocol !== 'https:'`. However, protocol-relative URLs (`//evil.com`) are a known bypass: when a URL begins with `//`, the URL constructor inherits the protocol from the current document's location. If the application is served over HTTPS (as expected in production), `new URL('//evil.com')` returns `protocol='https:'` — the scheme check passes. The redirect then navigates `window.location.href` to the attacker-controlled IdP, which can steal the authorization code.

### Code Snippet

```typescript
let redirectUri: string;
try {
  const parsed = new URL(res.redirectUri);
  if (parsed.protocol !== 'https:') {
    throw new Error('Redirect URI must use https:');
  }
  redirectUri = parsed.href;
} catch (e) { return; }
window.location.href = redirectUri + separator + 'state=' + encodeURIComponent(state);
// BYPASS: new URL('//evil.com/path') → protocol: 'https:' (inherits from HTTPS page)
// parsed.protocol === 'https:' → check PASSES → redirects to evil.com
```

---

## Context

**Scan Task**: [R-H-001](../../01-recon/tasks/R-H-001-oidc-auth-session.md)
**Target**: oauth2-handler.service.ts, route-guard.service.ts, storage.service.ts, webLogin.component.ts
**Coverage**: 100% — all four target files read and all OIDC code paths traced

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-002: Open Redirect via Server-Supplied redirectUri — URL scheme validation must be robust

**Related Attack Surface**:
- AS-001: Browser ↔ ApplinX REST API trust boundary — redirectUri delivered by server
- AS-002: Browser ↔ OIDC Identity Provider trust boundary

---

## Analysis Notes

**Patterns Observed**:
- State nonce correctly generated (crypto.randomUUID()) and stored BEFORE redirect — GOOD
- Authorization code NOT stored in sessionStorage (VULN-009 correct) — GOOD
- Token cleared on logout — GOOD
- URL scheme check present (VULN-007) but bypassed by protocol-relative URLs — BAD
- Username stored in sessionStorage as JSON-stringified value — XSS exposure risk

**Coverage Assessment**: Complete — all four target files analyzed. Full OIDC flow traced: nonce generation, IdP redirect, callback validation, code exchange, token storage, logout cleanup.

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
- Test protocol-relative URL bypass: supply redirectUri='//evil.com/auth' and verify if new URL('//evil.com/auth') returns https: protocol when called on HTTPS page
- Verify if the redirect URL can reach an attacker-controlled IdP that would accept the OIDC code
- Assess: add hostname allowlist validation or verify redirectUri must match pre-registered IdP hostname
- Examine /instant route: does it re-execute code exchange? Is the authorization code in queryParams persisted in browser history?

**For Registry**:
- Assign VULN-003 to oidc-open-redirect-scheme-bypass
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
