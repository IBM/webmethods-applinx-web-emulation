# VULN-012-S: Scanner Finding - filter-collisions-unbounded-growth

**Phase**: Scanner
**Vulnerability ID**: VULN-012
**Descriptor**: filter-collisions-unbounded-growth
**Assessment**: 2026-08-02-20-57
**Task**: R-M-002 - ScreenProcessorService Server-Supplied Coordinate Handling
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/screen-processor.service.ts`
**Line**: 107
**Function**: `filterCollisions`
**Detected By**: LLM analysis

---

## Preliminary Assessment

`filterCollisions()` iterates over the fields array using an index that reads `fields.length` on each iteration. When `splitField()` is called (line 110), it returns `[f1, f2]` which are concatenated to the `fields` array via `fields.concat()`. Because the outer loop reads `fields.length` dynamically, the two new split fields are immediately queued for processing. If a server sends many overlapping transformation rectangles for a single field, each split produces 2 more fields which are also processed, creating linear array growth per overlap. For 1000 overlapping rects: approximately 2000+ field iterations.

### Code Snippet

```typescript
private filterCollisions(fields: Field[], transforms: AbstractTransformation[]): Field[] {
  let filtered: Field[] = [];
  for (let i = 0; i < fields.length; i++) {  // fields.length read each iteration
    let field: Field | null = fields[i];
    const collisions = this.tree.search({ ... });
    for (let j = 0; j < collisions.length && field; j++) {
      if (this.isFieldContainsRect(field, rect)) {
        fields = fields.concat(this.splitField(field, rect));  // LINE 110: APPENDS 2 new fields
        field = null;
      } else {
        field = this.cutField(field, rect);
      }
    }
    if (field) filtered.push(field);
  }
  return filtered;
}
```

---

## Context

**Scan Task**: [R-M-002](../../01-recon/tasks/R-M-002-screen-processor-coordinates.md)
**Target**: src/app/services/screen-processor.service.ts
**Coverage**: 100%

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-005: Server-Supplied Coordinate Overflow in Screen Processor

**Related Attack Surface**:
- AS-001: ApplinX REST API — transformation coordinates in GetScreenResponse

---

## Analysis Notes

**Patterns Observed**:
- Array mutation during iteration — fields.concat() grows array while loop uses dynamic length
- No maximum field count limit per input field
- VULN-006 (null content) and VULN-012 (unbounded growth) can be chained for compounded DoS

**Coverage Assessment**: Complete analysis of filterCollisions() including loop structure, concat behavior, and interaction with splitField/cutField.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Test with 100, 1000, and 10000 overlapping rectangles — measure browser performance impact
- Verify if ApplinX REST API has server-side limits on transformation rectangle count per field
- Evaluate fix: add maximum fields count check (e.g., if fields.length > MAX_FIELDS break)

**For Registry**:
- Assign VULN-012 to filter-collisions-unbounded-growth
- Set status: flagged, severity: medium

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
