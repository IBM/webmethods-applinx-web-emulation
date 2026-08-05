# VULN-014-I: Investigation Report - debug-console-log-disclosure

**Phase**: Inquisitor
**Vulnerability ID**: VULN-014
**Descriptor**: debug-console-log-disclosure
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: PROVEN

---

## Root Cause Analysis

`FieldComponent` constructor contains two unconditional `console.log()` calls (lines 35-36) that log `field.content` and `field.visualContent` on every component instantiation. `FieldComponent` is instantiated for every terminal screen field on every screen render (every 5 seconds via polling). Angular CLI production optimization (`optimization: true`) does NOT remove `console.log()` calls by default — terser requires explicit `drop_console: true` config which is absent from `angular.json`. No `environment.production` guard exists in the constructor. Result: all terminal screen data (account numbers, PINs, usernames, transaction codes) is continuously logged to the browser console in production at **~1,200-4,800 entries per minute**.

---

## Attack Scenario

**Scenario 1 (shared workstation)**: User accesses mainframe terminal via the SPA. Every screen render logs `field.content` to browser console. User leaves workstation open. Attacker opens DevTools (F12 → Console), reads all terminal screen data logged during the user's session — account numbers, PINs, transaction codes visible in plain text.

**Scenario 2 (XSS amplification via VULN-004)**: XSS payload in print popup accesses browser console history, collects all logged terminal field data, and exfiltrates to attacker server — enabling bulk data theft of all terminal data visible during the session.

---

## Prerequisites

- Proven: any user can open browser DevTools and observe the continuous logging without any technical barrier
- XSS amplification: prior XSS exploitation (VULN-004) to automate data collection

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated ApplinX user
**Achieved Privilege**: Read access to all terminal screen field data logged during the session
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: NONE
**Availability**: NONE

### Impact Description

All terminal screen content (`field.content` and `field.visualContent`) is continuously disclosed to the browser console. Terminal data includes: account numbers, customer PINs, usernames, transaction codes, session context — typical mainframe/AS400 PII data. Frequency of 100-400 log entries per screen update × polling every 5s = high-volume continuous disclosure. No data modification or availability impact.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `GetScreenResponse fields[].content` and `fields[].visualContent` (terminal screen data)

**Transformations**:
- `ScreenProcessorService` processes fields
- `FieldComponent` instantiated for each field (`@Input() field` binding)
- Constructor executes: `this.field ? console.log('>>@constructor>>> this.field.content = ', this.field.content) : ''`

**Sinks**:
- Browser console (F12 DevTools) — accessible to users and XSS code
- Browser console history buffer — persists for session duration
- XSS exfiltration channel (post-exploitation via VULN-004 or other XSS)

---

## Affected Components

### Direct Impact

- **FieldComponent constructor (lines 35-36)**: Logs all terminal screen field data to browser console on every render

### Indirect Impact

- **MacroComponent (lines 231, 235, 239, 272)**: Logs macro names and API responses to browser console (lower sensitivity)
- **GXUtils global mutable statics**: `typeAheadCharacterArray` captures keystroke input; readable by XSS post-exploitation

---

## Remediation Guidance

### Recommended Fix

Remove the two `console.log()` calls from `FieldComponent` constructor (lines 35-36). These are debug artifacts that must not appear in production code. Also remove or gate behind `if (!environment.production)` the four `console.log()` calls in `MacroComponent` (lines 231, 235, 239, 272). The quickest fix is removal; if debug output is needed for development, add the environment guard.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Remove `console.log()` from `FieldComponent` constructor lines 35-36
2. Remove or gate `MacroComponent` `console.log()` calls (lines 231, 235, 239, 272) behind `if (!environment.production)`
3. Add terser configuration in `angular.json` production build: `optimize.scripts` with `drop_console: true` for belt-and-suspenders
4. Remove all transformation-component `console.log()` calls (checkbox, calendar, table components)
5. Consider a global eslint rule: `no-console` for production builds

---

## References

**Scan Finding**: [VULN-014-S-scan-finding.md](VULN-014-S-scan-finding.md)

**Threat Model References**:
- TM-012

**Attack Surface References**:
- AS-008

**External References**:
- CWE-532: Insertion of Sensitive Information into Log File
- Attack chain: VULN-004 XSS + VULN-014 console logging = automated terminal PII exfiltration
- Attack chain AC-004: VULN-012 O(n²) creates 1M+ Fields → VULN-014 logs all of them = memory exhaustion

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
