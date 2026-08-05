# VULN-010-S: Scanner Finding - username-sessionStorage-no-cleanup

**Phase**: Scanner
**Vulnerability ID**: VULN-010
**Assessment**: 2026-07-31-10-57
**Task**: R-H-004 - Credential and Token Storage — sessionStorage, Macro Passwords
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/webLogin/webLogin.component.ts`
**Line**: 137
**Function**: `WebLoginComponent.handleSimpleAuth()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The username is stored in `sessionStorage['userName']` at login time as a JSON-stringified lowercase string. It is never removed on logout or disconnect — `setNotConnected()` only removes `gx_token`. It persists across sessions in the same tab.

The value is used by both `macro.component.ts:83` (with a fragile `substr(1, length-2)` to strip JSON quotes) and `app.component.ts:638` (without optional chaining — throws TypeError if null).

An attacker who can write to `sessionStorage` via XSS (e.g., VULN-001) can overwrite `userName` to inject a crafted value that routes macro API calls to a different user's macro file namespace.

### Code Snippet

```typescript
// webLogin.component.ts:137
sessionStorage.setItem("userName", JSON.stringify(this.username.value.toLowerCase()));

// macro.component.ts:83–84
let userName = sessionStorage.getItem('userName');
this.user = userName?.substr(1, userName.length - 2)  // fragile JSON quote stripping

// app.component.ts:638–639 — no null guard
let tempUserName = sessionStorage.getItem('userName');
this.userName = tempUserName.substr(1, tempUserName.length-2);  // TypeError if null

// storage.service.ts:51–55 — setNotConnected() — userName NOT removed
```

---

## Context

**Scan Task**: [R-H-004](../../01-recon/tasks/R-H-004-credential-token-storage.json)
**Target**: webLogin.component.ts, storage.service.ts, macro.component.ts
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Add `removeItem('userName')` to `setNotConnected()`; fix `app.component.ts:639` null guard; use proper JSON.parse() for value recovery instead of fragile substr stripping

**For Registry**: Update vulnerability-registry.json with VULN-010 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
