# Project Security Profile

**Assessment ID**: 2026-07-31-10-57
**Generated**: 2026-07-31T10:57:00Z
**Analyst**: D4rthB0b-Recon
**Location**: `assessments/2026-07-31-10-57/project-profile.md`

---

## Project Overview

**Project Name**: applinx-web-emulation
**Project Type**: Web App
**Primary Purpose**: Angular-based web terminal emulation front-end for IBM webMethods ApplinX REST API. Renders mainframe/AS400/UNIX host screens (3270/VT/BMS) in a browser, handles authentication (ApplinX, LDAP, Natural, OpenID Connect), session management, keyboard mapping, screen transformations (tables, calendars, menus), macro recording/playback, and user-exit extensibility.
**Repository**: https://github.com/IBM/webmethods-applinx-web-emulation

---

## Technology Stack

### Languages & Frameworks

| Language | Percentage | Primary Frameworks | Version |
|----------|-----------|-------------------|---------|
| TypeScript | 93% | Angular, RxJS | 20.3.25, 7.5.2 |
| SCSS/HTML | 7% | Bootstrap, Carbon Design System (Angular) | 5.1.3, 5.57.7 |

### Runtime Environments
- **Primary**: Browser (Chrome/Firefox/Edge) — Angular SPA
- **Secondary**: Node.js (build time only, Angular CLI 20.x), IBM ApplinX REST API server (backend, port 2380)

### Dependencies

**Package Managers Detected**:
- npm

**Critical Dependencies**:
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| @ibm/applinx-rest-apis | 10.15.7 | Client SDK for ApplinX REST API — session, screen, macro, info services | Third-party IBM SDK; all REST calls authenticated with Bearer token in sessionStorage. Deserializes server JSON responses directly into typed objects without further validation. |
| jquery | 3.6.0 | DOM manipulation in webLogin component | 3.6.0 is outdated; CVE exposure possible. Used sparingly via global $. |
| ngx-logger | 5.0.12 | Frontend structured logging, including remote log shipping via HTTP | Custom HTTP headers set with auth token. Log messages include user-controlled data (screen names, field names, error messages from server responses). |
| bootstrap | 5.1.3 | CSS/JS UI framework | Older Bootstrap version; known XSS risks in tooltip/popover if used with unsanitized HTML. |
| rbush | 3.0.1 | R-tree spatial index for screen field/transformation collision detection | Data fed entirely from server responses via ApplinX SDK. |
| rxjs-compat | 6.6.7 | RxJS 5 compatibility shim | Legacy compatibility layer; indicates mixed/legacy observable patterns. |

**Outdated/Vulnerable Dependencies** (High-Level):
- jquery: 3.6.0 → 3.7.x (medium vulnerabilities)
- rxjs-compat: 6.6.7 → deprecated (low vulnerabilities)

---

## Architecture Analysis

### Architecture Pattern
- **Pattern**: Monolith
- **Evidence**: Single Angular SPA with no server-side code. All business logic in Angular services and components. Communicates exclusively with ApplinX REST API backend via HTTP proxy (dev: proxy.conf.json → port 2380; prod: same-origin /api path).

### Components

**Entry Points**:
- /webLogin route — WebLoginComponent (authentication, session creation)
- /instant route — ScreenComponent (host screen render/interaction)
- AppModule route guard — RouteGuardService (OpenID Connect code exchange on any guarded route)

