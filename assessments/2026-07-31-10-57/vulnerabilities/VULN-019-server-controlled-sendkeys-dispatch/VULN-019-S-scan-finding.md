# VULN-019-S: Scanner Finding - server-controlled-sendkeys-dispatch

**Phase**: Scanner
**Vulnerability ID**: VULN-019
**Assessment**: 2026-07-31-10-57
**Task**: R-H-002 - Dynamic Code Dispatch — KeyboardMappingService targetFunction
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/services/keyboard-mapping.service.ts`
**Line**: 145
**Function**: `checkKeyboardMappings()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

When `targetFunction` is a string without a `(` character, it is sent verbatim via `this.navigationService.sendKeys(keyFunc)`. The key string is not validated against any allowlist of legitimate ApplinX host key values. A tampered `KeyboardMappings.json` or a malicious server keyboard mapping can cause arbitrary host key sequences to be sent to the connected mainframe/AS400 session without user interaction.

The impact depends on what functions are exposed on the host application for various key codes (PF keys, Enter, Reset, Clear). Host-side privilege escalation or destructive actions are theoretically possible.

### Code Snippet

```typescript
// keyboard-mapping.service.ts:144–146
} else {
    this.navigationService.sendKeys(keyFunc);  // keyFunc = targetFunction string verbatim
}
```

---

## Context

**Scan Task**: [R-H-002](../../01-recon/tasks/R-H-002-keyboard-dynamic-dispatch.json)
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Assess what host key values are legitimate in the ApplinX context; determine if an allowlist validation here reduces risk significantly vs fixing the root cause at VULN-002 (the dispatch mechanism)

**For Registry**: Update vulnerability-registry.json with VULN-019 as flagged LOW

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
