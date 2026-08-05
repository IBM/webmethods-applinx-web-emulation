# Project Security Profile

**Assessment ID**: 2026-08-02-20-57
**Generated**: 2026-08-02T20:57:00Z
**Analyst**: D4rthB0b-Recon
**Location**: `assessments/2026-08-02-20-57/project-profile.md`

---

## Project Overview

**Project Name**: webmethods-applinx-web-emulation
**Project Type**: Web App
**Primary Purpose**: Angular single-page application that provides browser-based web emulation of IBM ApplinX mainframe/AS400 terminal sessions via the ApplinX REST API backend. Delivers a modern HTML5 UI over legacy 3270/5250 host screens with OIDC/Basic/Natural/LDAP/Disabled authentication modes, macro recording/playback, screen transformations (tables, calendars, menus), and a JavaScript user-exits extensibility model.
**Repository**: https://github.com/IBM/webmethods-applinx-web-emulation

---

## Technology Stack

### Languages & Frameworks

| Language | Percentage | Primary Frameworks | Version |
|----------|-----------|-------------------|---------|
| TypeScript | 92% | Angular, RxJS | 20.3.25, 7.5.2 |
| SCSS/CSS | 5% | Bootstrap, @carbon/styles | 5.1.3, ^1.97.0 |
| HTML | 3% | N/A | N/A |

### Runtime Environments
- **Primary**: Browser (Angular SPA) + Node.js build toolchain
- **Secondary**: Angular CLI 20.3.25, Karma/Jasmine (test), Cypress (e2e)

### Dependencies

**Package Managers Detected**:
- npm

