# VULN-007-I: Investigation Report - open-redirect-server-controlled-redirect-uri

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-007  
**Descriptor**: open-redirect-server-controlled-redirect-uri  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: LOW

---

## Root Cause Analysis

[`OAuth2HandlerService.redirectToIDPLoginPage()`](src/app/services/oauth2-handler.service.ts:43) assigns `window.location.href = res.redirectUri` directly from the ApplinX REST API `CreateSessionResponse` without any URL validation. No scheme check, no domain allowlist, and no URL parsing. The application fully trusts the server-supplied redirect URL.

---

## Attack Scenario

Compromised ApplinX server returns `CreateSessionResponse` with `redirectUri = 'https://attacker.com/fake-idp-login'`. User initiates OIDC authentication — browser navigates to attacker URL. Phishing page mimics the real IdP login, capturing the user's IdP credentials. Requires ApplinX backend to be compromised — second-order attack.

---

## Prerequisites

- ApplinX REST API server must be compromised or misconfigured to return malicious `redirectUri`
- User must be using OIDC authentication mode
- User must click Connect to trigger the redirect

---

## Privilege Boundary Analysis

**Starting Privilege**: Unauthenticated user initiating OIDC login
**Achieved Privilege**: User redirected to attacker-controlled URL — phishing attack vector
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW  
**Integrity**: LOW  
**Availability**: NONE

### Impact Description

Open redirect enables phishing of IdP credentials if ApplinX server is compromised. User navigates away from legitimate application — phishing site can capture IdP credentials. This is a server-compromise-dependent secondary attack.

---

## Data Flow Analysis

**Sources**:
- ApplinX REST API `SessionService.connect()` response — `CreateSessionResponse.redirectUri`

**Transformations**:
- `res.redirectUri` extracted without validation
- `window.location.href = res.redirectUri` — immediate navigation

**Sinks**:
- `window.location.href` — browser navigation to attacker-controlled URL

---

## Affected Components

### Direct Impact

- **[`OAuth2HandlerService.redirectToIDPLoginPage()`](src/app/services/oauth2-handler.service.ts:43)**: Open redirect sink

### Indirect Impact

- **VULN-003 (missing OIDC state parameter)**: Combined — CSRF enables code injection; open redirect enables credential phishing

---

## Classification Refinement

### Refined Classification (Inquisitor)
- CWE: CWE-601
- CVSS: **4.7 (MEDIUM)**
- Vector: `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:C/C:L/I:L/A:N`

---

## Remediation Guidance

### Recommended Fix

Validate `res.redirectUri` before assigning: parse with `new URL(uri)`, verify `protocol === 'https:'`, verify `hostname` matches configured IdP domains from `sessionConfig.json`. Reject and log if validation fails.

**Priority**: MEDIUM

---

## References

**Scan Finding**: [VULN-007-S-scan-finding.md](VULN-007-S-scan-finding.md)  
**Threat Model References**: TM-002  
**Attack Surface References**: AS-006

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
