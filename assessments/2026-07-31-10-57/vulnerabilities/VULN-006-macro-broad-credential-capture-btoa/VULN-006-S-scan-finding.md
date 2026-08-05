# VULN-006-S: Scanner Finding - macro-broad-credential-capture-btoa

**Phase**: Scanner
**Vulnerability ID**: VULN-006
**Descriptor**: macro-broad-credential-capture-btoa
**Assessment**: 2026-07-31-10-57
**Task**: R-M-004 - Macro Feature SAST — Recording, Playback, Filename Handling
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: HIGH
**File**: `src/app/services/shared.service.ts`
**Line**: 88–108
**Function**: `SharedService.recordMacro()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The macro recording system captures password field values using `document.querySelectorAll("input[type='password']")` — a **global DOM query** that scans all password inputs on the page, not just ApplinX-managed fields. The captured values are encoded with `window.btoa()` — Base64 encoding that is trivially reversible.

**Two compounding issues:**

1. **Overly broad capture scope**: Any third-party UI component rendered concurrently (password-change dialogs, Carbon Design System modals, other security inputs) will have its password value captured into the macro recording if a field with a matching `name` attribute exists in the ApplinX send-keys request.

2. **Base64 is not encryption**: `window.btoa(pwdField["value"])` produces a Base64-encoded string stored in the macro JSON file on the ApplinX server. Anyone with read access to the macro file — via the macro REST API (`viewMacro`), direct server file access, or through an XSS attack reading `macroRecordArray` in memory — can recover the plaintext password with a single `atob()` call.

The macro password lifecycle:
- **Record**: `btoa(value)` → stored in `macroRecordArray` → saved to server
- **Playback**: `atob(value)` → plaintext password in `fieldElement.value` → sent to ApplinX host
- **View**: `atob(value)` → plaintext decoded → replaced with mask characters (brief plaintext in heap)

### Code Snippet

```typescript
// shared.service.ts:88–98
recordMacro(sendKeysRequest) {
    let fieldsList = sendKeysRequest.fields;
    let passwordFieldList = document.querySelectorAll("input[type='password']")  // GLOBAL query

    passwordFieldList.forEach(fieldEntry => {
        let pwdField = fieldsList.filter(item => item.name == fieldEntry["name"])[0];
        if(pwdField){
            pwdField["type"] = GXUtils.pwdText;
            pwdField["value"] = window.btoa(pwdField["value"]);  // Base64 only — NOT encryption
        }
    })
    // ... pushes to macroRecordArray
}

// macro.component.ts:208 — playback
fieldElement.value = window.atob(fieldElement.value)  // trivially decodes plaintext
```

---

## Context

**Scan Task**: [R-M-004](../../01-recon/tasks/R-M-004-macro-feature-sast.json)
**Target**: macro.component.ts, shared.service.ts
**Coverage**: 7/7 in-scope files examined (100%)

**Tools Used**:
- LLM static analysis (no external tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-007: Macro password storage with base64 obfuscation only — recoverable plaintext

**Related Attack Surface**:
- AS-008: MacroComponent — macro step recording including password field capture and server storage

---

## Analysis Notes

**Patterns Observed**:
- `document.querySelectorAll("input[type='password']")` — no scope restriction to ApplinX elements
- `window.btoa` / `window.atob` used as credential "protection" — design intent exists (pwdText type marker) but implementation provides no security
- `decryptBeforePlay()` at macro.component.ts:202 has no null guard on `element.fields` (unlike the similar `setPasswordMask()` which guards `element.fields &&`)

**Coverage Assessment**: 100%. All macro recording, playback, and view paths traced.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Assess whether the ApplinX macro REST API enforces access controls per user on stored macro files (if not, any authenticated user can read any macro and recover passwords)
- Determine if the `name` attribute matching between `passwordFieldList` and `fieldsList` is sufficient to prevent cross-component password capture in practice
- Evaluate whether a proper encryption solution (e.g., Web Crypto API AES-GCM with a session-scoped key) can replace the btoa scheme
- Verify macro file transmission uses HTTPS (see VULN-016 — hardcoded HTTP basePath)

**For Scanner**:
- No follow-up needed

**For Registry**:
- Update vulnerability-registry.json with VULN-006 as flagged HIGH

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
