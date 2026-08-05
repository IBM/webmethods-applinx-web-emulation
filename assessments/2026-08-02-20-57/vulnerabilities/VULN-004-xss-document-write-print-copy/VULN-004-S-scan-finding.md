# VULN-004-S: Scanner Finding - xss-document-write-print-copy

**Phase**: Scanner
**Vulnerability ID**: VULN-004
**Descriptor**: xss-document-write-print-copy
**Assessment**: 2026-08-02-20-57
**Task**: R-M-003 - Angular Template Binding and XSS Surface Review
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/app.component.ts`
**Line**: 533
**Function**: `formatPrintPage`
**Detected By**: LLM analysis

---

## Preliminary Assessment

Angular template binding review found the application correctly uses `{{ }}` interpolation for rendering server-supplied field content across all transformation component templates. However, the print and copy functionality bypasses Angular's sanitization in two places: (1) `formatPrintPage()` at line 533-535 uses `document.write()` with unsanitized screen line content concatenated into HTML; (2) `formatCopyPage()` at line 560 reads `divElement.innerHTML` and stores it as `copyData`, which is then written to `copyDiv.innerHTML` in `modalpopup.component.ts` line 61. The `DomSanitizer` is imported and injected in `AppComponent` but never used — indicating incomplete sanitization implementation.

### Code Snippet

```typescript
// Print popup — line 535: unsanitized screen content in document.write()
popupWindow.document.write('<div class="copyWrapper crosshair" ...>');
printDetails.forEach(element => {
  popupWindow.document.write("<div>" + element + "</div>");  // element from screen lines
});

// Copy modal — app.component.ts:560 → modalpopup.component.ts:61:
(referenceCopy.instance as ModalpopupComponent).copyData = divElement.innerHTML;
document.getElementById("copyDiv").innerHTML = this.copyData;  // XSS if content has HTML
```

---

## Context

**Scan Task**: [R-M-003](../../01-recon/tasks/R-M-003-angular-template-xss.md)
**Target**: src/app/**/*.html, app.component.ts, transformations/**/*.html, GXGeneratedPage.ts
**Coverage**: ~90% — all HTML templates and key TypeScript components reviewed

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-003: CSS Injection — Angular [style] bindings reviewed
- TM-006: Information Disclosure — error templates reviewed

**Related Attack Surface**:
- AS-004: DOM — Angular template bindings with server-supplied field content

---

## Analysis Notes

**Patterns Observed**:
- All transformation templates (text, menu, table, calendar, clickable) correctly use {{ }} interpolation — safe
- Host key labels use {{ hostKey.caption }} text interpolation — safe
- All [ngStyle] bindings use numeric grid position primitives — safe
- DomSanitizer injected in AppComponent constructor but never used — incomplete sanitization
- Print popup: document.write() with unsanitized server content concatenation
- Copy modal: innerHTML chain from divElement.innerHTML → copyData → copyDiv.innerHTML
- modalpopup.component.ts line 117: innerHTML assignment with getSelection() text in span tag

**Coverage Assessment**: 20+ HTML template files reviewed; 30+ TypeScript component files checked for bypassSecurityTrust*, innerHTML, outerHTML patterns. Complete for key risk areas.

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
- Verify GXUtils.formatLineText() output — does it return plaintext or could it produce HTML markup from host screen data?
- Test: inject terminal screen data containing '<img src=x onerror=alert(1)>' — does it execute in the print popup window?
- Confirm whether modalpopup copyDiv innerHTML content is accessible to other users or only the current user
- Assess whether the print popup window has a CSP that would block inline scripts

**For Registry**:
- Assign VULN-004 to xss-document-write-print-copy
- Set status: flagged, severity: high

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
