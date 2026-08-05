# VULN-010-S: Scanner Finding - cicd-static-scan-non-blocking

**Phase**: Scanner
**Vulnerability ID**: VULN-010
**Descriptor**: cicd-static-scan-non-blocking
**Assessment**: 2026-08-02-20-57
**Task**: R-L-002 - CI/CD Pipeline Configuration Security
**Executed**: 2026-08-02T21:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `.pipeline-config.yaml`
**Line**: 15
**Detected By**: LLM analysis

---

## Preliminary Assessment

The CI/CD pipeline correctly implements VULN-014 (`npm ci` + `npm audit`), VULN-017 (`detect-secrets` re-enabled), and VULN-018 (`image_pull_policy: Always`). However, the `static-scan` step has `abort_on_failure: false`, allowing the pipeline to continue even when the SAST scan finds vulnerabilities. This means vulnerabilities detected by static analysis do not block code from progressing. Additionally, the `detect-secrets` step is re-enabled (VULN-017) but `.secrets.baseline` file does not exist in the repository root.

### Code Snippet

```yaml
# .pipeline-config.yaml line 15:
- name: static-scan
  image: icr.io/continuous-delivery/pipeline/pipeline-base-ubi:3.61
  image_pull_policy: Always
  abort_on_failure: false  # SECURITY ISSUE: scan failure does not block build

# Missing from repository root: .secrets.baseline file for detect-secrets comparison
# detect-secrets step (line 9) is enabled but has no baseline to compare against
```

---

## Context

**Scan Task**: [R-L-002](../../01-recon/tasks/R-L-002-cicd-pipeline-config.md)
**Target**: .pipeline-config.yaml
**Coverage**: 100% — complete YAML file analyzed

**Tools Used**:
- LLM analysis (no tools)

---

## Threat Model & Attack Surface

**Related Threats**:
- TM-004: Supply chain — CI/CD pipeline is a trust boundary

**Related Attack Surface**:
- AS-009: CI/CD pipeline — build environment, artifact signing, secrets detection

---

## Analysis Notes

**Patterns Observed**:
- VULN-014 verified: npm ci (line 45) and npm audit --audit-level=moderate (line 49) present
- VULN-017 verified: detect-secrets step enabled (line 9) but .secrets.baseline missing
- VULN-018 verified: image_pull_policy Always on both image-based steps
- abort_on_failure:false on static-scan — security scan does not block build
- Container image tags not pinned by SHA256 digest

**Coverage Assessment**: Complete — full .pipeline-config.yaml analyzed. All VULN fix annotations verified.

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**:
- Change abort_on_failure to true on static-scan step — or document exception with risk acceptance sign-off
- Generate and commit .secrets.baseline file: 'detect-secrets scan > .secrets.baseline'
- Pin container images by SHA256 digest instead of version tags
- Verify sign-artifact key management — confirm signing keys are in secure credential store

**For Registry**:
- Assign VULN-010 to cicd-static-scan-non-blocking
- Set status: flagged, severity: medium

---

**Status**: FLAGGED
**Created**: 2026-08-02T21:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