**Core Modules**:
- **WebLoginComponent**: Authentication UI: ApplinX/LDAP Basic auth, Natural auth (inline credentials), OpenID Connect redirect, auto-login (auth disabled)
- **ScreenComponent**: Main host screen renderer: fetches GetScreenResponse, processes fields/transformations, handles keyboard input, manages child windows, routing to generated pages
- **NavigationService**: Core session state machine: sendKeys, getScreen, polling for host screen updates every 5s, error/disconnect handling
- **RouteGuardService**: Angular route guard: OpenID Connect authorization_code exchange flow, session validation, redirect logic
- **OAuth2HandlerService**: OpenID Connect client: initiates IDP redirect, exchanges authorization_code with ApplinX REST API for session token
- **ConfigurationService**: Loads sessionConfig.json (applicationName, connectionPool, sessionOptions, autoLogin flag) from assets/config/
- **StorageService**: Bearer token stored/retrieved from sessionStorage under key gx_token; userName stored under userName key; macro list under macroFileList
- **KeyboardMappingService**: Maps keyboard events to ApplinX function keys; loads KeyboardMappings.json; executes JS function strings via dynamic dispatch (jsFunc[methodName](param))
- **MacroComponent**: Macro record/view/play/delete UI; passwords base64-encoded in macro steps; macro data saved as JSON files on ApplinX server
- **ScreenProcessorService**: Field/transformation collision detection using RBush spatial index; splits/cuts fields based on server-supplied region data
- **InputFieldComponent**: Renders host input fields; uses DomSanitizer.bypassSecurityTrustStyle for field.style; client-side datatype keystroke filtering
- **TransformGeneratorComponent**: Dynamic transformation renderer: Calendar, Table, Menu, Checkbox, Clickable, Line, Text, ModalPopup, MultipleOptions
- **GXGeneratedPage (abstract)**: Base class for generated page components; processes/merges runtime screen with designer model; supports user-exit registration
- **JSFunctionsService / IJSFunctionService**: User-injectable JS function endpoint invoked by keyboard mapping engine; empty default implementation intended to be overridden
- **UserExitsEventThrowerService**: Event bus for pre/post hooks: connect, getScreen, sendKey, disconnect, afterViewInit

**External Integrations**:
- **ApplinX REST API**: All host session operations (connect, sendKeys, getScreen, getInfo, macro CRUD). Backend at localhost:2380 in dev; same-origin /api in prod., Bearer token in Authorization header; token obtained from session connect response and stored in sessionStorage
- **OpenID Connect Identity Provider**: External IdP for OpenID Connect authentication flow; redirected to by OAuth2HandlerService, Authorization code flow; code exchanged server-side by ApplinX REST API, not directly by this SPA
- **Remote log endpoint (ngx-logger)**: Optional remote HTTP logging; custom Authorization header injected with Bearer token after session connect, Bearer token

**Data Stores**:
- **sessionStorage (gx_token)**: Browser sessionStorage, Read/write by StorageService, contains sensitive data
- **sessionStorage (userName)**: Browser sessionStorage, Written by webLogin on connect read by MacroComponent, contains sensitive data
- **sessionStorage (macroFileList)**: Browser sessionStorage, Written by MacroComponent after getMacro API call read during ngOnInit, no sensitive data
- **sessionStorage (idPcode)**: Browser sessionStorage, Written by OAuth2HandlerService with the OIDC authorization code, contains sensitive data
- **assets/config/sessionConfig.json**: Static JSON config file served with the SPA, Fetched via HTTP GET by ConfigurationService on startup, no sensitive data
- **assets/config/KeyboardMappings.json**: Static JSON config file served with the SPA, Fetched by KeyboardMappingService on session connect, no sensitive data

### Trust Boundaries

