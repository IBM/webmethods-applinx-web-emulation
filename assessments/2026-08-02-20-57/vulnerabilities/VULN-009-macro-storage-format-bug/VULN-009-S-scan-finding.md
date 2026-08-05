# VULN-009-S: Scanner Finding - macro-storage-format-bug

**Phase**: Scanner
**Vulnerability ID**: VULN-009
**Descriptor**: macro-storage-format-bug
**Assessment**: 2026-08-02-20-57
**Task**: R-M-001 - Macro Name Validation and sessionStorage Lifecycle
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/app.component.ts`
**Line**: 652
**Function**: `getMacroListDetails`
**Detected By**: LLM analysis

---

## Preliminary Assessment

The `macroFileList` storage code has a double JSON serialization bug at line 652: `JSON.parse(JSON.stringify(array))` first serializes the array to a JSON string then immediately parses it back to an array object. When this array object is passed to `sessionStorage.setItem()`, JavaScript coerces it to the string `'[object Object]'`. The macro component then reads `'[object Object]'` from sessionStorage and splits it on comma, producing a single-element array causing all macro operations to fail. Additionally, `macroFileList` is NOT cleared in `setNotConnected()` on logout.

### Code Snippet

```typescript
// app.component.ts line 652 — STORES WRONG:
sessionStorage.setItem("macroFileList", JSON.parse(JSON.stringify(this.macroList)));
// JSON.parse(JSON.stringify(array)) returns an ARRAY OBJECT.
// sessionStorage.setItem() coerces array to '[object Object]' string.

// macro.component.ts lines 116-118 — READS BROKEN VALUE:
this.tempMacroList = sessionStorage.getItem("macroFileList");
if(this.tempMacroList) {
  this.macroList = this.tempMacroList.split(",");  // Splits '[object Object]' on comma
}
```

---

## Context

**Scan Task**: [R-M-001](../../01-recon/tasks/R-M-001-macro-sessionstorage.md)
**Target**: macro.component.ts, macro.component.html, shared.service.ts, storage.service.ts
**Coverage**: 100% — all four target files read

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-007: Username / Session Artifact Persistence in sessionStorage
- TM-011: Macro Name / File Path Injection

**Related Attack Surface**:
- AS-003: sessionStorage — macroFileList lifecycle
- AS-007: MacroService API

---

## Analysis Notes

**Patterns Observed**:
- JSON.parse(JSON.stringify(array)) double serialization bug — array coerced to '[object Object]'
- macroFileList comma-split parsing fragile — any comma in macro name corrupts list
- macroFileList not removed in setNotConnected() — persists across session boundaries

**Coverage Assessment**: Complete — app.component.ts line 652 and macro.component.ts lines 116-118 directly confirm the type coercion bug.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Verify browser-side: check actual sessionStorage.getItem('macroFileList') value to confirm '[object Object]' is stored
- Test whether macro UI is completely broken or if this code path is never reached in current app flow
- Evaluate: replace JSON.parse(JSON.stringify(array)) with direct JSON.stringify(array)

**For Registry**:
- Assign VULN-009 to macro-storage-format-bug
- Set status: flagged, severity: medium

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
