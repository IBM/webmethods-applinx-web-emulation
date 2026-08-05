# VULN-019-I: Investigation Report - server-controlled-sendkeys-dispatch

**Phase**: Inquisitor
**Vulnerability ID**: VULN-019
**Descriptor**: server-controlled-sendkeys-dispatch
**Assessment**: 2026-07-31-10-57
**Investigated**: 2026-07-31T12:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-07-31T12:00:00Z

**Exploitability**: LOW

---

## Root Cause Analysis

When [`KeyboardMappingService.checkKeyboardMappings()`](src/app/services/keyboard-mapping.service.ts:144) processes a `targetFunction` string that does NOT contain parentheses (no method call syntax), it calls `this.navigationService.sendKeys(keyFunc)` directly (line 145). The `keyFunc` value is the raw `targetFunction` string from the keyboard mapping — which comes from either `KeyboardMappings.json` or server-supplied keyboard mappings. This means any string can be sent as a host key to ApplinX, not just valid ApplinX function key names (e.g., `[pf1]`, `[pf2]`, `[enter]`). A malicious keyboard mapping could send arbitrary strings as keystrokes to the mainframe host.

---

## Attack Scenario

**Malicious Keyboard Mapping**: Attacker modifies `KeyboardMappings.json` (or compromises ApplinX server keyboard mappings) to set `targetFunction = '[pf3][pf3][pf3]'` (triple PF3 for an unintended menu navigation) or any other arbitrary key sequence. When user presses the mapped key, arbitrary host commands are dispatched.

Note: The impact is bounded by what the ApplinX host accepts as valid keystrokes. The ApplinX REST API `sendKeys` endpoint on the server side validates and forwards keystrokes to the host terminal — so the attack surface is limited to keystrokes the authenticated user can legitimately send. This is not arbitrary code execution on the host; it is arbitrary keystroke injection with the victim's terminal privileges.

**Relationship to VULN-002**: The `sendKeys` path (no parentheses) and the dynamic dispatch path (with parentheses, VULN-002) are different branches. VULN-019 is strictly lower severity than VULN-002.

---

## Prerequisites

- Attacker must control `KeyboardMappings.json` or ApplinX server keyboard mappings
- User must press the mapped key combination
- Attack is limited to keystrokes the user's ApplinX session can legitimately perform

---

## Privilege Boundary Analysis

**Starting Privilege**: Static asset modification (supply chain) or ApplinX server compromise
**Achieved Privilege**: Arbitrary keystroke injection to ApplinX host terminal within victim's session privileges
**Boundary Crossed**: NO

---

## Impact Assessment

**Confidentiality**: NONE
**Integrity**: LOW
**Availability**: NONE

### Impact Description

Arbitrary keystroke injection to ApplinX mainframe session — within the victim user's terminal privileges. An attacker who controls keyboard mappings can cause unintended menu navigation, accidental data submission, or triggering of host functions. Impact is bounded by the user's host privileges and ApplinX session scope.

---

## Data Flow Analysis

**Sources**:
- `KeyboardMappings.json` `targetFunction` string (no parentheses branch)
- ApplinX server-supplied keyboard mapping `targetFunction`

**Transformations**:
- `keyFunc = keyMap.targetFunction` — no validation when no parentheses detected
- `navigationService.sendKeys(keyFunc)` — keyFunc sent as raw host key string

**Sinks**:
- ApplinX REST API `sendKeys` endpoint — keyFunc transmitted as `SendKeysRequest.sendKey`

---

## Affected Components

### Direct Impact

- **[`KeyboardMappingService.checkKeyboardMappings()`](src/app/services/keyboard-mapping.service.ts:144)**: Server-controlled key string sent verbatim to ApplinX host without validation

### Indirect Impact

- **VULN-002 (prototype hijack path)**: The parentheses branch (VULN-002) is far more severe than this `sendKeys` path — fix VULN-002 first
- **VULN-014/018 (supply chain)**: `KeyboardMappings.json` tampering is the attack vector for both VULN-019 and VULN-002

---

## Remediation Guidance

### Recommended Fix

Implement an allowlist of valid ApplinX host key values before calling `sendKeys()`. Valid ApplinX host key names follow a defined format (e.g., `[pf1]`-`[pf24]`, `[enter]`, `[clear]`, `[pa1]`-`[pa3]`). Validate `keyFunc` against this allowlist and reject unknown values.

**Priority**: LOW

### Defense-in-Depth Recommendations

1. Define ApplinX valid host key allowlist: `/^\[(pf[0-9]+|pa[1-3]|enter|clear|erase|attn|sysreq|reset)\]$/i`
2. Validate `targetFunction` against allowlist before `sendKeys()`
3. Fix VULN-002 (prototype hijack) as higher priority — same attack vector, much greater impact
4. Protect `KeyboardMappings.json` via artifact signing (VULN-018)

---

## References

**Scan Finding**: [vulnerabilities/VULN-019-server-controlled-sendkeys-dispatch/VULN-019-S-scan-finding.md](vulnerabilities/VULN-019-server-controlled-sendkeys-dispatch/VULN-019-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-003
- AS-004

**External References**:
- CWE-20: Improper Input Validation
- OWASP A03:2021 — Injection
- CVSS:3.1/AV:N/AC:H/PR:L/UI:R/S:U/C:N/I:L/A:N — Score: 2.6 LOW (limited to user's terminal privileges)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
