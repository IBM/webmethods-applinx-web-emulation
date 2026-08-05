# VULN-020-S: Scanner Finding - uncapped-polling-no-backoff

**Phase**: Scanner
**Vulnerability ID**: VULN-020
**Assessment**: 2026-07-31-10-57
**Task**: R-L-002 - Session Polling Resilience and Resource Exhaustion
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/services/navigation/navigation.service.ts`
**Line**: 73–77
**Function**: `NavigationService.checkHostScreenUpdate()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`setInterval()` is called in the `NavigationService` constructor and its return value is discarded — no `clearInterval()` is ever called anywhere in the codebase (grep confirmed 0 occurrences of `clearInterval`). The interval fires every 5 seconds for the entire tab lifetime, including after session termination.

Additional issues:
- `CHECK_HOST_SCREEN_UPDATE_INTERVAL` and `CHECK_HOST_SCREEN_UPDATE_TIMEOUT` are `public` (non-readonly) class members — any user-exit code can modify `TIMEOUT` at runtime to change the intermediate screen check delay
- Non-fatal HTTP errors (429, 500) do not set `isThereError` — polling continues despite server-side rate limiting
- `checkForIntermidateScreen()` adds an extra `getScreenNumber` call 500ms after every `sendKeys` response — compound poll rate at typing speed
- Null dereference in `errorHandler()` (line 103) can prevent `isThereError = true` from being reached on network errors

### Code Snippet

```typescript
// navigation.service.ts:73–77
checkHostScreenUpdate (): void {
    setInterval( () => {
        this.checkScreenUpdated();
    }, this.CHECK_HOST_SCREEN_UPDATE_INTERVAL);  // ID discarded — never clearInterval'd
}

// navigation.service.ts:47–48 — public mutable
CHECK_HOST_SCREEN_UPDATE_INTERVAL: number = 5000;
CHECK_HOST_SCREEN_UPDATE_TIMEOUT: number = 500;   // dynamically read in checkForIntermidateScreen()
```

---

## Context

**Scan Task**: [R-L-002](../../01-recon/tasks/R-L-002-session-polling-resilience.json)
**Coverage**: 1/1 file (100%)

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Verify no `clearInterval` exists in the codebase; recommend: store interval ID in a private field; call `clearInterval` in `ngOnDestroy()`; use RxJS `timer().pipe(takeUntil(destroy$))` with exponential backoff on errors; mark fields `private readonly`

**For Registry**: Update vulnerability-registry.json with VULN-020 as flagged LOW

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
