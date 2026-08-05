# Security Assessment: webmethods-applinx-web-emulation

**Assessment ID**: 2026-08-02-20-57
**Project**: webmethods-applinx-web-emulation
**Branch**: main
**Commit**: 422f76357a6f82185b446a763abd5a7452cadab5
**Started**: 2026-08-02T20:57:00Z
**Phase**: Recon — COMPLETE

---

## Project Summary

IBM ApplinX Web Emulation is an Angular 20 SPA that provides browser-based terminal emulation for IBM ApplinX mainframe/AS400 sessions. It connects to an ApplinX REST API backend, supports OIDC/Basic/LDAP/Natural/Disabled authentication, renders legacy 3270/5250 host screens as modern HTML5 UI, and provides macro recording/playback and screen transformation (tables, calendars, menus).

**Key security characteristics:**
- Server-supplied data (screen fields, CSS styles, keyboard mappings, redirect URIs, coordinates) flows from the ApplinX REST backend into the Angular DOM
- OIDC authorization code flow with state nonce CSRF protection
- Prior security remediation pass annotated with VULN-002 through VULN-023 inline fix comments
- Closed-source `@ibm/applinx-rest-apis` SDK v10.15.7

---

## Assessment Navigation

| Artifact | Path | Description |
|----------|------|-------------|
| Project Profile | [`project-profile.md`](project-profile.md) | STRIDE threat model, attack surface, data flows, risk assessment |
| Vulnerability Registry | [`vulnerability-registry.md`](vulnerability-registry.md) | All confirmed vulnerabilities (empty at recon phase) |
| Scan Strategy | [`01-recon/R-scan-strategy.md`](01-recon/R-scan-strategy.md) | All planned scan tasks with priorities |
| Assessment Manifest | [`assessment-manifest.json`](assessment-manifest.json) | Machine-readable assessment metadata |

---

## Scan Tasks (12 Total)

### HIGH Priority (4)

| Task | Title | Status |
|------|-------|--------|
| [R-H-001](01-recon/tasks/R-H-001-oidc-auth-session.md) | OIDC Auth Flow and Session Token Handling | PENDING |
| [R-H-002](01-recon/tasks/R-H-002-css-injection-field-style.md) | Server-Supplied CSS Injection via field.style | PENDING |
| [R-H-003](01-recon/tasks/R-H-003-keyboard-mapping-dispatch.md) | Keyboard Mapping Dispatch and sendKey Validation | PENDING |
| [R-H-004](01-recon/tasks/R-H-004-npm-dependency-audit.md) | npm Dependency CVE Audit | PENDING |

### MEDIUM Priority (5)

| Task | Title | Status |
|------|-------|--------|
| [R-M-001](01-recon/tasks/R-M-001-macro-sessionstorage.md) | Macro Name Validation and sessionStorage Lifecycle | PENDING |
| [R-M-002](01-recon/tasks/R-M-002-screen-processor-coordinates.md) | ScreenProcessorService Server-Supplied Coordinate Handling | PENDING |
| [R-M-003](01-recon/tasks/R-M-003-angular-template-xss.md) | Angular Template Binding and XSS Surface Review | PENDING |
| [R-M-004](01-recon/tasks/R-M-004-error-logging-disclosure.md) | Error Message Disclosure and Debug Logging | PENDING |
| [R-M-005](01-recon/tasks/R-M-005-prior-vuln-fix-review.md) | Prior VULN Fix Correctness Verification | PENDING |

### LOW Priority (3)

| Task | Title | Status |
|------|-------|--------|
| [R-L-001](01-recon/tasks/R-L-001-polling-loop-resource.md) | NavigationService Polling Loop Resource Management | PENDING |
| [R-L-002](01-recon/tasks/R-L-002-cicd-pipeline-config.md) | CI/CD Pipeline Configuration Security | PENDING |
| [R-L-003](01-recon/tasks/R-L-003-dead-code-debug-output.md) | Dead Code and Debug Output Cleanup Audit | PENDING |

---

## Top Risk Areas

1. **OIDC Auth Flow** — State parameter CSRF and redirect URI open redirect; prior fixes (VULN-003, VULN-007) need correctness verification
2. **CSS Injection via field.style** — Server-supplied CSS parsed with property allowlist; allowlist bypass potential (vendor prefixes, encoded values)
3. **Keyboard Mapping Dispatch** — Server-controlled function names dispatched to JS; prototype chain guard (VULN-002) has edge case with `constructor` property
4. **npm Dependencies** — `jquery 3.6.0` with known CVEs; `package-lock.json` untracked

---

## Directory Structure

```
assessments/2026-08-02-20-57/
├── README.md                          ← This file
├── assessment-manifest.json           ← Assessment metadata
├── project-profile.json + .md        ← STRIDE threat model + attack surface
├── vulnerability-registry.json + .md ← Vulnerability index (empty at recon)
├── 01-recon/
│   ├── R-scan-strategy.json + .md    ← Task overview
│   └── tasks/                        ← 12 individual task files (JSON + MD each)
│       ├── R-H-001 through R-H-004   ← HIGH priority tasks
│       ├── R-M-001 through R-M-005   ← MEDIUM priority tasks
│       └── R-L-001 through R-L-003   ← LOW priority tasks
├── 02-scanning/                       ← Scanner output (future)
├── 03-inquisition/                    ← Inquisitor output (future)
├── 04-exploitation/                   ← Exploiter output (future)
├── 05-remediation/                    ← Rectifier output (future)
└── vulnerabilities/                   ← Individual vulnerability files (future)
```

---

## Next Steps

Switch to **D4rthB0b-Scanner** mode to execute the 12 scan tasks, starting with `R-H-001` (OIDC auth) and `R-H-004` (npm audit) which can run in parallel.
