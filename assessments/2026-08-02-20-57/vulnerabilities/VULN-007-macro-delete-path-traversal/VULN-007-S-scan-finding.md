# VULN-007-S: Scanner Finding - macro-delete-path-traversal

**Phase**: Scanner
**Vulnerability ID**: VULN-007
**Descriptor**: macro-delete-path-traversal
**Assessment**: 2026-08-02-20-57
**Task**: R-M-001 - Macro Name Validation and sessionStorage Lifecycle
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/macro/macro.component.ts`
**Line**: 128
**Function**: `onDeleteMacro`
**Detected By**: LLM analysis

---

## Preliminary Assessment

`MacroComponent.onDeleteMacro()` passes `this.selectedMacro` directly to `ApplinX REST MacroService.deleteMacro()` API without any validation against the MACRO_NAME_PATTERN regex. The HTML template enforces a pattern on the RECORD macro input field (`pattern='^[a-zA-Z0-9-]*$'`), but the DELETE, VIEW, and PLAY operations use dropdown selects populated from `macroFileList` sessionStorage with no client-side pattern validation. If `macroFileList` contains manipulated values (via XSS or direct sessionStorage manipulation), macro names with `'../'` path traversal sequences would be forwarded to server-side file operations without sanitization.

### Code Snippet

```typescript
onDeleteMacro() {
  this.macroDeleteSubscription = this.macroService
    .deleteMacro(this.selectedMacro, this.user, this.applicationName, this.token)
    .subscribe(response => {
      // ...
    });
}
// this.selectedMacro is from dropdown populated from sessionStorage macroFileList.
// NO validation pattern applied before passing to deleteMacro() API.
```

---

## Context

**Scan Task**: [R-M-001](../../01-recon/tasks/R-M-001-macro-sessionstorage.md)
**Target**: macro.component.ts, macro.component.html, shared.service.ts, storage.service.ts
**Coverage**: 100% — all four target files plus GXUtils.ts

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-011: Macro Name / File Path Injection — client-side validation enforcement

**Related Attack Surface**:
- AS-007: MacroService API — macro name used as file path identifier on ApplinX server

---

## Analysis Notes

**Patterns Observed**:
- Record macro input has pattern validation in HTML template (line 40)
- Delete/view/play operations have NO pattern validation on selectedMacro
- macroFileList comma-split: comma in macro name corrupts the list
- macroFileList NOT cleared on logout in setNotConnected() — TM-007 gap
- Modal state inconsistency: selectedDelMacro vs this.selectedMacro in onDeleteMacro()

**Coverage Assessment**: Complete — all macro lifecycle operations traced. All sessionStorage read/write paths enumerated.

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
- Verify if ApplinX REST MacroService.deleteMacro() validates/sanitizes macro name on server side
- Test: manually set sessionStorage macroFileList to '../../../evil' and trigger delete — does server reject?
- Confirm modal state bug: select macro A in delete modal, cancel, select macro B in view modal, reopen delete — verify which is deleted
- Verify macroFileList cleanup: confirm it is NOT in sessionStorage after setNotConnected() is called

**For Registry**:
- Assign VULN-007 to macro-delete-path-traversal
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
