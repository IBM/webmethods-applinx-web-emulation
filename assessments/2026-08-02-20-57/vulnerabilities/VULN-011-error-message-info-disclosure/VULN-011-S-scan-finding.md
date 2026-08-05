# VULN-011-S: Scanner Finding - error-message-info-disclosure

**Phase**: Scanner
**Vulnerability ID**: VULN-011
**Descriptor**: error-message-info-disclosure
**Assessment**: 2026-08-02-20-57
**Task**: R-M-004 - Error Message Disclosure and Debug Logging
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/webLogin/webLogin.component.ts`
**Line**: 160
**Function**: `handleError`
**Detected By**: LLM analysis

---

## Preliminary Assessment

`WebLoginComponent.handleError()` logs raw server error messages via `console.error()` and binds them directly to the DOM. Server error messages from ApplinX REST API may contain internal server paths, stack traces, or infrastructure details. The browser console is accessible to any JavaScript on the same origin (including XSS payloads). Multiple other `console.log()` calls in `MacroComponent` log macro names and full API responses. Note: VULN-012 (`AuthTokenServerService`) is correctly implemented — Bearer token is NOT added to remote NGX Logger HTTP requests.

### Code Snippet

```typescript
handleError(errorResponse: HttpErrorResponse): void {
  this.screenLockerService.setLocked(false);
  const msg = errorResponse.error.message || errorResponse.message;
  this.errorMessage = msg;    // bound to DOM via {{ errorMessage }}
  console.error(msg);         // LINE 160: raw server error to browser console
}
// MacroComponent additional logging:
// Line 231: console.log("newMacroName : ", newMacroName)
// Line 235: console.log(data)  — full API response
// Line 239: console.log("macroNameList : ", macroNameList)
// Line 272: console.log(err)   — full error object
```

---

## Context

**Scan Task**: [R-M-004](../../01-recon/tasks/R-M-004-error-logging-disclosure.md)
**Target**: webLogin.component.ts, navigation.service.ts, macro.component.ts, logger.service.ts
**Coverage**: 100% — all four target files plus app.module.ts

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-006: Session Token Exposure via Logs
- TM-012: Error Message Disclosure

**Related Attack Surface**:
- AS-008: Browser console and NGX Logger remote endpoint

---

## Analysis Notes

**Patterns Observed**:
- console.error(msg) in webLogin.handleError() — raw server error message (line 160)
- console.log() at lines 231, 235, 239, 272 in MacroComponent — macro names and API responses
- errorMessage DOM binding with white-space: pre-line — line breaks preserved in rendered error
- AuthTokenServerService.alterHttpRequest() correctly strips Bearer token — GOOD (VULN-012)
- NGX Logger serverLogLevel=ERROR (safe default) but operator-configurable

**Coverage Assessment**: Complete — 31 console.log/error/warn calls identified across src/app/. Logger infrastructure verified.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Determine if ApplinX REST API error responses contain server paths, stack traces, or database details
- Verify whether operator-configurable serverLogLevel can be set to TRACE via sessionConfig.json
- Check if CRLF sequences in server error messages cause log injection in log aggregator
- Evaluate whether console.log() calls should be removed in production builds

**For Registry**:
- Assign VULN-011 to error-message-info-disclosure
- Set status: flagged, severity: medium

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
