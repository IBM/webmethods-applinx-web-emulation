# VULN-011-I: Investigation Report - error-message-info-disclosure

**Phase**: Inquisitor
**Vulnerability ID**: VULN-011
**Descriptor**: error-message-info-disclosure
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: MEDIUM

---

## Root Cause Analysis

`WebLoginComponent.handleError()` logs raw ApplinX REST API error messages (`errorResponse.error.message`) via `console.error()` and binds them to the DOM. ApplinX error messages include system-level details (internal connection strings visible in `NavigationService` patterns: `'Not connected to Server (Software caused connection abort: recv failed)'`). No `environment.production` guard, no error message sanitization or mapping to user-friendly strings. `MacroComponent` has 4 additional unconditional `console.log()` calls logging API responses. The DOM binding uses Angular `{{ }}` interpolation (XSS-safe HTML encoding) — the risk is information disclosure only, not XSS.

---

## Attack Scenario

Attacker establishes XSS (via VULN-004 or supply chain VULN-005). XSS code reads browser console history, collecting server error messages that include internal IPs, stack traces, and connection details. Attacker builds a network topology map from harvested error messages. In a simpler scenario: user opens browser DevTools and sees full ApplinX server error messages including internal paths and connection abort details — relevant for insider threat scenarios.

---

## Prerequisites

- For reconnaissance: authenticated user session, browser DevTools access
- For post-XSS amplification: prior XSS exploitation (VULN-004 or other)
- ApplinX REST API must return error messages containing internal details

---

## Privilege Boundary Analysis

**Starting Privilege**: Authenticated user (login page or post-auth)
**Achieved Privilege**: Server topology information (internal IPs, connection strings, error patterns)
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: NONE
**Availability**: NONE

### Impact Description

Server internal details (connection strings, IPs, paths) exposed to browser console accessible to users and XSS code. The `{{ errorMessage }}` DOM binding is XSS-safe (Angular entity-encoding) — only information disclosure risk. Post-XSS amplification: harvested server details enable targeted reconnaissance for subsequent attacks.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `HttpErrorResponse.error.message` (may contain internal server details)

**Transformations**:
- `WebLoginComponent.handleError()`: `const msg = errorResponse.error.message || errorResponse.message`
- No sanitization or mapping to generic messages
- `this.errorMessage = msg` (DOM binding — HTML encoded by Angular `{{ }}`, XSS-safe)
- `console.error(msg)` (no sanitization — raw error to browser console)

**Sinks**:
- Browser console (`console.error`) — accessible to DevTools and XSS
- DOM `{{ errorMessage }}` binding — HTML encoded, info disclosure only
- `MacroComponent` `console.log()` calls (lines 231, 235, 239, 272) — API responses

---

## Affected Components

### Direct Impact

- **WebLoginComponent.handleError()**: Raw server error messages logged to console and bound to DOM
- **MacroComponent (lines 231, 235, 239, 272)**: Macro names and API responses logged to browser console

### Indirect Impact

- **AbstractUserExits error handlers**: Full `HttpErrorResponse` objects logged via NGXLogger (remote endpoint security depends on configuration)

---

## Remediation Guidance

### Recommended Fix

Map ApplinX error messages to generic user-friendly strings in `handleError()` — do not expose raw server error details. Remove or gate all `console.error()` and `console.log()` debug calls behind `!environment.production` flag. For the DOM error message, the current `{{ errorMessage }}` binding is XSS-safe but should show generic text (`'Connection error — please try again'`) rather than server details.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Map raw server errors to generic user-friendly messages in `handleError()`
2. Remove or gate all `console.log/error` calls behind `if (!environment.production)` check
3. Add Angular build optimization for production: `terserOptions.compress.drop_console = true`
4. Verify NGX Logger `serverLogLevel` is `ERROR` (current) and not configurable to `TRACE` via `sessionConfig.json`

---

## References

**Scan Finding**: [VULN-011-S-scan-finding.md](VULN-011-S-scan-finding.md)

**Threat Model References**:
- TM-006
- TM-012

**Attack Surface References**:
- AS-008

**External References**:
- CWE-209: Generation of Error Message Containing Sensitive Information
- OWASP Testing Guide: Information Leakage via Error Messages

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