**Boundary 1: Browser ↔ ApplinX REST API**
- **Entry Points**: HTTP /api/* (proxied from Angular dev server), HTTP POST /session (connect), HTTP GET/POST /screen, HTTP GET /info, HTTP /macro/*
- **Controls**: Bearer token authentication (Authorization header), Angular HTTP interceptor not observed; token passed per-call, Same-origin in production; dev proxy with changeOrigin:true
- **Risk Level**: HIGH

**Boundary 2: ApplinX REST API ↔ Mainframe Host**
- **Entry Points**: ApplinX server-side host session (TCP to mainframe/AS400/UNIX)
- **Controls**: Not in scope for this SPA; ApplinX backend manages host connectivity
- **Risk Level**: MEDIUM

**Boundary 3: Browser DOM ↔ Angular Component Templates**
- **Entry Points**: Screen field content rendered from GetScreenResponse, Transformation labels/values rendered from server data, Error messages from HttpErrorResponse displayed in templates, field.style applied via bypassSecurityTrustStyle in InputFieldComponent
- **Controls**: Angular template sanitization (default), DomSanitizer used — bypassSecurityTrustStyle noted in InputFieldComponent
- **Risk Level**: HIGH

**Boundary 4: URL Query Parameters ↔ RouteGuardService**
- **Entry Points**: route.queryParams.code (OIDC authorization code from URL), state.url (current route URL)
- **Controls**: Code forwarded directly to ApplinX REST API; no local validation, URL compared against known route names only
- **Risk Level**: HIGH

**Boundary 5: KeyboardMappings.json / Server key mappings ↔ KeyboardMappingService**
- **Entry Points**: targetFunction string from JSON config or server, cancelMapFunction function reference
- **Controls**: Dynamic dispatch: jsFunc[methodName](param) — method name and param derived from targetFunction string, No allowlist of permitted method names
- **Risk Level**: HIGH

**Boundary 6: Macro data ↔ MacroComponent**
- **Entry Points**: Macro steps loaded from ApplinX server via viewMacro API, Password fields base64-decoded before play
- **Controls**: Base64 encoding used as obfuscation (not encryption) for passwords stored in macros, Macro name used directly as filename parameter in API calls
- **Risk Level**: MEDIUM

### Data Flow

**Input Sources**:
- Browser URL query parameters (OIDC code, route params)
- HTML form fields (username, password, newPassword in webLogin)
- Host terminal input fields (InputFieldComponent — character input mapped to ApplinX fields)
- Keyboard events (global keydown handlers in ScreenComponent and InputFieldComponent)
- sessionConfig.json (applicationName, connectionPool, sessionOptions GX_VAR* keys, autoLogin flag)
- KeyboardMappings.json (targetFunction strings, additionalKey, keyCode)
- ApplinX REST API responses (GetScreenResponse fields, transformations, host keys, screen names)
- ApplinX REST API error responses (HttpErrorResponse .error.message shown in UI)
- Macro JSON files stored on ApplinX server (steps, field names, values, sendKey)
- sessionStorage (gx_token, userName, macroFileList, idPcode)

**Processing Layers**:
1. RouteGuardService — OIDC code extraction and session connect
2. ConfigurationService — sessionConfig.json parsing, GX_VAR* session option filtering
3. WebLoginComponent — credential assembly, Basic auth header construction (btoa)
4. OAuth2HandlerService — OIDC code forwarding to ApplinX REST API
5. NavigationService — sendKeys request construction, screen polling, error dispatch
6. ScreenProcessorService — RBush field/transform collision processing using server-supplied coordinates
7. ScreenComponent — GetScreenResponse processing, transformation routing, generated-page routing, child window handling
8. KeyboardMappingService — key event → targetFunction lookup → dynamic JS dispatch
9. MacroComponent — macro step recording (base64 password encoding), playback (base64 decode), file save/delete
10. InputFieldComponent — client-side datatype filtering, bypassSecurityTrustStyle for field.style
11. TransformGeneratorComponent — rendering server-defined transformations

**Output Destinations**:
- ApplinX REST API (HTTP POST — session, sendKeys, macro save/play)
- Browser DOM (screen field content, transformation content, error messages from server)
- sessionStorage (gx_token, userName, idPcode, macroFileList)
- ngx-logger remote endpoint (log messages including server error text)
- window.location.href redirect (OIDC IDP redirect URI from server response)

**Sensitive Data Paths**:
- **Authentication credentials (username:password)**: WebLoginComponent form fields → btoa(unescape(encodeURIComponent(username+':'+password))) → Basic auth header → ApplinX REST API session connect request
- **Natural auth credentials**: WebLoginComponent form fields → Placed directly in CreateSessionRequest body (naturalUsername, naturalPassword, naturalNewPassword) → ApplinX REST API session connect request body (JSON)
- **Bearer session token**: ApplinX REST API session connect response → Stored in sessionStorage['gx_token'], prepended with 'Bearer ' for API calls and ngx-logger → All ApplinX REST API calls; ngx-logger remote endpoint
- **OIDC authorization code**: URL query parameter (code) → Stored in sessionStorage['idPcode']; forwarded to ApplinX REST API → ApplinX REST API session connect (OIDC code exchange)
- **Macro password fields**: Host password input fields during macro recording → window.btoa(value) encoding; decoded with window.atob() before playback → Macro JSON files stored on ApplinX server; played back to host
- **Username**: WebLoginComponent form → Lowercased, JSON.stringify'd, stored in sessionStorage['userName'] → MacroComponent uses userName as API parameter for macro CRUD operations

---

## STRIDE Threat Model

### Spoofing Threats

**TM-001: Session Token Theft via XSS leads to identity spoofing**
- **Description**: If an attacker injects script into the DOM (e.g., via server-controlled screen content not fully sanitized by Angular, or via bypassSecurityTrustStyle misuse), they can exfiltrate the Bearer token from sessionStorage and impersonate the authenticated user against the ApplinX REST API.
- **Attack Vector**: Network
- **Affected Components**: InputFieldComponent (bypassSecurityTrustStyle), ScreenComponent (server content rendering), StorageService (sessionStorage token)
- **Current Controls**: Angular default template sanitization, sessionStorage (vs localStorage — cleared on tab close)
- **Risk Level**: HIGH

**TM-002: OIDC Authorization Code Injection / Open Redirect**
- **Description**: The OIDC authorization code arrives via URL query parameter (route.queryParams.code). A crafted URL could supply a forged code or exploit the redirect logic in RouteGuardService to navigate to an attacker-controlled page via the redirectUri returned by the ApplinX REST API.
- **Attack Vector**: Network
- **Affected Components**: RouteGuardService, OAuth2HandlerService, NavigationService
- **Current Controls**: Code forwarded to ApplinX REST API for exchange; IDP validates code server-side
- **Risk Level**: HIGH

### Tampering Threats

**TM-003: Client-side keyboard mapping code injection via targetFunction**
- **Description**: KeyboardMappingService performs dynamic dispatch on the targetFunction string from KeyboardMappings.json or server key mappings: jsFunc[methodName](param). If an attacker can influence the JSON config or the server-supplied key mapping, they can invoke arbitrary methods on JSFunctionsService with attacker-controlled parameters.
- **Attack Vector**: Network
- **Affected Components**: KeyboardMappingService, JSFunctionsService, KeyboardMappings.json
- **Current Controls**: Method existence check (jsFunc[methodName] truthy guard), Config file served from same origin (production)
- **Risk Level**: HIGH

**TM-004: CSS injection via bypassSecurityTrustStyle on server-supplied field.style**
- **Description**: InputFieldComponent passes field.style (from server GetScreenResponse) directly to DomSanitizer.bypassSecurityTrustStyle(). This bypasses Angular's built-in style sanitization. A malicious or compromised ApplinX server could inject CSS expressions, url() with data: URIs, or CSS-based exfiltration payloads.
- **Attack Vector**: Network
- **Affected Components**: InputFieldComponent, ScreenComponent, ApplinX REST API response
- **Current Controls**: Requires compromised or malicious ApplinX server response
- **Risk Level**: MEDIUM

### Repudiation Threats

**TM-005: Log injection via server-supplied error messages**
- **Description**: ngx-logger logs server error messages (errorResponse.error.message) and screen names without sanitization. If log output is forwarded to a remote endpoint or log aggregation system, an attacker controlling the ApplinX server could inject log entries. MacroComponent also has unguarded console.log calls with user/server data.
- **Attack Vector**: Network
- **Affected Components**: NavigationService (errorHandler), WebLoginComponent (handleError), MacroComponent (console.log)
- **Current Controls**: No controls observed
- **Risk Level**: MEDIUM

### Information Disclosure Threats

**TM-006: Bearer token and credentials in sessionStorage — accessible to same-origin scripts**
- **Description**: The Bearer token (gx_token), OIDC code (idPcode), and username (userName) are all stored in sessionStorage. Any same-origin JavaScript (e.g., injected via XSS) can read sessionStorage in full.
- **Attack Vector**: Local
- **Affected Components**: StorageService, OAuth2HandlerService, WebLoginComponent
- **Current Controls**: sessionStorage cleared on tab/browser close, sessionStorage.clear() on StorageService construction
- **Risk Level**: HIGH

**TM-007: Macro password storage with base64 obfuscation only**
- **Description**: Password field values captured during macro recording are stored using window.btoa() (base64 encoding). This is not encryption. Macro JSON files stored on the ApplinX server contain recoverable plaintext passwords.
- **Attack Vector**: Network
- **Affected Components**: MacroComponent, SharedService (recordMacro), ApplinX macro storage
- **Current Controls**: Base64 encoding (obfuscation, not encryption), Password mask shown in UI during view
- **Risk Level**: HIGH

**TM-008: Server error messages exposed directly in UI and logs**
- **Description**: HttpErrorResponse .error.message is displayed directly in the UI (webLogin errorMessage binding) and logged. ApplinX server may include internal details (stack traces, host connection strings, usernames, session IDs) in error messages.
- **Attack Vector**: Network
- **Affected Components**: WebLoginComponent (handleError), NavigationService (errorHandler)
- **Current Controls**: No filtering of error message content observed
- **Risk Level**: MEDIUM

### Denial of Service Threats

**TM-009: Uncapped screen polling interval flooding ApplinX REST API**
- **Description**: NavigationService polls the ApplinX REST API every 5000ms without back-off on non-fatal errors. An error condition that does not set isThereError=true could cause continuous failed requests.
- **Attack Vector**: Local
- **Affected Components**: NavigationService (checkHostScreenUpdate)
- **Current Controls**: isThereError flag stops polling on specific disconnect messages, Only polls when isConnected()
- **Risk Level**: LOW

### Elevation of Privilege Threats

**TM-010: Auto-login bypasses authentication when auth is DISABLED**
- **Description**: When autoLoginIfDisabledAuth is true in sessionConfig.json and the ApplinX server reports auth=DISABLED, WebLoginComponent calls autoLogin() without any credentials. A supply-chain attack on sessionConfig.json could enable unauthenticated sessions.
- **Attack Vector**: Local
- **Affected Components**: WebLoginComponent (autoLogin), ConfigurationService, NavigationService
- **Current Controls**: Requires sessionConfig.json to have autoLoginIfDisabledAuth=true AND server to report auth=DISABLED
- **Risk Level**: MEDIUM

**TM-011: Route guard bypass — authenticated routes accessible without token if URL manipulation**
- **Description**: RouteGuardService checks isConnected() (sessionStorage presence check). An attacker with XSS access who sets sessionStorage['gx_token'] to any value could bypass the route guard. The guard also allows navigation to 'webLogin' with any idPcode present, potentially replaying OIDC codes.
- **Attack Vector**: Local
- **Affected Components**: RouteGuardService, StorageService (isConnected)
- **Current Controls**: Token validated server-side on each ApplinX REST API call
- **Risk Level**: MEDIUM

---

## Attack Surface Map

### External Attack Surface (Internet-Facing)

**Network Endpoints**:
- **/api/* (proxied to ApplinX REST API)**: HTTP/HTTPS, port 443, Bearer token in Authorization header, internet-facing (production)

**APIs**:
- **ApplinX REST API — Session /session**: REST/JSON, Basic auth or Natural credentials or OIDC code in body, no rate limiting
- **ApplinX REST API — Screen /screen**: REST/JSON, Bearer token, no rate limiting
- **ApplinX REST API — Macro /macro**: REST/JSON, Bearer token, no rate limiting
- **ApplinX REST API — Info /info**: REST/JSON, None (getInfo called pre-login to determine auth method), no rate limiting

**Web Interfaces**:
- **WebLoginComponent (/webLogin)**: Authentication entry point, None (public), FormGroup with FormControl; credentials passed to sessionService.connect(); username stored in sessionStorage
- **ScreenComponent (/instant, /:screenName)**: Host screen terminal emulation, Route guard — Bearer token required, Keyboard events, field changes, host-server-supplied content rendered via Angular templates

### Internal Attack Surface (Authenticated/Internal)

**Inter-Service Communication**:
- **Angular SPA → ApplinX REST API**: HTTP (dev proxy) / HTTPS (production), Bearer token per-request, encrypted

**File System Operations**:
- **Read (HTTP GET)**: assets/config/sessionConfig.json, assets/config/KeyboardMappings.json, Read-only static assets, No schema validation; ConfigurationService filters session options by GX_VAR* key prefix only

### Supply Chain Attack Surface

**Third-Party Dependencies**:
- **@ibm/applinx-rest-apis**: Medium — IBM first-party SDK but distributed via npm, Infrequent (pinned at 10.15.7), No CVEs found in public databases; deserializes server JSON without additional validation
- **jquery**: Medium — widely used but 3.6.0 is outdated, Pinned at 3.6.0, Known XSS issues in older versions; usage is minimal
- **ngx-logger**: Medium — community package, Pinned at 5.0.12, Ships auth token in remote log headers; log messages include user-visible error text

**Build Pipeline**:
- **IBM Continuous Delivery pipeline**: Full repo access, Pipeline handles secrets via IBM CD; detect-secrets step disabled (when: false), sign-artifact step disabled (when: false)
- **npm / Angular CLI 20.x**: Build-time dependency resolution, No secrets in package.json; lockfile integrity not verified in pipeline, No artifact signing observed in pipeline config

**Deployment Process**:
- **Static SPA build (ng build --configuration production) deployed as web assets**: CI/CD via IBM Continuous Delivery pipeline, Bearer token generated at runtime; no static secrets in build output, no rollback

---

## Risk Assessment

### HIGH Priority Areas (Immediate Attention Required)

**KeyboardMappingService — dynamic JS dispatch**:
- **Risk**: targetFunction string from JSON config or server dispatched via jsFunc[methodName](param) with no method allowlist
- **Impact**: Arbitrary method invocation on JSFunctionsService; if custom user-exit code is injected, potential for arbitrary action execution
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-003
- **Recommended Action**: Audit dynamic dispatch path; enforce allowlist of permitted method names; validate param before dispatch

**InputFieldComponent — bypassSecurityTrustStyle**:
- **Risk**: Server-supplied field.style value bypasses Angular CSS sanitization
- **Impact**: CSS injection from compromised or malicious ApplinX server response
- **Likelihood**: LOW
- **Threat Model Ref**: TM-004
- **Recommended Action**: Validate or sanitize field.style server-side; consider scoped CSS approach instead of trustedStyle

**MacroComponent — password base64 storage**:
- **Risk**: Passwords stored in macro JSON files with base64 encoding only
- **Impact**: Recovery of plaintext credentials from macro files stored on server
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-007
- **Recommended Action**: Use server-side encryption for macro password fields; do not transmit or store decoded passwords client-side

**StorageService — Bearer token in sessionStorage**:
- **Risk**: Token accessible to any same-origin script; XSS leads to full session compromise
- **Impact**: Full host session hijacking
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-006
- **Recommended Action**: Review all server-content rendering paths for XSS; audit bypassSecurityTrustStyle usage; consider httpOnly cookie-based token (requires backend change)

**RouteGuardService — OIDC code handling**:
- **Risk**: OIDC authorization code extracted from URL and forwarded without state parameter validation
- **Impact**: CSRF-based session creation; open redirect via server-supplied redirectUri
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-002
- **Recommended Action**: Implement and validate OAuth2 state parameter; validate redirectUri against allowlist before window.location.href assignment

### MEDIUM Priority Areas (Defense-in-Depth Opportunities)

**WebLoginComponent — error message display**:
- **Opportunity**: Sanitize HttpErrorResponse.error.message before display
- **Benefit**: Prevents potential HTML injection in error messages from server
- **Threat Model Ref**: TM-008

**ConfigurationService — sessionConfig.json**:
- **Opportunity**: Add schema validation for sessionConfig.json contents; validate GX_VAR* session options values
- **Benefit**: Prevents unexpected configuration injection via tampered config files
- **Threat Model Ref**: TM-010

**ngx-logger — remote log endpoint**:
- **Opportunity**: Sanitize log message content; avoid logging raw server error messages
- **Benefit**: Prevents log injection attacks propagating to log aggregation systems
- **Threat Model Ref**: TM-005

**npm dependency pinning and artifact integrity**:
- **Opportunity**: Enable npm audit in CI; add lockfile integrity checks; re-enable sign-artifact step
- **Benefit**: Supply chain risk reduction
- **Threat Model Ref**: TM-003

### LOW Priority Areas (Best Practice Improvements)

**NavigationService — screen polling**:
- **Improvement**: Add exponential back-off and jitter to screen polling on non-disconnect errors
- **Benefit**: Reduces load on ApplinX server in degraded network conditions

**jQuery 3.6.0**:
- **Improvement**: Update to latest 3.7.x or remove jQuery dependency entirely (usage is minimal)
- **Benefit**: Eliminates known CVEs in older jQuery versions

**rxjs-compat 6.6.7**:
- **Improvement**: Remove rxjs-compat; migrate any remaining Observable patterns to rxjs 7
- **Benefit**: Reduces attack surface of legacy compatibility shim

---

## Scan Recommendations

### Recommended Tools by Component

**TypeScript / Angular**:
- **SAST**: Semgrep (typescript rules + angular rules), ESLint with @typescript-eslint/no-unsafe-* rules, CodeQL (TypeScript), tslint.json (existing, review rules)
- **Dependency Scanning**: npm audit, Snyk OSS, OWASP Dependency-Check

### Scan Prioritization

1. **HIGH**: XSS / DOM injection (bypassSecurityTrust* usage), Dynamic code dispatch in KeyboardMappingService, OIDC flow / open redirect in RouteGuardService and OAuth2HandlerService, Credential and token storage (sessionStorage, base64 macro passwords)
2. **MEDIUM**: Dependency vulnerability scan (npm audit, Snyk), Error message information disclosure, Session config trust boundary validation, Log injection via ngx-logger
3. **LOW**: Screen polling DoS resilience, jQuery version update, rxjs-compat removal

---

## Notes & Observations

This is an Angular 20 SPA acting as a browser-based terminal emulator for IBM webMethods ApplinX. The codebase does not contain server-side code; all security concerns are client-side (XSS, token storage, dynamic dispatch) and trust-boundary concerns (server-supplied content rendered directly). The most significant risk areas are: (1) bypassSecurityTrustStyle in InputFieldComponent, (2) dynamic JS dispatch in KeyboardMappingService, (3) base64-only macro password storage, and (4) OIDC redirect handling. The CI/CD pipeline has detect-secrets and sign-artifact disabled, which is a supply-chain concern. No raw socket or SDK-mediated interfaces are present in this SPA codebase.

---

**Profile Version**: 1.0
**Last Updated**: 2026-07-31T10:57:00Z
**Next Review**: [Recommended review date]
