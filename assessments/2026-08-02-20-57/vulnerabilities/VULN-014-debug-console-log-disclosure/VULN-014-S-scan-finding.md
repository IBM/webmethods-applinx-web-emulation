# VULN-014-S: Scanner Finding - debug-console-log-disclosure

**Phase**: Scanner
**Vulnerability ID**: VULN-014
**Descriptor**: debug-console-log-disclosure
**Assessment**: 2026-08-02-20-57
**Task**: R-L-003 - Dead Code and Debug Output Cleanup Audit
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/mini-components/field/field.component.ts`
**Line**: 35
**Function**: `constructor`
**Detected By**: LLM analysis

---

## Preliminary Assessment

`FieldComponent` constructor contains two active (not commented-out) `console.log()` calls that output `field.content` and `field.visualContent` on every field construction. In a terminal emulation SPA, every screen change triggers `FieldComponent` construction for all visible fields — meaning all terminal screen data (account numbers, PINs, passwords in visual form, usernames, session context) is continuously logged to the browser console. This is the highest-risk debug output in the codebase because of frequency (every field render) and data sensitivity (all terminal data). Additionally, `GXUtils` has 7+ global mutable static arrays shared without synchronization, and large blocks of commented-out dead code exist in multiple services.

### Code Snippet

```typescript
constructor(public storageService: StorageService) {
  this.field ? console.log('>>@constructor>>> this.field.content = ', this.field.content) : '';
  this.field ? console.log('>>@constructor>>> this.field.visualContent = ', this.field.visualContent) : '';
}
// These are ACTIVE and fire on EVERY FieldComponent construction.
// Every terminal screen render logs all field data to browser console.
```

---

## Context

**Scan Task**: [R-L-003](../../01-recon/tasks/R-L-003-dead-code-debug-output.md)
**Target**: macro.component.ts, field.component.ts, GXUtils.ts, screen-processor.service.ts
**Coverage**: 100% — all four primary targets plus shared.service.ts, input-field.component.ts, LifecycleUserExits.ts

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-012: Error Message Disclosure — debug console output

**Related Attack Surface**:
- AS-008: Browser console — debug output visible to users with DevTools

---

## Analysis Notes

**Patterns Observed**:
- Two active console.log() in FieldComponent constructor — logs ALL terminal screen field data
- Four active console.log() in MacroComponent (lines 231, 235, 239, 272)
- Large blocks of commented-out methods in SharedService (8 methods)
- Commented-out getPattern() in InputFieldComponent — security-relevant validation logic
- GXUtils global mutable statics: 7+ arrays shared without synchronization
- VULN-016 verified: dead URL constants (MACRO_BASE_URL, etc.) fully removed from GXUtils
- screen-processor.service.ts is clean — no debug output or dead code

**Coverage Assessment**: Complete — all primary targets plus 3 additional files. VULN-016 removal verified.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Remove console.log() from FieldComponent constructor immediately — data sensitivity is high
- Remove or gate MacroComponent console.log() calls behind production build flag
- Remove all commented-out dead code blocks in SharedService
- Document or deprecate getPattern() removal rationale in InputFieldComponent

**For Registry**:
- Assign VULN-014 to debug-console-log-disclosure
- Set status: flagged, severity: low

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
