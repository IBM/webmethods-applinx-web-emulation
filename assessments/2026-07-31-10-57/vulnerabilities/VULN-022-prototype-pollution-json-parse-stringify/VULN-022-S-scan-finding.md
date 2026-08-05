# VULN-022-S: Scanner Finding - prototype-pollution-json-parse-stringify

**Phase**: Scanner
**Vulnerability ID**: VULN-022
**Assessment**: 2026-07-31-10-57
**Task**: R-M-001 - User-Exit Extensibility — IUserExits, GXGeneratedPage, and JSFunctionsService
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/generated-pages/GXGeneratedPage.ts`
**Line**: 42
**Function**: `GXGeneratedPage constructor`
**Detected By**: LLM static analysis

Secondary location: `src/app/services/screen-processor.service.ts:133–134` (`splitField()`)

---

## Preliminary Assessment

`JSON.parse(JSON.stringify(obj))` is used as a deep-clone pattern in two locations where the source object is server-supplied. This pattern does NOT protect against prototype pollution — a server response containing `{"__proto__": {"isAdmin": true}}` would populate `__proto__` on the cloned object.

**Browser-context caveat**: In modern browsers (V8), `JSON.parse` does process `__proto__` keys but assigns them to `Object.prototype` only in older engine versions. Current Chrome/Firefox treat `__proto__` as a regular property name, mitigating the direct pollution vector. However, `Object.assign` (used in `GXGeneratedPagesUtils.mergeScreens()`) may propagate it.

The risk is low in a browser SPA context but is a recognized anti-pattern for handling untrusted server data. The recommended fix is `structuredClone(obj)` (available in all modern browsers and Angular 20 environments).

### Code Snippet

```typescript
// GXGeneratedPage.ts:42
this.screenModel = JSON.parse(JSON.stringify(page.screenModel));

// screen-processor.service.ts:133–134
const f1 = JSON.parse(JSON.stringify(field));
const f2 = JSON.parse(JSON.stringify(field));
```

---

## Context

**Scan Task**: [R-M-001](../../01-recon/tasks/R-M-001-user-exits-extensibility.json)
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Test in the target browser environment whether `JSON.parse('{"__proto__":{"test":1}}')` actually pollutes `Object.prototype`; if confirmed, replace all `JSON.parse(JSON.stringify())` clone calls with `structuredClone()` which handles __proto__ safely

**For Registry**: Update vulnerability-registry.json with VULN-022 as flagged LOW

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
