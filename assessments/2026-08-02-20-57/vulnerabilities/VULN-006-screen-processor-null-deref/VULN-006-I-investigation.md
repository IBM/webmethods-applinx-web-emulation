# VULN-006-I: Investigation Report - screen-processor-null-deref

**Phase**: Inquisitor
**Vulnerability ID**: VULN-006
**Descriptor**: screen-processor-null-deref
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: MEDIUM

---

## Root Cause Analysis

`splitField()` at lines 142-143 and `cutField()` at lines 167-170 use optional chaining for `contentLen` guard (`f1.content?.length ?? 0`) but then call `.substring()` directly on the same `field.content` without null propagation. When `field.content` is null, `contentLen` correctly becomes 0, clamping passes silently, and the subsequent `f1.content.substring()` throws `TypeError: Cannot read property 'substring' of null`. No `try-catch` surrounds this path and no global Angular `ErrorHandler` is registered, so the unhandled exception crashes screen rendering.

---

## Attack Scenario

Compromised ApplinX backend crafts a `GetScreenResponse` containing a transformation rectangle that overlaps a field with `content: null`. `ScreenProcessorService.processRegionsToHide()` calls `filterCollisions()` which calls `splitField()`/`cutField()` on the null-content field. `TypeError` is thrown, propagates up the call stack, Angular change detection crashes, terminal screen rendering is blocked. User session is frozen (must refresh or re-login). Chained with VULN-012: send 1000 overlapping rects to trigger O(n²) splitting loop + null content at any position = instant crash with lower overhead.

---

## Prerequisites

- ApplinX REST API backend compromised or server legitimately sends Field with null content property
- At least one transformation rectangle must overlap the null-content field's screen position
- No upstream null-filtering before `filterCollisions()` receives the field

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX REST API backend
**Achieved Privilege**: Client-side session DoS — screen rendering blocked, user frozen
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: NONE
**Availability**: HIGH

### Impact Description

Terminal screen rendering completely blocked until user refreshes or re-authenticates. Session is destroyed. Repeated attacks prevent sustained sessions. No data exfiltration or modification — purely availability impact.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API GetScreenResponse fields[].content (nullable — server-controlled)

**Transformations**:
- `ScreenService.getScreen()` deserializes REST response
- `ScreenComponent.postGetScreen()` → `onScreenInit()` passes fields to `processRegionsToHide()`
- `ScreenProcessorService.filterCollisions()` iterates fields, calls `splitField()`/`cutField()` on collisions
- `splitField()` line 139: `contentLen = f1.content?.length ?? 0` — safe (null → 0)
- `splitField()` line 142: `f1.content.substring(0, clampedMinX)` — **UNSAFE** (throws TypeError if null)

**Sinks**:
- Unhandled TypeError propagates through Angular change detection
- Screen rendering cycle crashes — user session frozen

---

## Affected Components

### Direct Impact

- **ScreenProcessorService.splitField()**: Null dereference at lines 142-143 crashes rendering
- **ScreenProcessorService.cutField()**: Same pattern at lines 167, 170

### Indirect Impact

- **ScreenComponent rendering cycle**: Entire screen render aborted when exception propagates
- **User terminal session**: Session frozen — DoS for the authenticated user

---

## Remediation Guidance

### Recommended Fix

Propagate the null guard from the contentLen calculation to the substring calls: replace `f1.content.substring(x, y)` with `f1.content?.substring(x, y) ?? ''` in all four affected locations (`splitField` lines 142-143, `cutField` lines 167 and 170). Alternatively add an early return in `splitField`/`cutField` when content is null: `if (!field.content) return [];` for split or `return field` for cut.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Add null coalescing to all four substring calls: `f1.content?.substring(...) ?? ''`
2. Add an early guard in `splitField()`: `if (!f1.content || !f2.content) return [f1, f2]` as-is
3. Register a global Angular `ErrorHandler` to prevent unhandled exceptions from crashing rendering
4. Add server-side validation: ApplinX REST API should not send fields with null content to transformations
5. See VULN-012 for companion fix: limit transformation rectangle count to prevent O(n²) amplification

---

## References

**Scan Finding**: [VULN-006-S-scan-finding.md](VULN-006-S-scan-finding.md)

**Threat Model References**:
- TM-005

**Attack Surface References**:
- AS-001

**External References**:
- CWE-476: NULL Pointer Dereference
- Attack chain AC-004: VULN-012 O(n²) splitting + VULN-006 null crash = compounded DoS

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
