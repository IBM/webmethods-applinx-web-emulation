# VULN-010-I: Investigation Report - username-sessionStorage-no-cleanup

**Phase**: Inquisitor  
**Vulnerability ID**: VULN-010  
**Descriptor**: username-sessionStorage-no-cleanup  
**Assessment**: 2026-07-31-10-57  
**Investigated**: 2026-07-31T12:00:00Z  
**Analyst**: D4rthB0b-Inquisitor  
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: Confirmed as information exposure / security hygiene issue.
**Confirmed At**: 2026-07-31T12:00:00Z
**Exploitability**: LOW

---

## Root Cause Analysis

[`WebLoginComponent.handleSimpleAuth()`](src/app/webLogin/webLogin.component.ts:137) stores `JSON.stringify(username.toLowerCase())` in `sessionStorage['userName']`. [`StorageService.setNotConnected()`](src/app/services/storage.service.ts:51) removes only `'gx_token'` — never `'userName'`. Username persists across logout. Additionally, `app.component.ts:639` uses fragile `substr(1, length-2)` quote-stripping on the JSON-encoded value — `TypeError` if value is null.

---

## Attack Scenario

**XSS Username Enumeration**: Same-origin XSS reads `sessionStorage.getItem('userName')` → `JSON.parse()` → username. Used for targeted phishing, credential stuffing, or social engineering.

**Shared Device**: User logs out on shared workstation. Username persists in `sessionStorage`. Next user at same browser reads previous user's identity.

---

## Prerequisites

- User must have authenticated (username stored)
- XSS or same-origin script access required
- Username is low-sensitivity alone but aids targeted attacks

---

## Privilege Boundary Analysis

**Starting Privilege**: XSS execution in app origin
**Achieved Privilege**: Attacker learns authenticated user's username — reconnaissance
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: LOW  
**Integrity**: NONE  
**Availability**: NONE

---

## Data Flow Analysis

**Sources**:
- `WebLoginComponent` form — username.value entered by user

**Transformations**:
- `JSON.stringify(username.value.toLowerCase())` — encoded
- `sessionStorage.setItem('userName', encoded)` — persisted without cleanup

**Sinks**:
- `sessionStorage['userName']` — accessible to all same-origin JavaScript

---

## Classification Refinement

### Refined Classification (Inquisitor)
- CWE: CWE-922
- CVSS: **3.1 (LOW)**
- Vector: `CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N`

---

## Remediation Guidance

### Recommended Fix

Add `sessionStorage.removeItem('userName')` to `StorageService.setNotConnected()`. Replace `substr(1, length-2)` quote-stripping with `JSON.parse()` throughout codebase.

**Priority**: MEDIUM

---

## References

**Scan Finding**: [VULN-010-S-scan-finding.md](VULN-010-S-scan-finding.md)  
**Threat Model References**: TM-006  
**Attack Surface References**: AS-007

---

**Investigation Complete**: 2026-07-31T12:00:00Z  
**Next Phase**: Rectifier  
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