**Critical Dependencies**:
| Package | Version | Purpose | Security Notes |
|---------|---------|---------|----------------|
| @ibm/applinx-rest-apis | 10.15.7 | ApplinX REST API SDK — SessionService, ScreenService, MacroService, InfoService | All server responses (field content, style strings, transformation coordinates, keyboard mappings, redirect URIs) arrive through this SDK. Untrusted server-controlled data enters the DOM via Angular bindings and custom CSS parsing here. |
| @angular/core | 20.3.25 | Angular framework — DI, change detection, component lifecycle | Angular's DomSanitizer and template binding provide default XSS protections; however, bypasses via [style] bindings with server-supplied CSS strings and innerHTML are present in screen-rendering components. |
| ngx-logger | 5.0.12 | Client-side and server-side logging | Server logging endpoint is configurable; AuthTokenServerService strips bearer tokens from log requests. |
| jquery | 3.6.0 | DOM access in webLogin component (#connect prop query) | Outdated jQuery version; limited use but present in login flow. |
| rbush | 3.0.1 | R-tree spatial index for screen field/transformation collision detection | Screen-processor feeds server-supplied rectangle coordinates into rbush — coordinate overflow/underflow could bypass collision filtering. |
| carbon-components-angular | ^5.57.7 | IBM Carbon Design System UI components | Modal/toast content interpolated from server/app messages. |

**Outdated/Vulnerable Dependencies** (High-Level):
- jquery: 3.6.0 → 3.7.x (MEDIUM vulnerabilities)
- rxjs-compat: 6.6.7 → deprecated (LOW vulnerabilities)

---

## Architecture Analysis

### Architecture Pattern
- **Pattern**: Monolith
- **Evidence**: Single Angular SPA with all components, services, and routing in one codebase. Communicates with a single external ApplinX REST API backend via Angular HttpClient. No microservice decomposition, no serverless functions, no message queues.

### Components

**Entry Points**:
- Browser URL — Angular Router (webLogin, instant, screen/:name routes)
- OIDC callback URL with query params ?code=...&state=... handled by RouteGuardService.canActivate()
- sessionConfig.json loaded via HttpClient at startup — user-modifiable configuration file
- KeyboardMappings.json — user-modifiable keyboard mapping configuration
- JSfunctions/scripts.ts — customer-extensible JavaScript function injection point
- User-exit IUserExits implementations — AbstractUserExits/LifecycleUserExits

**Core Modules**:
- **WebLoginComponent**: Handles Basic/LDAP/Natural/OIDC/Disabled auth flows; constructs Basic auth header via btoa(); triggers OIDC redirect
- **OAuth2HandlerService**: OIDC authorization code flow: generates state nonce, validates redirect URI scheme, exchanges code for session token via ApplinX REST
- **RouteGuardService**: Angular CanActivate guard; validates OIDC state parameter on callback; enforces authentication gate on all routes
- **StorageService**: Session token management via sessionStorage (gx_token, userName, macroFileList); clears storage on init and logout
- **ConfigurationService**: Loads sessionConfig.json; validates applicationName/connectionPool against allowlist regex; exposes sessionOptions (GX_VAR* keys only)
- **NavigationService**: Sends keystrokes to ApplinX REST; polls host screen updates every 5 s; error handling; cursor/field state management
- **ScreenProcessorService**: Processes server-supplied screen transformations and field regions using rbush spatial index; performs field splitting/cutting with server-supplied coordinates
- **KeyboardMappingService**: Maps keyboard events to ApplinX host keys or custom JS functions; dispatches via own-property guard; validates sendKey against host-key allowlist
- **MacroComponent**: Macro record/view/play/delete/rename via MacroService SDK; stores password fields as mask placeholder; username read from sessionStorage
- **SharedService**: Cross-component state (macro recording, password scrubbing); scopes password DOM queries to app-root
- **FieldComponent / InputFieldComponent**: Render server-supplied screen fields; parse server-supplied field.style strings through CSS allowlist filter
- **GXGeneratedPage**: Base class for generated screen pages; registers user-exit listeners without clearing existing ones
- **UserExitsEventThrowerService**: Dispatches lifecycle events to all registered IUserExits implementations
- **AuthTokenServerService**: NGXLogger server service override; strips bearer token from remote log requests

**External Integrations**:
- **ApplinX REST API backend**: Provides session management, screen data, keyboard mappings, macro storage, and OIDC redirect URIs, Bearer token / Basic / Natural / OIDC
- **OIDC Identity Provider (IdP)**: External OpenID Connect provider; user redirected to IdP for login, OIDC authorization code flow with state parameter CSRF protection
- **NGX Logger remote endpoint**: Optional server-side log sink, None enforced at client — bearer token explicitly excluded

**Data Stores**:
- **sessionStorage**: Browser storage, read/write by StorageService/RouteGuardService/MacroComponent/WebLoginComponent, contains sensitive data
- **ApplinX REST API (server-side)**: Remote REST backend, HTTP REST via SDK, contains sensitive data

### Trust Boundaries

**Boundary 1: Browser ↔ ApplinX REST API**
- **Entry Points**: ApplinX SDK service calls (SessionService, ScreenService, MacroService, InfoService), Response fields: token, screen data, fields, transformations, hostKeys, keyboardMapping, redirectUri, auth method
- **Controls**: Bearer token on authenticated requests, Angular HttpClient, OIDC state parameter validation, Redirect URI https: scheme check, CSS property allowlist for field.style, applicationName/connectionPool allowlist
- **Risk Level**: HIGH

**Boundary 2: Browser ↔ OIDC Identity Provider**
- **Entry Points**: window.location.href redirect to IdP URL (server-supplied), OIDC callback URL: ?code=...&state=... query parameters
- **Controls**: OIDC state nonce generated with crypto.randomUUID(), State stored in sessionStorage compared on callback, Redirect URI scheme-validated before navigation
- **Risk Level**: HIGH

**Boundary 3: User ↔ Angular SPA (browser)**
- **Entry Points**: Login form (username, password, newPassword), Keyboard events, Input fields from host screen, sessionConfig.json, KeyboardMappings.json
- **Controls**: Angular template binding (default XSS protection), Input datatype validation on host screen fields, Form reset after connect, Screen locker
- **Risk Level**: MEDIUM

**Boundary 4: Customer JS extensions (user-exits / scripts.ts / JSFunctions)**
- **Entry Points**: IUserExits implementations, Custom functions in JSfunctions/scripts.ts, Server-supplied function names dispatched via own-property guard
- **Controls**: Object.prototype.hasOwnProperty.call() guard, Host-key allowlist regex for string sendKey, No eval() or Function() in framework code
- **Risk Level**: MEDIUM

**Boundary 5: CI/CD Pipeline**
- **Entry Points**: .pipeline-config.yaml, npm dependency resolution at build time
- **Controls**: detect-secrets step, sign-artifact step, npm ci, npm audit --audit-level=moderate, image_pull_policy Always
- **Risk Level**: MEDIUM

### Data Flow

**Input Sources**:
- Browser URL query parameters (?code, ?state from OIDC IdP callback)
- Login form fields (username, password, newPassword)
- sessionConfig.json (applicationName, connectionPool, autoLogin, logger, sessionOptions)
- KeyboardMappings.json (keyCode, additionalKey, targetFunction mappings)
- ApplinX REST API responses: session token, screen fields, field.style, field.content, transformations, hostKeys, keyboardMapping, redirectUri, auth method
- Keyboard events (all key presses)
- Host screen input fields (user-typed content sent back to host)
- MacroService API responses (macro file list, macro steps with field values)
- sessionStorage (gx_token, userName, oidc_state, macroFileList)

**Processing Layers**:
1. ConfigurationService — validates and parses sessionConfig.json; allowlist-filters applicationName/connectionPool
2. RouteGuardService — validates OIDC state on callback; enforces authentication gate on all routes
3. OAuth2HandlerService — scheme-validates redirectUri from server before navigation
4. NavigationService — assembles SendKeysRequest with cursor, fields, screen ID; polls screen updates
5. ScreenProcessorService — processes server-supplied transformation coordinates via rbush; splits/cuts fields using server-supplied rect bounds
6. KeyboardMappingService — resolves key events to host keys or JS functions; own-property guards dispatch; allowlist-validates sendKey strings
7. SharedService — scrubs password fields to mask placeholder before macro recording
8. FieldComponent/InputFieldComponent — parses server-supplied field.style through CSS allowlist; renders content via Angular bindings
9. MacroComponent — reads/writes macros via MacroService SDK; retrieves username from sessionStorage

**Output Destinations**:
- ApplinX REST API — session create/disconnect, send keys, get screen, macro CRUD
- OIDC IdP — browser redirect for authentication
- DOM — rendered terminal screen (fields, transformations, styling)
- sessionStorage — gx_token, userName, oidc_state, macroFileList
- NGX Logger remote endpoint — debug/error logs
- Browser console — debug output (console.log calls remain in macro component)

**Sensitive Data Paths**:
- **Bearer session token (gx_token)**: ApplinX REST API → sessionStorage via StorageService.setConnected() → Authorization: Bearer header on all REST calls
- **Username**: Login form → JSON.stringify → sessionStorage → MacroService API calls (user parameter)
- **Basic auth credential**: Login form → btoa(username:password) in WebLoginComponent → ApplinX REST API Authorization: Basic header (never stored)
- **Natural credentials**: Login form → CreateSessionRequest body → ApplinX REST API request body
- **Host screen field content**: ApplinX REST API → ScreenProcessorService → FieldComponent/InputFieldComponent with CSS allowlist → DOM
- **OIDC authorization code**: IdP callback URL → RouteGuardService → OAuth2HandlerService → ApplinX REST session connect (NOT stored in sessionStorage)

---

## STRIDE Threat Model

### Spoofing Threats

**TM-001: OIDC State Parameter Bypass / CSRF Code Injection**
- **Description**: An attacker may inject a crafted OIDC authorization code without a valid matching state nonce, tricking the application into exchanging the attacker's code and establishing a session under attacker control.
- **Attack Vector**: Network
- **Affected Components**: RouteGuardService, OAuth2HandlerService, sessionStorage
- **Current Controls**: crypto.randomUUID() nonce generated before redirect, State stored in sessionStorage and consumed single-use, State mismatch logs error and redirects to webLogin
- **Risk Level**: HIGH

**TM-002: Open Redirect via Server-Supplied redirectUri**
- **Description**: The ApplinX REST API returns a redirectUri used for the OIDC IdP redirect. If attacker-controlled, the browser could be redirected to a malicious IdP.
- **Attack Vector**: Network
- **Affected Components**: OAuth2HandlerService, ApplinX REST API
- **Current Controls**: URL parsed with new URL(); non-https: scheme throws and aborts redirect, Error logged; oidc_state cleaned up
- **Risk Level**: HIGH

### Tampering Threats

**TM-003: CSS Injection via Server-Supplied field.style**
- **Description**: ApplinX REST API responses include a field.style string applied to DOM elements. Without filtering, a compromised backend could inject CSS properties that exfiltrate data or cause UI redressing.
- **Attack Vector**: Network
- **Affected Components**: FieldComponent, InputFieldComponent, ApplinX REST API
- **Current Controls**: ALLOWED_CSS_PROPS allowlist (enumerated safe properties only), Regex blocks url(), expression(), javascript: in values
- **Risk Level**: HIGH

**TM-004: Prototype Pollution / Code Injection via Server-Supplied Keyboard Mapping targetFunction**
- **Description**: ApplinX server supplies keyboard mappings including targetFunction strings. If the dispatch mechanism traverses the prototype chain, an attacker-controlled targetFunction could invoke Object.prototype methods or inject code.
- **Attack Vector**: Network
- **Affected Components**: KeyboardMappingService, JSFunctionsService, ApplinX REST API
- **Current Controls**: Object.prototype.hasOwnProperty.call() guard before method dispatch, Host-key allowlist regex for string sendKey values
- **Risk Level**: HIGH

**TM-005: Server-Supplied Coordinate Overflow in Screen Processor**
- **Description**: ScreenProcessorService uses server-supplied rect.minX/maxX coordinates to split and cut screen fields. Out-of-range coordinates could produce incorrect field rendering.
- **Attack Vector**: Network
- **Affected Components**: ScreenProcessorService, ApplinX REST API
- **Current Controls**: Math.max/Math.min clamping applied in splitField() and cutField(), JavaScript substring() is bounds-safe
- **Risk Level**: MEDIUM

### Repudiation Threats

**TM-008: Macro Step Recording Without Audit Trail**
- **Description**: Macro steps record keystrokes and field values sent to the host. Password fields are masked but other sensitive field values could be recorded without audit controls.
- **Attack Vector**: Local
- **Affected Components**: MacroComponent, SharedService, MacroService SDK
- **Current Controls**: Password fields replaced with GXUtils.pwdMask placeholder, Macros scoped to user + applicationName
- **Risk Level**: MEDIUM

### Information Disclosure Threats

**TM-006: Session Token Exposure via Logs or User Exits**
- **Description**: The Bearer session token could leak through remote log requests, user-exit implementations, console.log statements, or error messages.
- **Attack Vector**: Local
- **Affected Components**: AuthTokenServerService, StorageService, NavigationService, MacroComponent
- **Current Controls**: AuthTokenServerService.alterHttpRequest() strips bearer token from log requests, firePreConnect() does not pass authHeader to user exits
- **Risk Level**: MEDIUM

**TM-007: Username / Session Artifact Persistence in sessionStorage**
- **Description**: Username, session token, OIDC state nonce, and macro file list persist in sessionStorage and are accessible to any XSS executing in the origin.
- **Attack Vector**: Local
- **Affected Components**: StorageService, MacroComponent, RouteGuardService
- **Current Controls**: sessionStorage.clear() on construction, setNotConnected() removes gx_token/idPcode/userName, oidc_state consumed single-use
- **Risk Level**: MEDIUM

**TM-012: Error Message Disclosure to Browser Console / DOM**
- **Description**: WebLoginComponent.handleError() calls console.error(msg) with raw server error messages. MacroComponent has multiple console.log() debug statements.
- **Attack Vector**: Local
- **Affected Components**: WebLoginComponent, NavigationService, MacroComponent
- **Current Controls**: NGXLogger used for most logging with configurable levels
- **Risk Level**: LOW

### Denial of Service Threats

**TM-009: Screen Update Polling Loop Resource Exhaustion**
- **Description**: NavigationService polls ApplinX REST API every 5 seconds. If error handler fails to stop polling, it floods the backend.
- **Attack Vector**: Network
- **Affected Components**: NavigationService
- **Current Controls**: isThereError flag stops polling, try/catch sets isThereError=true on unexpected exceptions, clearInterval() on repeated invocations
- **Risk Level**: LOW

### Elevation of Privilege Threats

**TM-010: User-Exit Listener Poisoning via clearEventListeners()**
- **Description**: Previously, GXGeneratedPage.addUserExits() called clearEventListeners() before registering new listeners, destroying all globally-registered security and audit hooks.
- **Attack Vector**: Local
- **Affected Components**: GXGeneratedPage, UserExitsEventThrowerService
- **Current Controls**: clearEventListeners() call removed — addEventListener() is now append-only
- **Risk Level**: LOW

**TM-011: Macro Name / File Path Injection**
- **Description**: Macro names entered by users are passed to MacroService API calls with .json appended. Client-side regex validation noted in GXUtils but enforcement in form template not confirmed.
- **Attack Vector**: Network
- **Affected Components**: MacroComponent, MacroService SDK, ApplinX REST API
- **Current Controls**: GXUtils.MACRO_NAME_PATTERN_MSG describes allowed pattern, Duplicate check performed before save
- **Risk Level**: MEDIUM

---

## Attack Surface Map

### External Attack Surface (Internet-Facing)

**Network Endpoints**:
- **/api (proxied to ApplinX REST backend)**: HTTP/HTTPS, port 2380, Bearer token / Basic auth / OIDC, internet-facing

**APIs**:
- **ApplinX REST API (via @ibm/applinx-rest-apis SDK)**: REST/JSON, Bearer token / Basic auth / Natural credentials / OIDC code, no rate limiting

**Web Interfaces**:
- **Angular SPA — /webLogin**: Authentication entry point; collects username/password for Basic/LDAP/Natural; triggers OIDC redirect, Pre-auth no session required, Reactive Forms; Basic auth constructed via btoa()
- **Angular SPA — /instant and screen routes**: Terminal emulation; displays and interacts with host screens, Route guard requires valid gx_token, Keyboard events, field value changes; server-supplied field.style parsed through CSS allowlist
- **OIDC Callback — /instant?code=...&state=...**: Receives OIDC authorization code and state from IdP, State nonce validated against sessionStorage, URL query parameters code and state

### Internal Attack Surface (Authenticated/Internal)

**Inter-Service Communication**:
- **Angular SPA → ApplinX REST API**: HTTP REST (proxied via /api in dev; direct in prod), Bearer token or Basic auth header, encrypted

**File System Operations**:
- **Read**: assets/config/sessionConfig.json, assets/config/KeyboardMappings.json, public read (served as static assets), sessionConfig.json applicationName/connectionPool allowlist-validated

### Supply Chain Attack Surface

**Third-Party Dependencies**:
- **npm registry (all dependencies)**: Medium trust — open-source, IBM-published; infrequent updates with lockfile; jquery 3.6.0 has known CVEs; rxjs-compat deprecated; lodash-es overridden

**Build Pipeline**:
- **IBM Continuous Delivery Pipeline**: CI/CD access; detect-secrets and sign-artifact re-enabled; artifact integrity via signing

**Deployment Process**:
- **npm ci + Angular production build**: Automated via pipeline, no hardcoded credentials, no documented rollback mechanism

---

## Risk Assessment

### HIGH Priority Areas (Immediate Attention Required)

**OIDC Auth Flow (RouteGuardService / OAuth2HandlerService)**:
- **Risk**: OIDC state validation and redirect URI handling — partial fixes present but requires deep code review for edge cases
- **Impact**: Account takeover, session hijacking, credential phishing via open redirect
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-001, TM-002
- **Recommended Action**: Scan all OIDC flow paths: state generation timing, state storage/retrieval race, redirectUri URL parsing edge cases, code-to-token exchange error paths

**Field CSS Injection (FieldComponent / InputFieldComponent)**:
- **Risk**: Server-supplied field.style CSS parsed with allowlist — correctness and bypass vectors need validation
- **Impact**: UI redressing, data exfiltration via CSS side-channel, DOM-based XSS
- **Likelihood**: MEDIUM
- **Threat Model Ref**: TM-003
- **Recommended Action**: Scan CSS allowlist implementation for bypass patterns (encoded values, multi-line declarations, vendor-prefixed properties, expression() variants)

**Keyboard Mapping Dispatch (KeyboardMappingService)**:
- **Risk**: Server-supplied targetFunction strings dispatched to JS functions — prototype chain guard and sendKey allowlist need verification
- **Impact**: Arbitrary function invocation, host key injection
- **Likelihood**: LOW
- **Threat Model Ref**: TM-004
- **Recommended Action**: Scan dispatch logic, allowlist regex completeness, parameter extraction, sendKey validation edge cases

**Dependency Supply Chain**:
- **Risk**: jquery 3.6.0 with known CVEs; rxjs-compat deprecated; broad npm dependency tree
- **Impact**: Known CVE exploitation in browser context; supply chain compromise
- **Likelihood**: HIGH
- **Threat Model Ref**: TM-004
- **Recommended Action**: Run npm audit; update jquery; assess full dependency tree for HIGH/CRITICAL CVEs

### MEDIUM Priority Areas (Defense-in-Depth Opportunities)

**MacroComponent — macro name validation and file path handling**:
- **Opportunity**: Client-side macro name pattern described but enforcement in form template not confirmed; macro name passed to server API
- **Benefit**: Prevent macro name path traversal / injection at server level
- **Threat Model Ref**: TM-011

**sessionStorage token and username lifecycle**:
- **Opportunity**: gx_token, userName, macroFileList persist in sessionStorage accessible to any same-origin XSS
- **Benefit**: Reduce token exposure window; ensure consistent cleanup on all logout/timeout paths
- **Threat Model Ref**: TM-007

**Console.log() debug output in MacroComponent**:
- **Opportunity**: MacroComponent contains multiple console.log() statements including macro names and user data
- **Benefit**: Prevent sensitive data leakage in browser console
- **Threat Model Ref**: TM-006, TM-012

**ScreenProcessorService — server-supplied coordinate handling**:
- **Opportunity**: Coordinate clamping added but server-supplied rect values fully trusted; negative/zero coordinates not validated
- **Benefit**: Prevent screen-rendering bypass or information disclosure via malicious transformation coordinates
- **Threat Model Ref**: TM-005

### LOW Priority Areas (Best Practice Improvements)

**NavigationService polling loop**:
- **Improvement**: Verify polling stop mechanism on all disconnect paths including tab close/beforeunload
- **Benefit**: Prevent residual resource consumption and API flooding after session end

**Error message disclosure**:
- **Improvement**: Audit all console.error/console.log calls for server error message passthrough to DOM or console
- **Benefit**: Reduce information disclosure to attackers with browser devtools access

**CI/CD pipeline hardening**:
- **Improvement**: Confirm detect-secrets baseline is up to date; audit static-scan image version pinning
- **Benefit**: Prevent credential commits; ensure reproducible secure builds

---

## Scan Recommendations

### Recommended Tools by Component

**TypeScript / Angular**:
- **SAST**: Semgrep (typescript, angular rulesets), ESLint with @typescript-eslint/no-unsafe-* rules, CodeQL (JavaScript/TypeScript)
- **Dependency Scanning**: npm audit, Snyk, OWASP Dependency-Check

**CI/CD pipeline (YAML)**:
- **SAST**: Semgrep (yaml ruleset), detect-secrets
- **Container Scanning**: Trivy (for pipeline container images)
- **Platform-Specific**: IBM Continuous Delivery pipeline hardening review

### Scan Prioritization

1. **HIGH**: OIDC auth flow and session token handling, Server-supplied CSS injection surface (field.style), Keyboard mapping dispatch and sendKey validation, npm dependency CVE audit
2. **MEDIUM**: Macro name validation and sessionStorage lifecycle, Screen processor coordinate handling, Error message / logging disclosure, Angular template binding XSS surface
3. **LOW**: Polling loop resource management, CI/CD pipeline configuration review, Dead code and debug output cleanup

---

## Notes & Observations

This project contains inline VULN-XXX comments referencing prior security fixes (VULN-002 through VULN-023). These comments indicate the codebase has undergone a previous security review and remediation pass. Scanner tasks should verify the correctness and completeness of each fix, not just flag the patterns as new findings. The @ibm/applinx-rest-apis SDK (v10.15.7) is a closed-source IBM package — its internal implementation cannot be directly reviewed; attack surface from its response parsing must be inferred from how the Angular app consumes its outputs.

---

**Profile Version**: 1.0
**Last Updated**: 2026-08-02T20:57:00Z
**Next Review**: After scanning phase completes
