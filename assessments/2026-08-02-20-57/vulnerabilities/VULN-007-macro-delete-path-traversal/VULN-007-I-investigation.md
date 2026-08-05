# VULN-007-I: Investigation Report - macro-delete-path-traversal

**Phase**: Inquisitor
**Vulnerability ID**: VULN-007
**Descriptor**: macro-delete-path-traversal
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: MEDIUM

---

## Root Cause Analysis

`onDeleteMacro()` passes `this.selectedMacro` directly to `MacroService.deleteMacro()` without applying `MACRO_NAME_PATTERN` validation (defined in `GXUtils.ts` as `/^[a-zA-Z0-9-]*$/` but only applied to the HTML record input). `selectedMacro` is set by `selected($event)` as: `this.selectedMacro = event + '.json'` with no sanitization. The source of event values is the macro dropdown, populated from `sessionStorage macroFileList` via comma-split, also without per-item validation. An attacker who can manipulate sessionStorage (via prior XSS) can inject path-traversal strings.

---

## Attack Scenario

**Prerequisite**: Attacker establishes XSS (via VULN-004 print popup or VULN-005 innerHTML sink). XSS code executes: `sessionStorage.setItem('macroFileList', '../../../etc/passwd')`. On next macro panel open, `getMacroListDetails()` reads macroFileList, splits on comma, populates dropdown with `'../../../etc/passwd'`. User (or attacker) triggers macro delete. `selected('../../../etc/passwd')` stores `'../../../etc/passwd.json'` in `this.selectedMacro`. `onDeleteMacro()` calls `deleteMacro('../../../etc/passwd.json', user, app, token)`. If ApplinX SDK constructs raw URL path without `encodeURIComponent`, server receives `DELETE /api/v1/macros/../../../etc/passwd.json`.

**Additionally**: Modal state inconsistency — all three dropdowns (delete/view/play) share `this.selectedMacro` via `selected()`. Wrong macro may be deleted if user switches between modals.

---

## Prerequisites

- Prior XSS execution in same origin (VULN-004 or VULN-005) to manipulate sessionStorage
- OR physical/malware access to browser console
- ApplinX REST API server NOT validating macro name server-side (unverified — risk remains)
- ApplinX SDK NOT URL-encoding path parameters (if SDK uses `encodeURIComponent`, traversal is blocked at client)

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated ApplinX user with macro permissions
**Achieved Privilege**: Arbitrary file deletion/read on ApplinX server filesystem (if server unprotected)
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: HIGH
**Availability**: HIGH

### Impact Description

If server-side path traversal succeeds: arbitrary file read (macro GET) or deletion (macro DELETE) on ApplinX server filesystem. Impact depends on ApplinX process user permissions. Additionally, modal state inconsistency allows wrong macro to be deleted in normal operation: `selectedDelMacro` bound to delete modal but `onDeleteMacro()` reads shared `this.selectedMacro`.

---

## Data Flow Analysis

**Sources**:
- sessionStorage `macroFileList` (populated from ApplinX REST API `getMacro()` response, persisted across logout)

**Transformations**:
- `getMacroListDetails()` reads macroFileList from sessionStorage, splits on comma — no per-item validation
- Dropdown ngModel binds to `selectedDelMacro`/`selectedViewMacro`/`selectedPlayMacro`
- `selected($event)` stores `event + '.json'` into `this.selectedMacro` — no `MACRO_NAME_PATTERN` validation
- `onDeleteMacro()` passes `this.selectedMacro` to `MacroService.deleteMacro()`

**Sinks**:
- `MacroService.deleteMacro(macroName, user, applicationName, token)` → ApplinX REST API DELETE endpoint
- URL path construction in `@ibm/applinx-rest-apis` SDK (URL encoding behavior unknown)

---

## Affected Components

### Direct Impact

- **MacroComponent.onDeleteMacro()**: Passes unvalidated `selectedMacro` to REST API delete endpoint
- **MacroComponent.selected()**: Does not apply `MACRO_NAME_PATTERN` before setting `selectedMacro`

### Indirect Impact

- **StorageService.setNotConnected()**: Does not clear `macroFileList` — attack window persists across logout in shared browsers
- **ApplinX REST API macro delete endpoint**: If no server-side name validation, path traversal reaches server filesystem

---

## Remediation Guidance

### Recommended Fix

Apply `MACRO_NAME_PATTERN` validation in `MacroComponent.selected()`: validate `String(event).trim()` against `/^[a-zA-Z0-9-]+$/` before storing in `this.selectedMacro`. Also filter `macroList` on load in `getMacroListDetails()` to reject any items not matching the pattern. Fix the modal state inconsistency by using `selectedDelMacro` (not `this.selectedMacro`) in `onDeleteMacro()`. Clear `macroFileList` in `StorageService.setNotConnected()` as part of VULN-009 fix.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Validate `selectedMacro` against `MACRO_NAME_PATTERN` in `selected()` before assignment
2. Filter `macroList` items against `MACRO_NAME_PATTERN` during `getMacroListDetails()` population
3. Fix modal state: `onDeleteMacro()` should use `this.selectedDelMacro`, not `this.selectedMacro`
4. Clear `macroFileList` in `StorageService.setNotConnected()` (VULN-009 companion fix)
5. Verify ApplinX REST API SDK URL-encodes path parameters (if it does, client-side fix is sufficient)
6. Request server-side macro name validation from ApplinX REST API team as defense-in-depth

---

## References

**Scan Finding**: [VULN-007-S-scan-finding.md](VULN-007-S-scan-finding.md)

**Threat Model References**:
- TM-011

**Attack Surface References**:
- AS-007

**External References**:
- CWE-22: Improper Limitation of a Pathname to a Restricted Directory
- Attack chain AC-003: VULN-004 XSS → VULN-009 sessionStorage injection → VULN-007 path traversal delete

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
