# VULN-002-S: Scanner Finding - css-comment-injection-bypass

**Phase**: Scanner
**Vulnerability ID**: VULN-002
**Descriptor**: css-comment-injection-bypass
**Assessment**: 2026-08-02-20-57
**Task**: R-H-002 - Server-Supplied CSS Injection via field.style
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/mini-components/field/field.component.ts`
**Line**: 104
**Function**: `getCss`
**Detected By**: LLM analysis

---

## Preliminary Assessment

The `getCss()` regex filter for blocking `url()`, `expression()`, and `javascript:` patterns has two identified bypass vectors: (1) CSS comment injection — the regex uses `\s*` between 'url' and '(' but CSS comment sequences (`/**/`) are not whitespace and are not consumed by `\s*`, so `url/**/( ` passes the regex unmatched; (2) CSS hex escape encoding — `jav\61script:` uses CSS hex escape where `\61` = `a`, but the browser normalizes this at render time to `javascript:`. If Angular's `[style]` binding passes values to the browser DOM without prior normalization, the escape would be evaluated after the regex check. Both bypasses exist in both `FieldComponent` and `InputFieldComponent`.

### Code Snippet

```typescript
if (FieldComponent.ALLOWED_CSS_PROPS.has(prop) && value &&
    !/url\s*\(|expression\s*\(|javascript\s*:/i.test(value)) {
  result[prop] = value;
}
// BYPASS 1: regex \s* does not consume CSS comments:
// field.style='color: url/**/(' → regex does NOT match 'url/**/(' → passes
// BYPASS 2: CSS hex escape sequences:
// field.style='color: jav\61script:' → regex does NOT see 'javascript:' → passes
```

---

## Context

**Scan Task**: [R-H-002](../../01-recon/tasks/R-H-002-css-injection-field-style.md)
**Target**: src/app/mini-components/field/field.component.ts, input-field.component.ts, *.html
**Coverage**: 100% — all four target files analyzed

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-003: CSS Injection via Server-Supplied field.style — allowlist must correctly block all exfiltration patterns

**Related Attack Surface**:
- AS-001: Browser ↔ ApplinX REST API — field.style is server-supplied string in GetScreenResponse
- AS-004: DOM rendering — Angular [style] binding with server-supplied CSS object

---

## Analysis Notes

**Patterns Observed**:
- getCss() implementations identical in both FieldComponent and InputFieldComponent — same bypass affects both
- ALLOWED_CSS_PROPS allowlist is conservative and correctly excludes 'background' shorthand
- Templates bind [style]='getCss()' for all server CSS paths — correct binding pattern
- Null/undefined guard via '?? ''' and '!raw' check is correct — no crash path on null field.style
- Allowlist duplication in two components — future divergence risk if one is updated without the other

**Coverage Assessment**: Complete — all four target files analyzed. getCss() implementations in both TypeScript files verified identical. Both HTML templates confirmed to use [style]='getCss()'.

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
- Verify Angular [style] binding behavior: does it normalize CSS escapes/comments before passing to browser DOM or pass raw?
- Test regex bypass in runtime: attempt 'color: url/**/(https://evil.com)' — does Angular normalize the comment before rendering?
- Test hex escape bypass: 'color: jav\61script:alert(1)' — does the browser normalize \61 to 'a' after Angular [style] processes it?
- Evaluate whether adding CSS comment stripping before regex check would fully mitigate

**For Registry**:
- Assign VULN-002 to css-comment-injection-bypass
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
