# VULN-014-S: Scanner Finding - missing-lockfile-legacy-peer-deps

**Phase**: Scanner
**Vulnerability ID**: VULN-014
**Assessment**: 2026-07-31-10-57
**Task**: R-H-006 - Dependency Vulnerability Scan — npm packages
**Executed**: 2026-07-31T11:30:00Z
**Analyst**: D4rthB0b-Scanner

---

## Finding Summary

**Severity**: MEDIUM
**File**: `package.json` + `.pipeline-config.yaml:43`
**Detected By**: LLM static analysis

---

## Preliminary Assessment

No `package-lock.json` is committed. CI installs with `npm install --legacy-peer-deps` without running `npm audit`. Three compounding issues:
1. **Non-reproducible builds**: `npm install` resolves from semver ranges at install time — two installs may produce different trees
2. **No integrity verification**: No SHA hashes to verify transitive packages
3. **npm audit bypassed**: Known CVEs in installed packages are not caught in CI
4. **lodash-es override** at `^4.17.23` uses a caret range without lockfile pinning — could resolve to a future version introducing regressions

**Inquisitor action required**: Run `npm install && npm audit --json` to enumerate actual CVEs in the resolved dependency tree.

---

## Context

**Scan Task**: [R-H-006](../../01-recon/tasks/R-H-006-dependency-scan.json)
**Tools Used**: LLM static analysis

---

## Recommended Action

**Action**: FLAG_FOR_INQUISITOR

---

## Next Steps

**For Inquisitor**: `npm install --legacy-peer-deps && npm audit --json > 02-scanning/raw/npm-audit-$(Get-Date -Format 'yyyy-MM-dd').json`; add a `package-lock.json`; add `npm audit --audit-level=moderate` to CI compliance-checks step

**For Registry**: Update vulnerability-registry.json with VULN-014 as flagged MEDIUM

---

**Status**: FLAGGED
**Created**: 2026-07-31T11:30:00Z
**Registry**: [vulnerability-registry.md](../../vulnerability-registry.md)
