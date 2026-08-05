# VULN-021-I: Investigation Report - screen-processor-unvalidated-substring-bounds

**Phase**: Inquisitor
**Vulnerability ID**: VULN-021
**Descriptor**: screen-processor-unvalidated-substring-bounds
**Assessment**: 2026-07-31-10-57
**Investigated**: 2026-07-31T12:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z

**Exploitability**: LOW

---

## Root Cause Analysis

[`ScreenProcessorService.splitField()`](src/app/services/screen-processor.service.ts:131) uses `rect.minX` and `rect.maxX` from server-supplied `Rectangle` objects (derived from transformation `regionsToHide` coordinates) directly in `substring()` calls without bounds validation: `f1.content = f1.content.substring(0, rect.minX - 1)` and `f2.content = f2.content.substring(rect.maxX)`. JavaScript's `substring()` is bounds-safe (negative indices treated as 0, out-of-range as string length) — it does NOT throw — but produces incorrect/empty content silently. [`filterCollisions()`](src/app/services/screen-processor.service.ts:91) (line 91-121) appends to the `fields` array mid-iteration (`fields = fields.concat(this.splitField(field, rect))`) — this grows the iteration target, creating potential for quadratic iteration in adversarial input scenarios.

---

## Attack Scenario

**Malformed Rect Coordinates**: Compromised ApplinX server returns transformation `regionsToHide` with `rect.minX > field.content.length`. `splitField()` produces: `f1.content = ''.substring(0, negativeOrZero) = ''`, `f2.content = field.content.substring(tooLarge) = ''`. Both split fields have empty content — fields effectively disappear from the screen without error. This is silent data suppression — the user sees nothing but doesn't know fields were hidden.

**Quadratic Growth (filterCollisions)**: If server returns many colliding transformations, `splitField()` is called repeatedly, appending to `fields[]` while iterating. In adversarial case: O(n²) field processing. This is a denial-of-service vector at the client side — excessive client-side CPU causing browser tab hang. Impact is bounded to the affected user's session.

---

## Prerequisites

- ApplinX server must be compromised or malicious to return out-of-bounds rect coordinates
- User must navigate to a screen with such transformations
- For quadratic growth: many colliding transformations in server response

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX server
**Achieved Privilege**: Silent screen content suppression or client-side CPU DoS
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: LOW
**Availability**: LOW

### Impact Description

Silent field suppression via out-of-bounds rect coordinates produces incorrect screen rendering without user awareness. Quadratic iteration in `filterCollisions()` with adversarial input can cause browser CPU spike/hang. Both require ApplinX server compromise. JavaScript `substring()` safety prevents crashes — the bug manifests as silent incorrect behavior rather than exception.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `GetScreenResponse.transformations[].regionsToHide[].topLeft/bottomRight` — server-controlled coordinates

**Transformations**:
- `Rectangle` constructor sets `minX`/`maxX` from server coords without bounds check
- `splitField()` uses `rect.minX`/`maxX` in `substring()` without validation
- `filterCollisions()` appends to iteration array mid-loop

**Sinks**:
- `f1.content` / `f2.content` — potentially empty/incorrect strings if coords out of bounds
- Rendered screen fields — missing or garbled content

---

## Affected Components

### Direct Impact

- **[`ScreenProcessorService.splitField()`](src/app/services/screen-processor.service.ts:131)**: Server rect coordinates used in `substring()` without bounds validation
- **[`ScreenProcessorService.filterCollisions()`](src/app/services/screen-processor.service.ts:91)**: Appends to iteration array mid-loop — potential quadratic growth with adversarial input

### Indirect Impact

- **ApplinX REST API /screen transformation response**: Source of server-controlled coordinates

---

## Remediation Guidance

### Recommended Fix

Add bounds validation before substring calls: `const start = Math.max(0, Math.min(rect.minX - 1, f1.content.length)); f1.content = f1.content.substring(0, start);`. Cap `filterCollisions()` iteration to a maximum processed count to prevent quadratic growth.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Clamp `rect.minX` and `rect.maxX` to `[0, field.content.length]` before `substring()`
2. Add `maxFields` cap in `filterCollisions()`: `if (filtered.length + fields.length > MAX_FIELDS) break`
3. Log unexpected out-of-bounds coordinates as warning for debugging
4. Consider pre-validating `Rectangle` coordinates on construction

---

## References

**Scan Finding**: [vulnerabilities/VULN-021-screen-processor-unvalidated-substring-bounds/VULN-021-S-scan-finding.md](vulnerabilities/VULN-021-screen-processor-unvalidated-substring-bounds/VULN-021-S-scan-finding.md)

**Threat Model References**:
- TM-001
- TM-004

**Attack Surface References**:
- AS-002

**External References**:
- CWE-20: Improper Input Validation
- CWE-400: Uncontrolled Resource Consumption (filterCollisions quadratic growth)
- OWASP A03:2021 — Injection
- CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:N/I:L/A:L — Score: 3.7 LOW

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
