# VULN-015-S: Scanner Finding - session-config-unsanitized-values

**Phase**: Scanner
**Vulnerability ID**: VULN-015
**Assessment**: 2026-07-31-10-57
**Task**: R-M-003 - Configuration Trust Boundary — sessionConfig.json and KeyboardMappings.json
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/services/configuration.service.ts`
**Line**: 38–80
**Function**: `ConfigurationService.loadConfig() / initSessionOptions() / isValidVariable()`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`sessionConfig.json` is a static asset co-hosted with the Angular SPA. It is loaded via unauthenticated HTTP GET with no SRI (Subresource Integrity) or signature check. Three values are consumed without schema validation:

1. **`applicationName`**: Used in `CreateSessionRequest` constructor and in all macro API path parameters. If it contains path traversal characters, it may enable server-side path traversal in macro file operations (see VULN-016 context). No character allow-listing applied.

2. **`sessionOptions`** (GX_VAR* prefix validated): The key prefix check prevents injection via key names, but value content is unrestricted. Any string value passes `isValidVariable()`. These values reach `CreateSessionRequest.options` via `Object.assign`. ApplinX server-side handling of unexpected option values is unknown.

3. **`autoLoginIfDisabledAuth`**: Controls whether the application silently reconnects after disconnect. Accepted from config file with no secondary server-side verification. Modifying this flag in a tampered `sessionConfig.json` disables the mandatory reauthentication security boundary.

### Code Snippet

```typescript
// configuration.service.ts:38–44
this.httpClient.get<any>(url + "/assets/config/sessionConfig.json")
    .subscribe(config => {
        this._applicationName = config.applicationName;    // no validation
        this._connectionPool = config.connectionPool;      // no validation
        this._autoLogin = config.autoLoginIfDisabledAuth;  // controls security boundary
        this.initSessionOptions(config.sessionOptions);
    })

// configuration.service.ts:67–69
private isValidVariable(variableKey: any, variableValue: any): boolean {
    return (variableKey && typeof variableKey === 'string' && variableKey.length > 0
            && variableKey.startsWith('GX_VAR')
            && variableValue && typeof variableValue === 'string' && variableValue.length > 0);
    // value content NOT validated
}
```

---

## Context

**Scan Task**: [R-M-003](../../01-recon/tasks/R-M-003-config-trust-boundary.json)
**Coverage**: 6/6 in-scope files (100%)

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-010, TM-003
**Related Attack Surface**: AS-014

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Test applicationName with `../` and verify whether ApplinX REST API performs path canonicalization before macro file operations
- Assess autoLoginIfDisabledAuth security implication: what is the user-visible behavior when this flag is `true` and the server disconnects?
- Determine whether sessionOptions values with special characters cause any unexpected ApplinX session behavior

**For Registry**: Update vulnerability-registry.json with VULN-015 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
