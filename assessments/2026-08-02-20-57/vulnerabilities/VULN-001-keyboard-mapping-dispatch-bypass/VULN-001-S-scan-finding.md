# VULN-001-S: Scanner Finding - keyboard-mapping-dispatch-bypass

**Phase**: Scanner
**Vulnerability ID**: VULN-001
**Descriptor**: keyboard-mapping-dispatch-bypass
**Assessment**: 2026-08-02-20-57
**Task**: R-H-003 - Keyboard Mapping Dispatch and sendKey Validation
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/keyboard-mapping.service.ts`
**Line**: 139
**Function**: `dispatchKeyboardMapping`
**Detected By**: LLM analysis

---

## Preliminary Assessment

Two distinct vulnerabilities in keyboard mapping dispatch: (1) VULN-002 own-property guard is incomplete — `constructor` IS an own property on class instances in V8/SpiderMonkey. If server supplies `targetFunction='constructor(param)'`, `hasOwnProperty.call()` returns TRUE and `this.jsFunc['constructor'](param)` executes, potentially invoking a dangerous constructor. (2) Function-type `targetFunction` dispatch at line 159 is entirely unrestricted — if server can supply a function object, any callable can be invoked including `window.eval`, `Function()`, or other dangerous references. A compromised ApplinX backend supplying malicious `keyboardMapping` data could achieve arbitrary code execution in the browser.

### Code Snippet

```typescript
if (Object.prototype.hasOwnProperty.call(this.jsFunc, methodName) &&
    typeof (this.jsFunc as any)[methodName] === 'function') {
    let param = keyFunc.substring(beginBracket+1, keyFunc.length-1);
    result = (this.jsFunc as any)[methodName](param);
}
// CRITICAL: 'constructor' IS an own property on class instances.
// If methodName='constructor', hasOwnProperty.call() returns TRUE.

// SEPARATE ISSUE at line 159-161:
if (keyFunc != null && typeof(keyFunc) == GXObjectTypes.FUNCTION) {
    keyFunc(gx_event);  // No restriction on which functions can be called
}
```

---

## Context

**Scan Task**: [R-H-003](../../01-recon/tasks/R-H-003-keyboard-mapping-dispatch.md)
**Target**: src/app/services/keyboard-mapping.service.ts, src/assets/config/KeyboardMappings.json, src/common/js-functions/js-functions.service.ts
**Coverage**: 100% — all keyboard mapping code paths analyzed

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-004: Prototype Pollution / Code Injection via Server-Supplied Keyboard Mapping targetFunction

**Related Attack Surface**:
- AS-001: ApplinX REST API — keyboardMapping array in CreateSessionResponse/GetInfoResponse
- AS-005: KeyboardMappings.json — operator-configurable static asset

---

## Analysis Notes

**Patterns Observed**:
- hasOwnProperty.call() guard present (VULN-002 fix) but incomplete — does not blacklist 'constructor'
- VALID_HOST_KEY regex has correct anchors and /i flag and covers pf1-36, pa1-3, common keys
- Function-type targetFunction dispatch is entirely unrestricted (no origin/identity check)
- cancelMapFunction invoked with null-check only, no typeof validation
- Parameter extraction uses naive substring parsing — no regex validation of well-formed function(param) syntax
- KeyboardMappings.json loaded without schema validation

**Coverage Assessment**: Complete analysis of keyboard-mapping.service.ts dispatch mechanism, VALID_HOST_KEY regex, parameter extraction, and js-functions service. All dispatch paths traced.

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
- Verify if JSFunctionsService or IJSFunctionService implementations expose a weaponizable constructor
- Test: keyboardMapping.targetFunction = 'constructor(param)' — trace what this.jsFunc['constructor'](param) returns
- Determine if targetFunction can be a function object in server REST API responses (would make unrestricted dispatch CRITICAL)
- Test VALID_HOST_KEY against official ApplinX host key documentation for completeness

**For Registry**:
- Assign VULN-001 to keyboard-mapping-dispatch-bypass
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
