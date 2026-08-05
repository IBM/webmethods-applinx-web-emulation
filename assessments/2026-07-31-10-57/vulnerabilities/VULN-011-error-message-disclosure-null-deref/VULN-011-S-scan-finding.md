# VULN-011-S: Scanner Finding - error-message-disclosure-null-deref

**Phase**: Scanner
**Vulnerability ID**: VULN-011
**Assessment**: 2026-07-31-10-57
**Task**: R-M-002 - Error Message Information Disclosure and Log Injection
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/navigation/navigation.service.ts`
**Line**: 102–121
**Function**: `NavigationService.errorHandler()`
**Detected By**: LLM static analysis

Secondary location: `src/app/webLogin/webLogin.component.ts:155–159` (`handleError()`)

---

## Preliminary Assessment

Two separate but related issues:

**Issue A — Null dereference in errorHandler():**
`errorResponse.error.message.indexOf(...)` at line 103 assumes `errorResponse.error` is a non-null object with a `.message` string property. Angular `HttpErrorResponse` can carry a `null` error body (network-level errors produce `error: null` or `error: ProgressEvent`). This throws `TypeError: Cannot read properties of null (reading 'message')` — an uncaught exception in the setInterval polling hot path.

The **security impact**: the disconnect detection logic (`isThereError = true`) depends on this code path. If the errorHandler throws before reaching the `isThereError = true` assignment at line 109, the polling continues indefinitely and the host disconnection event is silently ignored — the session appears active when it is not. Additionally, `screenLockerService.setLocked(false)` at line 172 is called AFTER `errorHandler` in `sendKeysInternal()`, so a throw in errorHandler permanently locks the screen, disabling user keyboard input.

**Issue B — Information disclosure in UI:**
`webLogin.component.ts:157` sets `this.errorMessage = errorResponse.error.message || errorResponse.message`. This displays raw server error messages in the UI via `{{errorMessage}}` interpolation (safe — no XSS risk). However, raw ApplinX error messages may disclose internal hostnames, port numbers, session IDs, or Java exception class names. `console.error(msg)` at line 159 also writes the full message to the browser developer console.

### Code Snippet

```typescript
// navigation.service.ts:102–121 — unguarded chain
errorHandler(errorResponse: HttpErrorResponse, nonActivityFlow: boolean) {
    if (errorResponse.error.message.indexOf("Disconnected by host") > -1 || // TypeError if error=null
        errorResponse.error.message.indexOf("Session was disconnected by Host") > -1 ||
        errorResponse.error.message.indexOf("Not connected to Server ...") > -1) {
        ...
        this.isThereError = true;  // never reached on TypeError
    }
}

// webLogin.component.ts:155–159 — correct guard but exposes message in UI
handleError(errorResponse: HttpErrorResponse): void {
    const msg = errorResponse.error.message || errorResponse.message;
    this.errorMessage = msg;   // displayed in {{}} interpolation — safe, but discloses server message
    console.error(msg);         // also in browser console
}
```

---

## Context

**Scan Task**: [R-M-002](../../01-recon/tasks/R-M-002-error-message-log-injection.json)
**Target**: webLogin.component.ts, navigation.service.ts, macro.component.ts, logger.service.ts
**Coverage**: 6/6 in-scope files (100%)

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-005, TM-008
**Related Attack Surface**: AS-013

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Verify: does `HttpErrorResponse.error` actually become `null` in Angular for network timeouts/CORS in this context?
- Test: simulate a network-level error during a sendKeys operation and observe if the screen locker becomes permanently engaged
- Assess what internal server information ApplinX error messages actually contain in practice (hostnames, session IDs, stack traces)
- Recommend: add null guard `errorResponse.error?.message` and a fallback; sanitize error messages before display

**For Registry**: Update vulnerability-registry.json with VULN-011 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
