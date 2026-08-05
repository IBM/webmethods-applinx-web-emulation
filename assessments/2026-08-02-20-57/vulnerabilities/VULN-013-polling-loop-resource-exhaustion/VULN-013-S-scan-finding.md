# VULN-013-S: Scanner Finding - polling-loop-resource-exhaustion

**Phase**: Scanner
**Vulnerability ID**: VULN-013
**Descriptor**: polling-loop-resource-exhaustion
**Assessment**: 2026-08-02-20-57
**Task**: R-L-001 - NavigationService Polling Loop Resource Management
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/services/navigation/navigation.service.ts`
**Line**: 84
**Function**: `stopHostScreenUpdate`
**Detected By**: LLM analysis

---

## Preliminary Assessment

The VULN-020 fix is partially implemented: `intervalId` is correctly typed and stored, `clearInterval()` is called in `checkHostScreenUpdate()` to prevent duplicate intervals. `stopHostScreenUpdate()` is correctly defined. However, `stopHostScreenUpdate()` is **never called** anywhere in the codebase. `NavigationService` is an `@Injectable({providedIn: 'root'})` singleton and does not implement `OnDestroy`. The polling interval continues firing every 5 seconds after logout because `setNotConnected()` does not call `stopHostScreenUpdate()`, and `onBrowserClose()` in `app.component.ts` calls `logout()` without stopping the interval. Guard clauses prevent actual API calls after logout but the interval callback keeps firing.

### Code Snippet

```typescript
// VULN-020 fix — correctly typed and stored:
private intervalId: ReturnType<typeof setInterval> | null = null;

stopHostScreenUpdate(): void {  // LINE 84 — defined correctly
  if (this.intervalId !== null) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
// BUT: grep -rn 'stopHostScreenUpdate' src/ → only definition found.
// NEVER CALLED anywhere in the codebase — method is dead code.
```

---

## Context

**Scan Task**: [R-L-001](../../01-recon/tasks/R-L-001-polling-loop-resource.md)
**Target**: navigation.service.ts, app.component.ts
**Coverage**: 100% — both target files plus storage.service.ts and webLogin.component.ts

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-009: Screen Update Polling Loop Resource Exhaustion

**Related Attack Surface**:
- AS-001: ApplinX REST API — polling creates recurring traffic after logout

---

## Analysis Notes

**Patterns Observed**:
- VULN-020 intervalId storage and clearInterval in checkHostScreenUpdate() — correct but incomplete
- stopHostScreenUpdate() defined correctly but never called — dead method
- NavigationService missing ngOnDestroy() implementation
- setNotConnected() does not call stopHostScreenUpdate()
- isThereError and !isConnected() guard clauses reduce but don't eliminate interval firing

**Coverage Assessment**: Complete — all NavigationService termination paths traced. All call sites of stopHostScreenUpdate() enumerated (zero found).

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Add stopHostScreenUpdate() call to storage.service.ts setNotConnected() — minimal fix
- Add stopHostScreenUpdate() to app.component.ts ngOnDestroy() and onBrowserClose()
- Implement ngOnDestroy() in NavigationService as defense-in-depth
- Verify that checkHostScreenUpdate() from constructor does not cause pre-authentication polling issues

**For Registry**:
- Assign VULN-013 to polling-loop-resource-exhaustion
- Set status: flagged, severity: low

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
