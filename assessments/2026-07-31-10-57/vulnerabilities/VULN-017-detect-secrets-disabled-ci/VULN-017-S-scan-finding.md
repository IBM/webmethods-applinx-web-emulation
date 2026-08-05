# VULN-017-S: Scanner Finding - detect-secrets-disabled-ci

**Phase**: Scanner
**Vulnerability ID**: VULN-017
**Assessment**: 2026-07-31-10-57
**Task**: R-L-001 - CI/CD Pipeline Security — pipeline-config.yaml and Supply Chain
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `.pipeline-config.yaml`
**Line**: 8–9
**Detected By**: LLM static analysis

---

## Preliminary Assessment

The `detect-secrets` CI step is unconditionally disabled (`when: 'false'`). This step is responsible for scanning the source tree for hardcoded credentials, API keys, and tokens. Its absence means:
- The hardcoded `http://localhost:2380/` URLs in `GXUtils.ts:260`, `macro.component.ts:49`, and `environment.prod.ts:19` are not flagged by CI
- Any future hardcoded credential (API key, service account password, JWT secret) committed to the repository will not be detected before reaching production

Additionally disabled: `sign-artifact`, `dynamic-scan`, `peer-review`, `acceptance-test`, `build-artifact`, `release` — all `when: 'false'`. The only active security-relevant steps are `static-scan` and `compliance-checks` (which does not run npm audit).

### Code Snippet

```yaml
# .pipeline-config.yaml:8–9
- name: detect-secrets
  when: 'false'

# .pipeline-config.yaml:21–27
- name: release
  when: 'false'
- name: acceptance-test
  when: 'false'
- name: peer-review
  when: 'false'
- name: sign-artifact
  when: 'false'
- name: dynamic-scan
  when: 'false'
```

---

## Context

**Scan Task**: [R-L-001](../../01-recon/tasks/R-L-001-cicd-supply-chain.json)
**Coverage**: 1/1 pipeline config file (100%)

**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: Remove `when: 'false'` from detect-secrets; add `npm audit --audit-level=moderate` to compliance-checks script; evaluate re-enabling sign-artifact for production build integrity; document rationale for each disabled step

**For Registry**: Update vulnerability-registry.json with VULN-017 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
