# VULN-013-S: Scanner Finding - vulnerable-dependencies-bootstrap-jquery

**Phase**: Scanner
**Vulnerability ID**: VULN-013
**Assessment**: 2026-07-31-10-57
**Task**: R-H-006 - Dependency Vulnerability Scan — npm packages
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `package.json`
**Line**: 29–32
**Detected By**: LLM static analysis (no npm audit run — no package-lock.json present)

---

## Preliminary Assessment

Two runtime dependencies have known CVEs:

**bootstrap 5.1.3** (line 29):
- **CVE-2024-6531** (CVSS 6.4): XSS via `data-bs-template` attribute in Tooltip and Popover components when `sanitize: false` is configured. Affects 5.x before 5.3.x.
- **GHSA-9mvj-f7w8-pvh2**: ReDoS in tooltip component.
- Bootstrap is a direct runtime dependency loaded in the browser. jQuery interop confirmed at `webLogin.component.ts:117` (`$('#connect').prop('disabled')`).

**jquery 3.6.0** (line 32):
- **CVE-2019-11358** (CVSS 6.1): Prototype pollution via `$.extend(true, ...)`. The 3.x series is documented as affected; 3.6.0 does not contain a targeted fix for this vector.
- jQuery is loaded browser-side. Prototype pollution via `$.extend` can affect `Object.prototype` globally, potentially influencing Angular DI object construction or ApplinX REST API request building.

Additionally:
- **rxjs-compat 6.6.7** (line 35): Deprecated compatibility shim with no active security fix path. Not needed since the project uses rxjs 7.5.2 directly.
- **No package-lock.json** (no lockfile in repository): Dependencies are resolved at install time using semver ranges — non-reproducible builds. Lodash-es override at `^4.17.23` addresses prototype pollution CVEs but relies on semver resolution without lockfile pinning.

### Code Snippet

```json
// package.json:29–37
"bootstrap": "5.1.3",      // CVE-2024-6531 XSS, GHSA-9mvj-f7w8-pvh2 ReDoS
"jquery": "3.6.0",          // CVE-2019-11358 prototype pollution
"rxjs-compat": "6.6.7",     // deprecated, no security fix path
"overrides": {
  "lodash-es": "^4.17.23"   // mitigation for CVE-2019-10744 — no lockfile to pin
}
```

---

## Context

**Scan Task**: [R-H-006](../../01-recon/tasks/R-H-006-dependency-scan.json)
**Target**: package.json
**Coverage**: 1/1 file; no lockfile; npm audit not run (missing lockfile)

**Tools Used**: LLM static analysis (LLM CVE knowledge base)

---

## Threat Model & Attack Surface

**Related Threats**: TM-001, TM-003
**Related Attack Surface**: AS-011

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Run `npm install && npm audit --json` to get precise CVE list for installed transitive tree
- Upgrade bootstrap to 5.3.x (current LTS) to resolve CVE-2024-6531
- Assess whether jquery is still needed (only confirmed usage is a single DOM property query at webLogin.component.ts:117 — replaceable with `document.getElementById`)
- Commit a `package-lock.json` after dependency resolution
- Verify lodash-es override fully resolves CVE-2019-10744 and CVE-2020-8203 at the resolved version

**For Registry**: Update vulnerability-registry.json with VULN-013 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
