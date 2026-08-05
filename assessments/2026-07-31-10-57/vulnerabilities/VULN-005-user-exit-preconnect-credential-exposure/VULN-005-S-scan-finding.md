# VULN-005-S: Scanner Finding - user-exit-preconnect-credential-exposure

**Phase**: Scanner
**Vulnerability ID**: VULN-005
**Descriptor**: user-exit-preconnect-credential-exposure
**Assessment**: 2026-07-31-10-57
**Task**: R-M-001 - User-Exit Extensibility — IUserExits, GXGeneratedPage, and JSFunctionsService
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/user-exits/IUserExits.ts`
**Line**: 24
**Function**: `IUserExits.preConnect()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The `IUserExits.preConnect()` interface accepts `authHeader?: string` as a parameter. This parameter carries the raw Basic-auth credential in the form `"Basic <base64(username:password)>"`. Base64 encoding is trivially reversible. This value is propagated to every registered `IUserExits` implementation with no masking, hashing, or truncation.

**Data flow:**
```
webLogin.component.ts:150
authHeader = 'Basic ' + btoa(unescape(encodeURIComponent(username + ':' + password)));

webLogin.component.ts:101
this.userExitsEventThrower.firePreConnect(createSessionRequest, authHeader);
  → fires preConnect(createSessionRequest, authHeader) on all registered IUserExits implementations
```

Any custom `IUserExits` implementation — whether written by a legitimate integrator or installed via the `clearEventListeners()` replacement described in VULN-004 — receives the plaintext-equivalent credential. There is nothing preventing it from logging, exfiltrating, or storing it.

Additionally, `firePostConnect()` delivers the full `CreateSessionResponse` to all listeners, which includes the Bearer token.

### Code Snippet

```typescript
// IUserExits.ts:24
preConnect(createSessionRequest: CreateSessionRequest, authHeader?: string);

// webLogin.component.ts:148-152
authHeader = 'Basic ' + btoa(unescape(encodeURIComponent(
    this.username.value + ':' + this.password.value)));  // base64(user:pass)
this.sessionConnect(createSessionRequest, authHeader);
// → userExitsEventThrower.firePreConnect(createSessionRequest, authHeader)
// → all registered IUserExits.preConnect() receive authHeader
```

---

## Context

**Scan Task**: [R-M-001](../../01-recon/tasks/R-M-001-user-exits-extensibility.json)
**Target**: IUserExits.ts, AbstractUserExits.ts, LifecycleUserExits.ts, GXGeneratedPage.ts
**Coverage**: 9/9 in-scope files examined (100%)

**Tools Used**:
- LLM static analysis (no external tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-006: Bearer token and credentials in sessionStorage — accessible to same-origin scripts

**Related Attack Surface**:
- AS-012: User-exit event bus — preConnect hook receives full credential

---

## Analysis Notes

**Patterns Observed**:
- `authHeader` is passed as a plain string through the entire event bus with no sanitization
- `AbstractUserExits.preConnect()` default is a no-op — no protective wrapper
- All service accessors in `AbstractUserExits` (lines 94–110) expose live service instances to subclasses, compounding the risk

**Coverage Assessment**: 100%.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Assess whether credential-in-parameter is architecturally necessary or can be replaced with a token-only model
- Verify whether any existing user-exit implementation logs or stores the authHeader value
- Recommend: strip or hash authHeader before passing to user-exit hooks; only pass a sanitized `{username, timestamp}` object instead of the full credential

**For Scanner**:
- No follow-up needed

**For Registry**:
- Update vulnerability-registry.json with VULN-005 as flagged HIGH

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
