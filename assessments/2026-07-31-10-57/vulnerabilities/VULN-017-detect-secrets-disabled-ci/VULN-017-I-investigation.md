# VULN-017-I: Investigation Report - detect-secrets-disabled-ci

**Phase**: Inquisitor
**Vulnerability ID**: VULN-017
**Descriptor**: detect-secrets-disabled-ci
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

[`.pipeline-config.yaml:8-9`](.pipeline-config.yaml:8) explicitly disables the `detect-secrets` CI step with `when: 'false'`. Additionally, `static-scan` and `dynamic-scan` steps are also disabled (`when: 'false'`). Without `detect-secrets` scanning in CI, hardcoded credentials, API keys, or secrets committed to the repository go undetected. This creates a governance gap: developers can accidentally commit secrets (API tokens, passwords, private keys) and these will be included in builds and potentially deployed to production without any automated detection.

---

## Attack Scenario

**Scenario 1 (Secrets in Source)**: Developer accidentally commits an API key, hardcoded password, or private key to the repository. Without `detect-secrets` in CI, the commit passes all checks. The secret is included in build artifacts and potentially deployed. An attacker who gains read access to the repository or build artifacts extracts the secret.

**Scenario 2 (Combined with VULN-018)**: Without `detect-secrets` AND without artifact signing, an attacker who tampers with source code to add a credential exfiltration payload (e.g., an exfiltration endpoint in `environment.prod.ts`) has no CI gate to detect it.

**Current State Review**: Manual scan of key files shows `MACRO_BASE_URL = 'http://localhost:2380/'` in `GXUtils.ts` — this is a hardcoded URL (not a credential). No hardcoded API keys or passwords were found in the current codebase. However, the absence of `detect-secrets` means this could change without detection.

---

## Prerequisites

- A secret must be accidentally or maliciously committed to the repository
- Without `detect-secrets` in CI, there is no automated gate to detect the commit

---

## Privilege Boundary Analysis

**Starting Privilege**: Developer with repository commit access
**Achieved Privilege**: Secret exfiltration or unauthorized system access using the committed credential
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: LOW
**Availability**: NONE

### Impact Description

Governance gap: no automated credential scanning in CI pipeline. Current codebase does not contain hardcoded credentials beyond the HTTP localhost URL. However, the disabled `detect-secrets` step means future credential exposure is undetected. Combined with VULN-018 (no artifact signing) and VULN-014 (no lock file), the supply chain security posture is weak.

---

## Data Flow Analysis

**Sources**:
- Developer commits to repository — potentially including hardcoded credentials

**Transformations**:
- CI pipeline skips `detect-secrets` step (`when: false`)
- Build proceeds without credential scanning

**Sinks**:
- Build artifacts — contain any hardcoded secrets from source code
- Production deployment — secrets shipped to production environment

---

## Affected Components

### Direct Impact

- **[`.pipeline-config.yaml:8-9`](.pipeline-config.yaml:8) — detect-secrets when: false**: No automated credential scanning in CI pipeline
- **[`.pipeline-config.yaml:20-21`](.pipeline-config.yaml:20) — static-scan when: false**: No static security analysis in CI
- **[`.pipeline-config.yaml:28-29`](.pipeline-config.yaml:28) — dynamic-scan when: false**: No runtime security testing in CI

### Indirect Impact

- **VULN-018 (sign-artifact disabled)**: Combined: no secrets detection AND no artifact integrity — weak supply chain posture
- **VULN-014 (missing lock file)**: Non-reproducible builds; secrets detection window further complicated

---

## Remediation Guidance

### Recommended Fix

Remove `when: 'false'` from the `detect-secrets` CI step to re-enable automated credential scanning. Ensure the `detect-secrets` baseline is configured to avoid false positives blocking legitimate code. Review and re-enable `static-scan` and `dynamic-scan` steps.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Remove `when: 'false'` from `detect-secrets` step
2. Configure `detect-secrets` baseline (`.secrets.baseline`) with approved exceptions
3. Re-enable `static-scan` step for SAST analysis
4. Add pre-commit hooks for developer-side secret scanning (truffleHog, git-secrets)
5. Enable artifact signing (VULN-018)

---

## References

**Scan Finding**: [vulnerabilities/VULN-017-detect-secrets-disabled-ci/VULN-017-S-scan-finding.md](vulnerabilities/VULN-017-detect-secrets-disabled-ci/VULN-017-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-011

**External References**:
- CWE-798: Use of Hard-coded Credentials (prevention)
- OWASP A08:2021 — Software and Data Integrity Failures
- IBM detect-secrets: https://github.com/IBM/detect-secrets
- CVSS:3.1/AV:L/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N — Score: 3.6 LOW (governance gap, not direct exploit)

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
