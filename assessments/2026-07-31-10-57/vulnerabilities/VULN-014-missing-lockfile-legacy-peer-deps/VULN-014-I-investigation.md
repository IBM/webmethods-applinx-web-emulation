# VULN-014-I: Investigation Report - missing-lockfile-legacy-peer-deps

**Phase**: Inquisitor
**Vulnerability ID**: VULN-014
**Descriptor**: missing-lockfile-legacy-peer-deps
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

No `package-lock.json` exists in the repository. The CI pipeline ([`.pipeline-config.yaml:43`](.pipeline-config.yaml:43)) runs `npm install --legacy-peer-deps` without a lock file. `--legacy-peer-deps` bypasses peer dependency conflict detection. No `npm audit` step is present in the CI pipeline. This means: (1) each CI build may resolve semver ranges to different package versions depending on npm registry state at build time, (2) known vulnerable dependency versions are not blocked, (3) the build is non-reproducible and cannot be forensically analyzed to determine exact dependency versions at time of compromise.

---

## Attack Scenario

**Dependency Confusion/Typosquatting**: Attacker publishes a malicious package with a name similar to a dependency. Without lock file, `npm install` can resolve to attacker's package. With `--legacy-peer-deps`, peer dependency checks that might catch version conflicts are skipped.

**Version Pinning Bypass**: semver ranges in `package.json` (e.g., `^5.57.7` for carbon-components-angular) allow minor and patch version updates. A compromised version published to npm within that range is automatically installed.

**No Detection**: Without `npm audit` in CI, known CVEs in dependencies are not blocked. Combined with VULN-018 (sign-artifact disabled), there is no integrity check on installed packages.

---

## Prerequisites

- Attacker must publish malicious package to npm registry within semver range of a dependency
- Or: wait for a known CVE to be published in an installed version
- No lock file and no `npm audit` in CI means there is no gate to catch either scenario

---

## Privilege Boundary Analysis

**Starting Privilege**: npm registry attacker (supply chain threat actor)
**Achieved Privilege**: Malicious code included in build artifacts delivered to all users
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: LOW
**Availability**: NONE

### Impact Description

Non-reproducible builds and missing vulnerability scanning create a supply chain attack vector. Likelihood is low (requires npm registry compromise or typosquatting success) but impact if exploited is high. The lack of lock file also makes it impossible to determine exactly what was built and deployed, impeding incident response.

---

## Data Flow Analysis

**Sources**:
- npm registry — resolves semver ranges at build time without lock file

**Transformations**:
- `npm install --legacy-peer-deps` — installs potentially different versions each build
- `ng build` — bundled into production artifacts

**Sinks**:
- Production build artifacts — potentially containing malicious dependency code
- User browsers — executing the bundled JavaScript

---

## Affected Components

### Direct Impact

- **`package.json` — no package-lock.json counterpart**: Non-reproducible dependency resolution
- **[`.pipeline-config.yaml:43`](.pipeline-config.yaml:43) — npm install --legacy-peer-deps**: Bypasses peer dependency conflict detection; no npm audit

### Indirect Impact

- **VULN-018 (sign-artifact disabled)**: No artifact integrity check; malicious build output undetectable
- **VULN-017 (detect-secrets disabled)**: If malicious dependency includes hardcoded credential exfiltration, goes undetected

---

## Remediation Guidance

### Recommended Fix

Commit `package-lock.json`: run `npm install` locally and commit the generated lock file. Update CI to use `npm ci` (which respects lock file and fails if lock is inconsistent). Add `npm audit --audit-level=moderate` to CI pipeline.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Generate and commit `package-lock.json`
2. Replace `npm install` with `npm ci` in CI pipeline
3. Remove `--legacy-peer-deps` flag (resolve peer dependency conflicts explicitly)
4. Add `npm audit --audit-level=moderate` to compliance-checks step
5. Enable artifact signing (VULN-018) to detect build artifact tampering
6. Consider Dependabot or Renovate for automated dependency updates with security scanning

---

## References

**Scan Finding**: [vulnerabilities/VULN-014-missing-lockfile-legacy-peer-deps/VULN-014-S-scan-finding.md](vulnerabilities/VULN-014-missing-lockfile-legacy-peer-deps/VULN-014-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-011

**External References**:
- CWE-354: Improper Validation of Integrity Check Value
- CWE-829: Inclusion of Functionality from Untrusted Control Sphere
- OWASP A06:2021 — Vulnerable and Outdated Components
- OWASP A08:2021 — Software and Data Integrity Failures
- CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N — Score: 4.8 MEDIUM

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
