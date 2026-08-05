# VULN-010-I: Investigation Report - cicd-static-scan-non-blocking

**Phase**: Inquisitor
**Vulnerability ID**: VULN-010
**Descriptor**: cicd-static-scan-non-blocking
**Assessment**: 2026-08-02-20-57
**Investigated**: 2026-08-02T22:00:00Z
**Analyst**: D4rthB0b-Inquisitor
**Status**: CONFIRMED

---

## Investigation Summary

**Confirmation**: This vulnerability has been CONFIRMED as exploitable.
**Confirmed At**: 2026-08-02T22:00:00Z

**Exploitability**: HIGH

---

## Root Cause Analysis

The `static-scan` CI/CD step is configured with `abort_on_failure: false`, converting SAST findings from a blocking gate into informational output. Vulnerable code can progress through the pipeline to artifact signing and deployment without review. Additionally, `detect-secrets` is re-enabled (VULN-017 fix) but the `.secrets.baseline` file is absent from the repository — without a baseline, `detect-secrets` cannot accurately compare against known-safe patterns. Container images use version tags rather than SHA256 digests, creating a tag-reassignment attack surface.

---

## Attack Scenario

Malicious insider or compromised developer account commits code with a SAST-detected XSS vulnerability (e.g., unsanitized `innerHTML` binding). The CI/CD pipeline's `static-scan` step detects it but continues (`abort_on_failure: false`). The code progresses through `compliance-checks` (`npm audit` passes — different scope), artifact is signed and deployed. The XSS reaches production, enabling session hijacking via VULN-004's attack pattern.

---

## Prerequisites

- Developer commit access to the repository (insider or compromised account)
- Knowledge that `static-scan` is non-blocking (readable from pipeline YAML)

---

## Privilege Boundary Analysis

**Starting Privilege**: Developer with commit access
**Achieved Privilege**: Code reaches production artifact (signed) without SAST gatekeeping
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: HIGH
**Integrity**: HIGH
**Availability**: LOW

### Impact Description

SAST-detected vulnerabilities reach production users. In context of this codebase: XSS, path traversal, and injection vulnerabilities can be introduced and deployed without any automated blocking. The `npm audit` gate compensates for dependency CVEs but not for application code vulnerabilities.

---

## Data Flow Analysis

**Sources**:
- `.pipeline-config.yaml` static-scan step with `abort_on_failure: false`
- Missing `.secrets.baseline` file for `detect-secrets` comparison

**Transformations**:
- Developer commits vulnerable code
- SAST detects vulnerability — pipeline continues (`abort_on_failure: false`)
- `compliance-checks`: `npm audit` passes (different scope — dependency CVEs, not code flaws)
- `sign-artifact`: vulnerable artifact is cryptographically signed

**Sinks**:
- Signed artifact with unreviewed SAST findings deployed to production users

---

## Affected Components

### Direct Impact

- **.pipeline-config.yaml static-scan step**: `abort_on_failure: false` allows SAST findings to be ignored
- **.secrets.baseline (missing)**: `detect-secrets` cannot accurately compare against known-safe patterns

### Indirect Impact

- **All application vulnerabilities (VULN-004, VULN-007, etc.)**: Future regressions of these vulnerabilities can reach production without SAST blocking

---

## Remediation Guidance

### Recommended Fix

Change `abort_on_failure: false` to `abort_on_failure: true` on the `static-scan` step. Generate and commit `.secrets.baseline` with: `detect-secrets scan > .secrets.baseline`. If blocking SAST is not immediately feasible, document a risk acceptance decision and implement a mandatory manual security review for SAST findings.

**Priority**: HIGH

### Defense-in-Depth Recommendations

1. Change `abort_on_failure: false` to `true` on `static-scan` step
2. Generate and commit `.secrets.baseline` file: `detect-secrets scan > .secrets.baseline`
3. Pin container images to SHA256 digests instead of version tags
4. Add mandatory SAST finding review step to PR process even if pipeline blocking is deferred
5. Consider adding a separate security-gate stage that blocks on HIGH/CRITICAL SAST findings

---

## References

**Scan Finding**: [VULN-010-S-scan-finding.md](VULN-010-S-scan-finding.md)

**Threat Model References**:
- TM-004

**Attack Surface References**:
- AS-009

**External References**:
- OWASP SAMM: Security in CI/CD — SAST as a blocking gate is a Maturity Level 2 practice
- CWE-693: Protection Mechanism Failure
- Attack chain AC-002: VULN-010 non-blocking scan + VULN-005 untracked lockfile = CI/CD security gate failure

---

**Investigation Complete**: 2026-08-02T22:00:00Z
**Next Phase**: Exploiter (Validation)
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
