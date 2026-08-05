# VULN-001-I: Investigation Report - keyboard-mapping-dispatch-bypass

**Phase**: Inquisitor
**Vulnerability ID**: VULN-001
**Descriptor**: keyboard-mapping-dispatch-bypass
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: FALSE_POSITIVE

---

## Investigation Summary

**Determination**: This finding has been determined to be a FALSE POSITIVE.

**Exploitability**: THEORETICAL

---

## Root Cause Analysis

Scanner incorrectly claimed that `'constructor'` is an own property on class instances. In V8/SpiderMonkey, `Object.prototype.hasOwnProperty.call(instance, 'constructor')` returns `FALSE` because constructor is inherited from `Function.prototype`, not an own property. `JSFunctionsService` and `JSMethodsService` are both empty (no own-property methods), so the dispatch guard has nothing to allow. Server-supplied JSON cannot contain function objects, preventing the function-type dispatch path.

---

## Attack Scenario

Scanner proposed: server supplies `targetFunction='constructor(payload)'` → `hasOwnProperty` guard passes → `this.jsFunc['constructor'](payload)` executed. Reality: `hasOwnProperty` returns `FALSE` for inherited constructor property → guard blocks dispatch. No own-property methods exist on either JS service → no callable targets. JSON cannot serialize functions → function-type dispatch unreachable from server data.

---

## Prerequisites

- Attacker must compromise ApplinX REST API backend
- Attacker must supply malicious keyboard mapping `targetFunction`
- `JSFunctionsService` must have own-property methods that perform dangerous actions (currently: none)

---

## Privilege Boundary Analysis

**Starting Privilege**: ApplinX REST API operator (compromised backend)
**Achieved Privilege**: None — all dispatch paths blocked
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: NONE

### Impact Description

The VULN-002 fix (`hasOwnProperty` guard) correctly and completely blocks prototype-chain traversal. The constructor property is inherited, not own; the guard returns false. No impact is possible via this attack path.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API CreateSessionResponse.keyboardMapping[] via SessionService
- KeyboardMappings.json static asset via HttpClient
- User code via `addKeyboardMapping()` in GXGeneratedPage/AbstractUserExits

**Transformations**:
- `JSON.parse` deserializes keyboardMapping — cannot produce function objects
- `targetFunction` parsed via `indexOf('(')` for method name extraction
- `Object.prototype.hasOwnProperty.call(this.jsFunc, methodName)` guard — blocks prototype chain
- `typeof this.jsFunc[methodName] === 'function'` guard — second gate

**Sinks**:
- `(this.jsFunc as any)[methodName](param)` — GUARDED: only own-property methods
- `navigationService.sendKeys(keyFunc)` — GUARDED: VALID_HOST_KEY regex (VULN-019 fix)
- `keyFunc(gx_event)` — GUARDED: requires `hasOwnProperty` guard to pass AND method to return function

---

## Affected Components

### Direct Impact

- **KeyboardMappingService.dispatchKeyboardMapping()**: No impact — guards are effective

### Indirect Impact

- **JSFunctionsService / JSMethodsService**: API_MISUSE_RISK if integrators add dangerous own-property methods — document as integration guidance

---

## Remediation Guidance

### Recommended Fix

No immediate code fix required — `hasOwnProperty` guard is correct and complete. For defense-in-depth: (1) Add an explicit method allowlist in `KeyboardMappingService` listing permitted `JSFunctionsService` method names. (2) Document integration guidance in `IJSFunctionService` interface JSDoc warning integrators not to expose dangerous methods. (3) Add parameter regex validation (`/^[a-zA-Z0-9_\-.,\s]*$/`) to guard against param injection.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Add explicit method allowlist to KeyboardMappingService (configurable by integrator)
2. Add JSDoc API_MISUSE_RISK warning to IJSFunctionService interface
3. Validate param string against safe character regex before dispatch
4. Consider schema validation on KeyboardMappings.json at load time

---

## References

**Scan Finding**: [VULN-001-S-scan-finding.md](VULN-001-S-scan-finding.md)

**Threat Model References**:
- TM-004

**Attack Surface References**:
- AS-001
- AS-005

**External References**:
- WHATWG: Object.prototype.hasOwnProperty — returns false for inherited properties
- MDN: JSON.parse — function values are not serializable in JSON

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Closed (False Positive)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
