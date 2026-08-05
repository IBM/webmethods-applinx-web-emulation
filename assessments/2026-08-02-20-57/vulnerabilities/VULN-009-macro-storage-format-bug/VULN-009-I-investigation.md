# VULN-009-I: Investigation Report - macro-storage-format-bug

**Phase**: Inquisitor
**Vulnerability ID**: VULN-009
**Descriptor**: macro-storage-format-bug
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: HIGH

---

## Root Cause Analysis

Two confirmed security issues: (1) `macroFileList` is NOT cleared in `StorageService.setNotConnected()` — sessionStorage persists across session changes in the same browser tab, leaking User A's macro names to User B in shared-browser scenarios. (2) The comma-based storage format (`Array.toString()`) has no escaping, so macro names containing commas corrupt the list. Scanner's `'[object Object]'` claim was partially wrong: `this.macroList` is a string array, so `Array.toString()` produces `'macro1,macro2'` (not `'[object Object]'`), meaning the double JSON serialization is wasteful but not data-corrupting for string arrays.

---

## Attack Scenario

**Scenario 1 (shared browser)**: User A logs in, macro list fetched and stored in sessionStorage as `'macro1,macro2'`. User A logs out — only `gx_token`/`idPcode`/`userName` are cleared. User B logs in same tab. `MacroComponent.ngOnInit()` calls `getMacroListDetails()` which reads the stale `macroFileList`. User B's dropdown shows User A's macros.

**Scenario 2 (VULN-009 + VULN-007 chain)**: XSS (VULN-004) injects `sessionStorage.setItem('macroFileList', '../../../etc/passwd')`. `getMacroListDetails()` populates dropdown with path-traversal string. `onDeleteMacro()` sends it to ApplinX delete endpoint (VULN-007).

---

## Prerequisites

- Shared browser scenario (library kiosk, corporate workstation, shared device)
- OR prior XSS to manipulate sessionStorage (VULN-004 or VULN-005 as prerequisites)
- User must open the Macro panel after login for `getMacroListDetails()` to read stale data

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated ApplinX user (attacker is next user at shared workstation, or XSS executor)
**Achieved Privilege**: Read access to prior user's macro names; injection of arbitrary macro names enabling VULN-007 path traversal
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: HIGH
**Availability**: LOW

### Impact Description

Confidentiality: macro names (user activity metadata) disclosed to subsequent session users. Integrity: sessionStorage injection enables VULN-007 path traversal attack chain — arbitrary file operations on ApplinX server. Availability: disrupted macro operations when injected names cause API errors.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `getMacro()` fileList response → `this.macroList` string array
- `sessionStorage.getItem('macroFileList')` — persistent across same-tab session changes

**Transformations**:
- `app.component.ts` line 652: `JSON.parse(JSON.stringify(this.macroList))` — returns Array object
- `sessionStorage.setItem('macroFileList', <Array>)` — `Array.toString()` coercion → `'macro1,macro2'` CSV
- `macro.component.ts` line 118: `tempMacroList.split(',')` — comma-split with no escaping

**Sinks**:
- Macro dropdown `@for` rendering in `macro.component.html`
- `this.selectedMacro` → `MacroService.deleteMacro()` (chain to VULN-007)

---

## Affected Components

### Direct Impact

- **StorageService.setNotConnected()**: Does not clear `macroFileList` — cross-session disclosure in shared browsers
- **AppComponent.getMacroListDetails()**: Redundant `JSON.parse(JSON.stringify())` + fragile comma storage format

### Indirect Impact

- **MacroComponent.getMacroListDetails()**: Reads stale or injected `macroFileList` from sessionStorage without validation
- **VULN-007 (macro-delete-path-traversal)**: VULN-009 sessionStorage injection is the prerequisite for VULN-007 exploitation without physical backend access

---

## Remediation Guidance

### Recommended Fix

Add `sessionStorage.removeItem('macroFileList')` to `StorageService.setNotConnected()`. Fix storage format: replace `JSON.parse(JSON.stringify(this.macroList))` with `JSON.stringify(this.macroList)` to store as proper JSON string. Fix read: replace `split(',')` with `JSON.parse(sessionStorage.getItem('macroFileList') || '[]')`. Apply `MACRO_NAME_PATTERN` filter when loading the list into the dropdown (companion fix for VULN-007).

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Add `sessionStorage.removeItem('macroFileList')` to `StorageService.setNotConnected()`
2. Fix storage: `sessionStorage.setItem('macroFileList', JSON.stringify(this.macroList))`
3. Fix read: `this.macroList = JSON.parse(sessionStorage.getItem('macroFileList') || '[]')`
4. Apply `MACRO_NAME_PATTERN` filter on read to reject injected names
5. Move `macroFileList` management into `StorageService` for centralized lifecycle

---

## References

**Scan Finding**: [VULN-009-S-scan-finding.md](VULN-009-S-scan-finding.md)

**Threat Model References**:
- TM-007
- TM-011

**Attack Surface References**:
- AS-003
- AS-007

**External References**:
- Attack chain AC-003: VULN-004 XSS → VULN-009 sessionStorage injection → VULN-007 path traversal

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
