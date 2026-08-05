# VULN-008-S: Scanner Finding - bearer-token-sessionStorage

**Phase**: Scanner
**Vulnerability ID**: VULN-008
**Assessment**: 2026-07-31-10-57
**Task**: R-H-004 - Credential and Token Storage — sessionStorage, Macro Passwords
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/storage.service.ts`
**Line**: 44–45
**Function**: `StorageService.setConnected()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The ApplinX REST API session Bearer token is stored in `sessionStorage['gx_token']`. `sessionStorage` is accessible to all JavaScript code executing in the same origin — it is NOT protected by `HttpOnly` or `Secure` cookie semantics.

The token is the single authentication artifact for all subsequent ApplinX REST API calls. Any XSS vulnerability in the application — including VULN-001 (CSS injection via `bypassSecurityTrustStyle`) — would give an attacker immediate read access to `gx_token`, enabling full session hijacking.

The `StorageService` constructor calls `sessionStorage.clear()` on initialization (line 35), and `setNotConnected()` calls `sessionStorage.removeItem('gx_token')` (line 53). However, `idPcode` and `userName` are NOT removed on disconnect (covered by VULN-009 and VULN-010).

The token is also directly read in `logger.service.ts:19` — outside the centralized `StorageService`, violating the intended token access boundary.

### Code Snippet

```typescript
// storage.service.ts:44–58
setConnected(authToken: string): void {
    sessionStorage.setItem('gx_token', authToken);  // JS-accessible, no HttpOnly
    this.logger.setCustomHttpHeaders(
        new HttpHeaders({ "Authorization": this.getAuthToken() })
    );
    this.router.navigate(['instant']);
}
getAuthToken(): string {
    return 'Bearer ' + sessionStorage.getItem('gx_token');
}

// logger.service.ts:19 — duplicate token read outside StorageService boundary
getAuthToken(): string {
    return 'Bearer ' + sessionStorage.getItem('gx_token');
}
```

---

## Context

**Scan Task**: [R-H-004](../../01-recon/tasks/R-H-004-credential-token-storage.json)
**Target**: storage.service.ts, oauth2-handler.service.ts, shared.service.ts, webLogin.component.ts
**Coverage**: 14/14 in-scope files (100%)

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-001, TM-006
**Related Attack Surface**: AS-007

---

## Analysis Notes

**Patterns Observed**: Token in sessionStorage; no HttpOnly cookie; duplicate token access in logger.service.ts

**Coverage Assessment**: 100%.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Assess whether the ApplinX REST API supports HttpOnly cookie-based auth (would eliminate JS-accessible token)
- If not, assess whether the token lifetime is short enough to limit hijack windows
- Verify all token read points are centralized through StorageService (logger.service.ts is a violation)
- Evaluate combined attack chain: VULN-001 CSS injection → gx_token exfil → session hijack

**For Registry**: Update vulnerability-registry.json with VULN-008 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
