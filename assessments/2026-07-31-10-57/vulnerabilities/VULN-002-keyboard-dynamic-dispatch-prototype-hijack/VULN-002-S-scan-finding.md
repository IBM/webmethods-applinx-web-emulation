# VULN-002-S: Scanner Finding - keyboard-dynamic-dispatch-prototype-hijack

**Phase**: Scanner
**Vulnerability ID**: VULN-002
**Descriptor**: keyboard-dynamic-dispatch-prototype-hijack
**Assessment**: 2026-07-31-10-57
**Task**: R-H-002 - Dynamic Code Dispatch — KeyboardMappingService targetFunction
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/keyboard-mapping.service.ts`
**Line**: 136–140
**Function**: `checkKeyboardMappings()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`checkKeyboardMappings()` implements dynamic method dispatch via bracket-notation property access: `this.jsFunc[methodName](param)` where `methodName` is parsed from the `targetFunction` string in keyboard mapping config. There is no allowlist of permitted method names.

**Critical vector — prototype chain traversal:**

JavaScript bracket-notation property lookup walks the prototype chain. The key `"constructor"` resolves to `Object.prototype.constructor` (the `Function` constructor). The truthiness check `if (this.jsFunc[methodName])` passes because `Function` is truthy. Therefore, a `targetFunction` value of `"constructor(alert(1))"` causes:

```
this.jsFunc["constructor"]("alert(1)")
// evaluates to:
new Function("alert(1)")() — equivalent to eval("alert(1)")
```

This is eval-equivalent code execution. The `param` value is the raw substring between the parentheses — completely attacker-controlled.

**Attack paths:**
1. **Asset tampering**: `KeyboardMappings.json` at `./assets/config/KeyboardMappings.json` is loaded via unauthenticated HTTP GET. Any server-side path traversal, CDN cache poisoning, or web server misconfiguration that allows serving a tampered file delivers the payload.
2. **Server keyboard mapping**: `initMapping(keyList)` loads server-supplied keyboard mappings via `loadKeyboardMappings()` into `JsonServerKeyboardMappings`. A compromised ApplinX server can inject malicious `targetFunction` values.
3. **No HTTP Strict Transport Security evidence**: HTTP channel compromise (MITM) could substitute keyboard mapping data.

### Code Snippet

```typescript
// keyboard-mapping.service.ts:133–155
if (typeof(keyFunc) == GXObjectTypes.STRING) {
    let beginBracket = keyFunc.indexOf("(");
    if (beginBracket != -1) {
        let methodName = keyFunc.substring(0, beginBracket);  // "constructor" if targetFunction="constructor(payload)"
        if(this.jsFunc[methodName]) {                          // truthy — Object.prototype.constructor exists!
            let param = keyFunc.substring(beginBracket+1, keyFunc.length-1);  // "payload"
            result = this.jsFunc[methodName](param);           // Function("payload")() — eval-equivalent
        }
    } else {
        this.navigationService.sendKeys(keyFunc);  // or: arbitrary host key sent (VULN-019)
    }
}
```

**Note on current exploitability**: The default `IJSFunctionService` implementation is empty — `jsFunc` has no custom methods. The prototype chain attack works regardless. However, if `methodName` is an empty string or a symbol, it would not match typical prototype properties. The Inquisitor should verify whether `this.jsFunc["constructor"]` specifically resolves to the `Function` constructor in the Angular DI context and test with a controlled `KeyboardMappings.json` modification.

---

## Context

**Scan Task**: [R-H-002](../../01-recon/tasks/R-H-002-keyboard-dynamic-dispatch.json)
**Target**: keyboard-mapping.service.ts, ijs-functions.service.ts, js-functions.service.ts, js-methods.service.ts, KeyboardMappings.json
**Coverage**: 9/9 in-scope files examined

**Tools Used**:
- LLM static analysis (no external tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-003: Client-side keyboard mapping code injection via targetFunction — dynamic dispatch to jsFunc[methodName](param)

**Related Attack Surface**:
- AS-003: KeyboardMappings.json / Server key mappings ↔ KeyboardMappingService trust boundary
- AS-004: ApplinX REST API getInfo/connect response keyboardMapping field

---

## Analysis Notes

**Patterns Observed**:
- `this.jsFunc[methodName](param)` — bracket-notation dispatch with externally-controlled key, no allowlist
- `IJSFunctionService` interface is empty — no compile-time constraint on permissible method names
- `cancelMapFunction(event)` invoked without `typeof` check — secondary unvalidated function call
- Server keyboard mapping loads into same `JsonServerKeyboardMappings` map as JSON asset — no distinction in dispatch priority

**False Positives**:
- `keyFunc(gx_event)` at line 152 (FUNCTION-type branch): Only executes when `typeof keyFunc === 'function'`, set via `addKeyboardMapping()` from integrator code — legitimate extensibility, not server-controlled
- `this.navigationService.sendKeys(keyFunc)` — covered as a separate lower-severity finding (VULN-019)

**Coverage Assessment**: 100%. All keyboard mapping data paths traced from source (JSON asset, server response) to dispatch sink.

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
- Create a test `KeyboardMappings.json` with `"targetFunction": "constructor(alert(document.domain))"` and verify execution in browser
- Inspect Angular DI: does `this.jsFunc` in the DI context have `constructor` on its prototype chain pointing to `Function`?
- Enumerate all method names available on `Object.prototype` that could be misused (toString, valueOf, hasOwnProperty, etc.)
- Assess whether the `jsFunc[methodName]` check at line 137 (`if(this.jsFunc[methodName])`) prevents prototype traversal for all targeted methods or only some
- Check whether the KeyboardMappings.json is served with any cache-control or integrity headers

**For Scanner**:
- No follow-up needed

**For Registry**:
- Update vulnerability-registry.json with VULN-002 as flagged HIGH

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
