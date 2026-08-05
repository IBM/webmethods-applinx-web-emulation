# Security Assessment: applinx-web-emulation

**Assessment ID**: 2026-07-31-10-57
**Project**: IBM webMethods ApplinX Web Emulation
**Type**: Angular 20 SPA — Browser-based mainframe/host terminal emulator
**Branch**: main @ `422f76357a6f82185b446a763abd5a7452cadab5`
**Scope**: Full codebase assessment
**Status**: 🔍 Recon complete — Ready for Scanner

---

## Quick Navigation

| Artifact | Path | Description |
|----------|------|-------------|
| Project Profile | [`project-profile.md`](project-profile.md) | STRIDE threat model, attack surface map, data flows |
| Vulnerability Registry | [`vulnerability-registry.md`](vulnerability-registry.md) | All discovered vulnerabilities |
| Scan Strategy | [`01-recon/R-scan-strategy.md`](01-recon/R-scan-strategy.md) | All 13 scan tasks with priorities |
| Assessment Manifest | [`assessment-manifest.json`](assessment-manifest.json) | Machine-readable assessment metadata |

---

## Architecture Summary

**applinx-web-emulation** is an Angular 20 SPA that renders IBM mainframe/AS400/UNIX host screens in a browser. It connects to an **IBM ApplinX REST API** backend (HTTP, port 2380 in dev / same-origin `/api` in prod) which bridges to the actual host system.

**Authentication modes**: ApplinX (Basic auth), LDAP (Basic auth), Natural (inline credentials in JSON), OpenID Connect (authorization code flow), Disabled (auto-login).

**Key security-relevant components**:
- [`WebLoginComponent`](../src/app/webLogin/webLogin.component.ts) — authentication entry point
- [`RouteGuardService`](../src/app/services/route-guard.service.ts) — OIDC code exchange and route protection
- [`StorageService`](../src/app/services/storage.service.ts) — Bearer token in sessionStorage
- [`KeyboardMappingService`](../src/app/services/keyboard-mapping.service.ts) — dynamic JS dispatch from config/server data
- [`InputFieldComponent`](../src/app/mini-components/input-field/input-field.component.ts) — `bypassSecurityTrustStyle` on server-supplied CSS
- [`MacroComponent`](../src/app/macro/macro.component.ts) — base64-only password storage in macro files

---

## Key Risk Areas

| Risk | Threat | Priority |
|------|--------|----------|
| `bypassSecurityTrustStyle` in InputFieldComponent with server-supplied style | XSS / CSS injection | HIGH |
| Dynamic JS dispatch `jsFunc[methodName](param)` in KeyboardMappingService | Code injection | HIGH |
| OIDC authorization code flow — no state parameter, `window.location.href` from server | CSRF / Open Redirect | HIGH |
| Bearer token + OIDC code + credentials in sessionStorage | Session hijacking via XSS | HIGH |
| Macro passwords stored as base64 JSON on ApplinX server | Credential disclosure | HIGH |
| npm dependency pinning — jquery 3.6.0, bootstrap 5.1.3 | Known CVEs | HIGH |

---

## Scan Tasks (13 total)

### HIGH (6 tasks)
| ID | Title |
|----|-------|
| [R-H-001](01-recon/tasks/R-H-001-xss-dom-injection.md) | XSS / DOM Injection — bypassSecurityTrustStyle and server-content rendering |
| [R-H-002](01-recon/tasks/R-H-002-keyboard-dynamic-dispatch.md) | Dynamic Code Dispatch — KeyboardMappingService targetFunction |
| [R-H-003](01-recon/tasks/R-H-003-oidc-auth-code-open-redirect.md) | OIDC Flow — Authorization Code Handling and Open Redirect |
| [R-H-004](01-recon/tasks/R-H-004-credential-token-storage.md) | Credential and Token Storage — sessionStorage, Macro Passwords |
| [R-H-005](01-recon/tasks/R-H-005-authentication-flows.md) | Authentication Flows — WebLoginComponent and SessionService |
| [R-H-006](01-recon/tasks/R-H-006-dependency-scan.md) | Dependency Vulnerability Scan — npm packages |

### MEDIUM (5 tasks)
| ID | Title |
|----|-------|
| [R-M-001](01-recon/tasks/R-M-001-user-exits-extensibility.md) | User-Exit Extensibility — IUserExits, GXGeneratedPage, and JSFunctionsService |
| [R-M-002](01-recon/tasks/R-M-002-error-message-log-injection.md) | Error Message Information Disclosure and Log Injection |
| [R-M-003](01-recon/tasks/R-M-003-config-trust-boundary.md) | Configuration Trust Boundary — sessionConfig.json and KeyboardMappings.json |
| [R-M-004](01-recon/tasks/R-M-004-macro-feature-sast.md) | Macro Feature SAST — Recording, Playback, Filename Handling |
| [R-M-005](01-recon/tasks/R-M-005-screen-processor-transform-rendering.md) | Screen Processor and Transformation Rendering — Server Data Handling |

### LOW (2 tasks)
| ID | Title |
|----|-------|
| [R-L-001](01-recon/tasks/R-L-001-cicd-supply-chain.md) | CI/CD Pipeline Security — pipeline-config.yaml and Supply Chain |
| [R-L-002](01-recon/tasks/R-L-002-session-polling-resilience.md) | Session Polling Resilience and Resource Exhaustion |

---

## Phase Status

| Phase | Status |
|-------|--------|
| 01 Recon | ✅ Complete |
| 02 Scanner | ⏳ Pending |
| 03 Inquisition | ⏳ Pending |
| 04 Exploitation | ⏳ Pending |
| 05 Remediation | ⏳ Pending |

---

## Directory Structure

```
assessments/2026-07-31-10-57/
├── README.md                          ← This file
├── assessment-manifest.json           ← Machine-readable metadata
├── project-profile.json + .md        ← STRIDE model, attack surface
├── vulnerability-registry.json + .md ← Vulnerability index (empty)
├── 01-recon/
│   ├── R-scan-strategy.json + .md    ← All 13 scan tasks overview
│   ├── tasks/                         ← 13 individual task file pairs
│   └── authorization/
├── 02-scanning/
│   ├── tasks/
│   └── raw/
├── 03-inquisition/
│   └── I-analysis-scripts/
├── 04-exploitation/
│   └── attack-chains/
├── 05-remediation/
└── vulnerabilities/
```
