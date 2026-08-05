# VULN-006-S: Scanner Finding - screen-processor-null-deref

**Phase**: Scanner
**Vulnerability ID**: VULN-006
**Descriptor**: screen-processor-null-deref
**Assessment**: 2026-08-02-20-57
**Task**: R-M-002 - ScreenProcessorService Server-Supplied Coordinate Handling
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/screen-processor.service.ts`
**Line**: 142
**Function**: `splitField / cutField`
**Detected By**: LLM analysis

---

## Preliminary Assessment

VULN-021 and VULN-023 correctly apply Math.max/Math.min clamping to prevent out-of-range substring bounds, but the clamping logic uses optional chaining (`field.content?.length ?? 0`) for the guard while the downstream `substring()` calls use direct property access (`f1.content.substring()`). If `field.content` is null or undefined, `contentLen` correctly defaults to 0 but the subsequent `.substring()` call throws `TypeError: Cannot read property 'substring' of null`. A compromised ApplinX backend sending a transformation rectangle for a field with null content crashes the ScreenProcessorService, causing a DoS for the session.

### Code Snippet

```typescript
// splitField() — lines 139-143:
const contentLen = f1.content?.length ?? 0;  // SAFE: handles null
const clampedMinX = Math.max(0, Math.min(rect.minX - 1, contentLen));
const clampedMaxX = Math.max(0, Math.min(rect.maxX, contentLen));
f1.content = f1.content.substring(0, clampedMinX);  // UNSAFE: TypeError if f1.content is null
f2.content = f2.content.substring(clampedMaxX);     // UNSAFE: same issue

// cutField() — lines 164-170: same pattern
const contentLen = field.content?.length ?? 0;  // SAFE
field.content = field.content.substring(...);    // UNSAFE: TypeError if null
```

---

## Context

**Scan Task**: [R-M-002](../../01-recon/tasks/R-M-002-screen-processor-coordinates.md)
**Target**: src/app/services/screen-processor.service.ts
**Coverage**: 100% — entire file analyzed

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-005: Server-Supplied Coordinate Overflow in Screen Processor — clamping correctness

**Related Attack Surface**:
- AS-001: ApplinX REST API — transformation coordinates in GetScreenResponse

---

## Analysis Notes

**Patterns Observed**:
- VULN-021 and VULN-023 clamping logic semantically correct for non-null content
- Optional chaining used for contentLen computation but not for downstream substring() calls
- No validation of inverted rectangles (rect.minX > rect.maxX) — degenerate case silently ignored
- Rectangle constructor accepts coordinates without bounds validation
- filterCollisions() grows array during iteration — see VULN-012

**Coverage Assessment**: Complete analysis of all coordinate-handling methods including splitField(), cutField(), filterCollisions(), processTable(), Rectangle constructor, initTree().

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
- Verify if ApplinX REST API can send fields with null content property
- Test DoS: craft GetScreenResponse with transformation rectangle over a null-content field — verify TypeError crash
- Verify filterCollisions() growth behavior: send 1000 overlapping rectangles — measure memory and CPU impact
- Confirm processTable() rows.length bounds — test with empty rows array

**For Registry**:
- Assign VULN-006 to screen-processor-null-deref
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
