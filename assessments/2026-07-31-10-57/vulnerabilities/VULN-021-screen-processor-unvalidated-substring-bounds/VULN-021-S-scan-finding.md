# VULN-021-S: Scanner Finding - screen-processor-unvalidated-substring-bounds

**Phase**: Scanner
**Vulnerability ID**: VULN-021
**Assessment**: 2026-07-31-10-57
**Task**: R-M-005 - Screen Processor and Transformation Rendering — Server Data Handling
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: LOW
**File**: `src/app/services/screen-processor.service.ts`
**Line**: 131–165
**Function**: `splitField() / cutField()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`splitField()` and `cutField()` use server-supplied `rect.minX` and `rect.maxX` coordinates without bounds validation. JavaScript's `substring()` silently coerces out-of-range values (negatives to 0; swaps start/end if start > end) — no exceptions are thrown. However, this produces incorrect field splitting with malformed server data, causing screen fields to be incorrectly positioned or have wrong content.

Additional concern in `filterCollisions()`:
```typescript
fields = fields.concat(this.splitField(field, rect));  // extends array being iterated
```
This grows the `fields` array during iteration. With adversarial server data (many overlapping regions), the loop length grows geometrically. In a browser context this cannot exhaust OS memory but will freeze the Angular UI thread (DoS for the affected tab).

Table coordinate mutation at line 84:
```typescript
body.bottomRight.row = body.topLeft.row + tableTransform.table.rows.length  // in-place mutation, no max cap
```
An extremely large `rows.length` produces a bounding rectangle spanning the entire coordinate space, hiding all screen fields.

**Transformation rendering false positive confirmed**: Reviewed all 9 transformation HTML templates — none use `[innerHTML]` or `bypassSecurityTrust*` bindings. All use `{{ }}` interpolation. The transformation rendering pipeline is safe from XSS.

---

## Context

**Scan Task**: [R-M-005](../../01-recon/tasks/R-M-005-screen-processor-transform-rendering.json)
**Coverage**: 100% of screen-processor.service.ts, all 9 transformation HTML templates

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Add bounds validation on rect.minX/maxX before substring; add a `maxFields` cap in `filterCollisions()`; use `structuredClone()` instead of JSON.parse(JSON.stringify()) for safety; verify whether a malformed ApplinX response can actually reach `splitField()` with adversarial coordinates in practice

**For Registry**: Update vulnerability-registry.json with VULN-021 as flagged LOW

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
