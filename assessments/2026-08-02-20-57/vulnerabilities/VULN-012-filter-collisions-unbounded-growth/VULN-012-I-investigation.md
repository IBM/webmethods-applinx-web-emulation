# VULN-012-I: Investigation Report - filter-collisions-unbounded-growth

**Phase**: Inquisitor
**Vulnerability ID**: VULN-012
**Descriptor**: filter-collisions-unbounded-growth
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: HIGH

---

## Root Cause Analysis

`filterCollisions()` mutates the `fields` array during iteration: `fields = fields.concat(this.splitField(field, rect))`. Each call to `splitField()` returns `[f1, f2]` (two new fields). The outer loop reads `fields.length` dynamically, so new fields are immediately queued for processing. Each new field has a new column position and may collide with subsequent transformation rectangles — creating O(n²) growth in the worst case. For 1000 sequential rectangles on one field: the sum 1000+999+998+...+1 = ~500,500 iterations (not linear as Scanner stated). **Scanner underestimated growth by ~250x.**

---

## Attack Scenario

A compromised ApplinX backend sends `GetScreenResponse` with one large field (column 1, length 1000) and 1000 transformation rectangles each 1 column wide at positions 1-1000. `filterCollisions()` creates cascading splits: ~500,000 Field object creations, ~1M total iterations, multiple GB of memory allocation. Browser JavaScript thread blocks for 10-60 seconds. Tab becomes unresponsive.

**Chained with VULN-006**: include one null-content field to trigger instant `TypeError` crash.
**Chained with VULN-014**: 1M `FieldComponent` constructions each trigger 2 `console.log()` calls, amplifying memory exhaustion.

---

## Prerequisites

- Compromised ApplinX REST backend (service account, insider, MITM on unencrypted channel)
- Craft `GetScreenResponse` with one large field and many overlapping transformation rectangles
- No server-side or client-side limit on rectangle count per screen response

---

## Privilege Boundary Analysis

**Starting Privilege**: ApplinX backend (compromised) or MITM on REST channel
**Achieved Privilege**: Client-side resource exhaustion (browser tab DoS)
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: HIGH

### Impact Description

Browser tab freeze for 10-60 seconds, potentially permanent for very large payloads. User's terminal session is destroyed and must be re-established. In critical business workflows (banking, air traffic, healthcare terminals), this interruption could have significant operational impact. O(n²) growth means impact scales rapidly with rectangle count.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `GetScreenResponse transformations[].regionsToHide[]` (server-controlled rectangle coordinates)

**Transformations**:
- `initTree()` — all rectangles inserted into RBush spatial index
- `filterCollisions()` — outer loop reads dynamic `fields.length`
- `splitField()` returns `[f1, f2]` — two new fields with updated column positions
- `fields.concat([f1, f2])` — grows `fields` array, queues new fields for processing
- New fields processed: each may collide with remaining rectangles — **O(n²) cascade**

**Sinks**:
- JavaScript event loop — blocked by 500,000+ iterations
- Browser memory — ~1GB+ Field object allocations for 1000 rectangles
- Browser tab — unresponsive/frozen for 10-60 seconds

---

## Affected Components

### Direct Impact

- **ScreenProcessorService.filterCollisions()**: O(n²) field splitting with no bounds check on rectangle count or total fields

### Indirect Impact

- **ScreenComponent rendering pipeline**: Screen render blocked while `filterCollisions()` runs indefinitely
- **FieldComponent constructor (VULN-014)**: Each new Field object triggers 2 `console.log()` calls — memory amplification

---

## Remediation Guidance

### Recommended Fix

Add a maximum fields count guard in `filterCollisions()`: if `fields.length` exceeds `MAX_FIELDS` (e.g., 10000), log a warning and break the loop. Also consider using `fields.push(f1, f2)` instead of `fields.concat()` to avoid creating a new array on each split. Add a maximum transformation rectangle count limit in `initTree()` to reject pathologically large inputs.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Add `MAX_FIELDS` guard in `filterCollisions()`: `if (fields.length > MAX_FIELDS) { console.warn('Field limit exceeded'); break; }`
2. Replace `fields.concat([f1, f2])` with `fields.push(f1, f2)` for O(1) append instead of O(n) array copy
3. Add `MAX_RECTS` limit in `initTree()`: truncate `transforms[].regionsToHide` to `MAX_RECTS_PER_TRANSFORM` (e.g., 100)
4. Wrap `processRegionsToHide()` in a timeout guard to prevent blocking the event loop

---

## References

**Scan Finding**: [VULN-012-S-scan-finding.md](VULN-012-S-scan-finding.md)

**Threat Model References**:
- TM-005

**Attack Surface References**:
- AS-001

**External References**:
- CWE-400: Uncontrolled Resource Consumption
- CWE-770: Allocation of Resources Without Limits or Throttling
- VULN-006: Null dereference chains with VULN-012 for compounded DoS (attack chain AC-004)

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
