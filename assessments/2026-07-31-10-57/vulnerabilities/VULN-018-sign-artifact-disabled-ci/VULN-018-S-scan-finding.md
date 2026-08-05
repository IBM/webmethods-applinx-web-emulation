# VULN-018-S: Scanner Finding - sign-artifact-disabled-ci

**Phase**: Scanner
**Vulnerability ID**: VULN-018
**Assessment**: 2026-07-31-10-57
**Task**: R-L-001 - CI/CD Pipeline Security — pipeline-config.yaml and Supply Chain
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `.pipeline-config.yaml`
**Line**: 26–27
**Detected By**: LLM static analysis

---

## Preliminary Assessment

`sign-artifact` is disabled in both `code-checks` (line 26) and `code-build` (line 55). Without signed artifacts, there is no cryptographic proof that build outputs were produced by the CI pipeline from the source code in the repository. A compromised CI runner, base image, or artifact registry could substitute a tampered build.

The risk is amplified by `dind: true` in the CI tasks — Docker-in-Docker gives the CI container access to the host Docker socket. A compromised `static-scan` or `compliance-checks` step could tamper with other pipeline artifacts.

The base image `icr.io/continuous-delivery/pipeline/pipeline-base-ubi:3.61` is pulled with `image_pull_policy: IfNotPresent` — if a cached (potentially stale) version is present, the CI system does not re-pull to get the latest security patches.

### Code Snippet

```yaml
# .pipeline-config.yaml:26–27 (code-checks)
- name: sign-artifact
  when: 'false'

# .pipeline-config.yaml:55–56 (code-build)
- name: sign-artifact
  when: 'false'

# dind: true in both active steps — host Docker socket access
- name: static-scan
  dind: true
  include: [docker-socket]
```

---

## Context

**Scan Task**: [R-L-001](../../01-recon/tasks/R-L-001-cicd-supply-chain.json)
**Coverage**: 100%

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Assess whether artifact signing is required by the deployment environment; check if the IBM Continuous Delivery platform provides alternative integrity guarantees for pipeline outputs; evaluate changing `image_pull_policy: IfNotPresent` to `Always` for security-sensitive base images

**For Registry**: Update vulnerability-registry.json with VULN-018 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
