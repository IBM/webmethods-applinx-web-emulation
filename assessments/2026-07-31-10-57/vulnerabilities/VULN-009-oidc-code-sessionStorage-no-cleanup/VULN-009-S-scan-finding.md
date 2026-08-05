# VULN-009-S: Scanner Finding - oidc-code-sessionStorage-no-cleanup

**Phase**: Scanner
**Vulnerability ID**: VULN-009
**Assessment**: 2026-07-31-10-57
**Task**: R-H-004 - Credential and Token Storage — sessionStorage, Macro Passwords
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/oauth2-handler.service.ts`
**Line**: 58
**Function**: `OAuth2HandlerService.sendCodeAndConnectSession()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The OIDC authorization code is stored in `sessionStorage['idPcode']` at line 58 before being used. The code is never removed — `setNotConnected()` only removes `gx_token`, not `idPcode`. The code persists in `sessionStorage` for the entire tab lifetime.

While authorization codes are intended to be single-use and short-lived, the storage is unnecessary (the code is already available as the `code` parameter) and creates a window where the stored value can be read by same-origin JavaScript (e.g., via XSS).

Additionally, storing the code BEFORE exchange completion means there is a race window between storage and exchange where a concurrent XSS could race to read a still-valid code.

### Code Snippet

```typescript
// oauth2-handler.service.ts:56–58
sendCodeAndConnectSession(code: string, appName?: string, connPool?: string): Observable<CreateSessionResponse> {
    this.isRedirect = false;
    sessionStorage.setItem('idPcode', code);  // written before exchange — never removed
    // ... exchange continues
}

// storage.service.ts:51–55 — setNotConnected() — only removes gx_token
setNotConnected(): void {
    sessionStorage.removeItem('gx_token');  // idPcode NOT removed here
    ...
}
```

---

## Context

**Scan Task**: [R-H-004](../../01-recon/tasks/R-H-004-credential-token-storage.json)
**Target**: oauth2-handler.service.ts, storage.service.ts
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-002
**Related Attack Surface**: AS-007

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Remove `sessionStorage.setItem('idPcode', code)` line (code already in function param); add `removeItem('idPcode')` to setNotConnected() if the store is kept

**For Registry**: Update vulnerability-registry.json with VULN-009 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
