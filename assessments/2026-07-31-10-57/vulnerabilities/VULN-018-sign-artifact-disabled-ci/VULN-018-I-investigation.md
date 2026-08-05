# VULN-018-I: Investigation Report - sign-artifact-disabled-ci

**Phase**: Inquisitor
**Vulnerability ID**: VULN-018
**Descriptor**: sign-artifact-disabled-ci
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

[`.pipeline-config.yaml`](.pipeline-config.yaml) disables the `sign-artifact` step in both code-checks (lines 26-27) and code-build (lines 55-56) with `when: 'false'`. The pipeline uses `dind: true` (Docker-in-Docker) with docker-socket access and `image_pull_policy: IfNotPresent` — meaning cached Docker images are reused without freshness checks. Without artifact signing, there is no cryptographic guarantee that the build output was produced by the legitimate build pipeline from the declared source code. A compromised CI environment, cache poisoning attack, or build artifact substitution would be undetectable.

---

## Attack Scenario

**Cache Poisoning via IfNotPresent**: `image_pull_policy: IfNotPresent` allows CI to use a cached Docker image. If a prior run cached a malicious/outdated image, subsequent runs use it without re-pulling. Combined with `dind: true`, a malicious build image could inject code into the build process.

**Build Artifact Substitution**: Without signed artifacts, an attacker who compromises build output storage (S3, Artifactory, container registry) can replace legitimate artifacts with malicious ones. Downstream deployments install the malicious artifact with no integrity check to detect tampering.

**Supply Chain Combined Risk**: VULN-014 (no lock file) + VULN-017 (no detect-secrets) + VULN-018 (no signing) = comprehensive supply chain security gaps: arbitrary dependency versions → no secret scanning → no integrity attestation.

---

## Prerequisites

- Attacker must compromise CI environment, build output storage, or Docker image cache
- No artifact signing means tampering is undetectable by downstream consumers

---

## Privilege Boundary Analysis

**Starting Privilege**: CI environment access or build artifact storage access
**Achieved Privilege**: Malicious code delivered to all production deployments — arbitrary code execution in all user browsers
**Boundary Crossed**: YES

---

## Impact Assessment

**Confidentiality**: LOW
**Integrity**: LOW
**Availability**: NONE

### Impact Description

Artifact signing provides integrity attestation — without it, the provenance chain from source code to deployed artifact cannot be verified. The risk is currently theoretical (no evidence of active tampering) but the governance gap is confirmed and significant given `dind: true` and `IfNotPresent` image policy.

---

## Data Flow Analysis

**Sources**:
- Build pipeline output — `ng build` production artifacts (JavaScript bundles)

**Transformations**:
- `sign-artifact` step disabled (`when: false`)
- No cryptographic signature generated for build output

**Sinks**:
- Deployed production build — no integrity verification available to consumers

---

## Affected Components

### Direct Impact

- **[`.pipeline-config.yaml:26-27`](.pipeline-config.yaml:26) — sign-artifact when: false (code-checks)**: No artifact signing in code check stage
- **[`.pipeline-config.yaml:55-56`](.pipeline-config.yaml:55) — sign-artifact when: false (code-build)**: No artifact signing in build stage
- **[`.pipeline-config.yaml`](.pipeline-config.yaml) — image_pull_policy: IfNotPresent**: Cached Docker images reused without freshness verification

### Indirect Impact

- **VULN-014 (no lock file) + VULN-017 (no detect-secrets)**: Three combined supply chain gaps: no reproducibility + no secret scanning + no signing

---

## Remediation Guidance

### Recommended Fix

Remove `when: 'false'` from `sign-artifact` steps. Configure IBM Continuous Delivery artifact signing per IBM Cloud documentation. Change `image_pull_policy` to `'Always'` to prevent cache poisoning.

**Priority**: MEDIUM

### Defense-in-Depth Recommendations

1. Re-enable `sign-artifact` step in both code-checks and code-build
2. Change `image_pull_policy: IfNotPresent` to `image_pull_policy: Always`
3. Implement SLSA (Supply-chain Levels for Software Artifacts) provenance attestation
4. Use `npm ci` (not `npm install`) with `package-lock.json` for reproducible builds (VULN-014)
5. Add detect-secrets scanning (VULN-017)

---

## References

**Scan Finding**: [vulnerabilities/VULN-018-sign-artifact-disabled-ci/VULN-018-S-scan-finding.md](vulnerabilities/VULN-018-sign-artifact-disabled-ci/VULN-018-S-scan-finding.md)

**Threat Model References**:
- TM-003

**Attack Surface References**:
- AS-011

**External References**:
- CWE-494: Download of Code Without Integrity Check
- CWE-345: Insufficient Verification of Data Authenticity
- OWASP A08:2021 — Software and Data Integrity Failures
- SLSA Supply Chain Security: https://slsa.dev
- CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N — Score: 4.2 MEDIUM

---

**Investigation Complete**: 2026-07-31T12:00:00Z
**Next Phase**: Rectifier
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
