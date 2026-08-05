# VULN-016-S: Scanner Finding - hardcoded-localhost-http-basepath

**Phase**: Scanner
**Vulnerability ID**: VULN-016
**Assessment**: 2026-07-31-10-57
**Task**: R-M-004 - Macro Feature SAST — Recording, Playback, Filename Handling
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `src/app/macro/macro.component.ts`
**Line**: 49
**Function**: class field declaration
**Detected By**: LLM static analysis

---

## Preliminary Assessment

Four independent locations hardcode `http://localhost:2380/` as the ApplinX server URL using plain HTTP. These class-level fields shadow any environment-based configuration:

1. `macro.component.ts:49`: `basePath = 'http://localhost:2380/applinx/rest'`
2. `src/utils/GXUtils.ts:260`: `public static MACRO_BASE_URL = "http://localhost:2380/"`
3. `src/environments/environment.prod.ts:19`: `basePath: 'http://localhost:2380/applinx/rest'`

In production, macro API calls that use these values will:
- Target localhost (which is not the correct production host)
- Use HTTP (not HTTPS) — Bearer token transmitted in cleartext
- Bypass TLS-terminating reverse proxies

The production `environment.prod.ts` hardcoding of HTTP is particularly concerning — a production build would transmit Bearer tokens and macro data (including base64-encoded passwords) over unencrypted HTTP.

### Code Snippet

```typescript
// macro.component.ts:49
basePath = 'http://localhost:2380/applinx/rest';

// GXUtils.ts:260
public static MACRO_BASE_URL = "http://localhost:2380/";

// environment.prod.ts:19
basePath: 'http://localhost:2380/applinx/rest'  // PRODUCTION environment file
```

---

## Context

**Scan Task**: [R-M-004](../../01-recon/tasks/R-M-004-macro-feature-sast.json)
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Threat Model & Attack Surface

**Related Threats**: TM-007
**Related Attack Surface**: AS-008

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Verify whether MacroService from @ibm/applinx-rest-apis actually uses `basePath` from macro.component.ts or derives it from Angular environment config; check network requests in browser DevTools during macro operations to confirm actual URL used

**For Registry**: Update vulnerability-registry.json with VULN-016 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
