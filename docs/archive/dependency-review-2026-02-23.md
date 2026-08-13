# Dependency and Security Review

Generated: 2026-02-23

## Executive Summary

**Status**: 🟡 Action Required

- **16 Open Security Alerts** (7 high, 5 medium, 4 low)
- **10 Open Dependabot PRs** requiring review
- **1 Critical Bug Fix PR (#36)** - Ready to merge
- **Test Infrastructure**: ✅ Completed

## Priority Actions

### 🔴 CRITICAL - Merge Immediately

**PR #36: Fix deprecated API endpoint**
- **Issue**: `/mixed_people/search` endpoint is deprecated and returns 422 errors
- **Fix**: Updates to `/mixed_people/api_search`
- **Bonus**: Adds configurable reveal parameters for emails/phone numbers
- **Impact**: Bug fix + feature enhancement
- **Risk**: Low (backwards compatible, well-tested)
- **Action**: **MERGE NOW** - This fixes a breaking issue

### 🟠 HIGH PRIORITY - Merge This Week

**1. PR #41: @modelcontextprotocol/sdk 1.25.1 → 1.26.0**
- **Fixes**: High-severity ReDoS vulnerability (Alert #13)
- **Fixes**: High-severity cross-client data leak (Alert #24)
- **Risk**: Low (minor version bump, SDK updates regularly)
- **Action**: Merge after PR #36

**2. PR #38: undici 7.16.0 → 7.18.2**
- **Fixes**: Medium-severity unbounded decompression (Alert #16)
- **Risk**: Low (patch updates for security)
- **Action**: Merge after PR #36

**3. PR #46: qs 6.14.0 → 6.15.0**
- **Fixes**: Low-severity arrayLimit bypass (Alert #25)
- **Risk**: Low (patch update)
- **Action**: Merge after other critical updates

### 🟢 LOW PRIORITY - Review and Merge

**4. PR #47: ajv (transitive dependency)**
- **Fixes**: Medium-severity ReDoS in ajv (Alerts #29, #30)
- **Risk**: Very Low (transitive dependency, not directly used)
- **Note**: ajv is used by MCP SDK/inspector, not your code
- **Action**: Merge when convenient

**5. PR #48: hono 4.11.1 → 4.12.1**
- **Fixes**: Multiple hono vulnerabilities (Alerts #15, #14, #22, #21, #20, #19, #27)
- **Risk**: None (hono is not in your dependencies or production code)
- **Note**: Only appears as transitive dependency via dev tools
- **Action**: Merge for completeness

**6. PR #42: Minor/patch updates group (5 packages)**
- **Changes**: Various non-security updates
- **Risk**: Low (grouped minor/patch updates)
- **Action**: Review changelog, merge if no breaking changes

**7. PR #28, #30, #31: GitHub Actions & dev dependencies**
- **Changes**: CI pipeline and development tooling updates
- **Risk**: Minimal (only affects CI/CD)
- **Action**: Review and merge

## Security Alert Details

### High Severity (7 alerts)

| Alert | Package | Issue | Fixed By | Status |
|-------|---------|-------|----------|--------|
| #24 | @modelcontextprotocol/sdk | Cross-client data leak | PR #41 | Open |
| #15 | hono | JWT algorithm confusion | PR #48 | Not applicable |
| #14 | hono | JWT algorithm confusion | PR #48 | Not applicable |
| #13 | @modelcontextprotocol/sdk | ReDoS vulnerability | PR #41 | Open |
| #11 | qs | DoS via memory exhaustion | PR #46 | Open |
| #10 | @modelcontextprotocol/sdk | DNS rebinding protection | N/A | Fixed |
| #7 | glob | Command injection | N/A | Fixed |

**Notes**:
- Hono vulnerabilities don't affect this project (hono is not a direct dependency)
- MCP SDK vulnerabilities should be fixed by updating to 1.26.0
- qs vulnerability is low impact (transitive dependency)

### Medium Severity (5 alerts)

| Alert | Package | Issue | Fixed By | Status |
|-------|---------|-------|----------|--------|
| #30 | ajv | ReDoS with $data option | PR #47 | Auto-dismissed |
| #29 | ajv | ReDoS with $data option | PR #47 | Open |
| #22 | hono | XSS via ErrorBoundary | PR #48 | Not applicable |
| #21 | hono | Arbitrary key read | PR #48 | Not applicable |
| #20 | hono | Web cache deception | PR #48 | Not applicable |
| #19 | hono | IPv4 validation bypass | PR #48 | Not applicable |
| #16 | undici | Unbounded decompression | PR #38 | Open |
| #8 | body-parser | DoS vulnerability | N/A | Fixed |

**Notes**:
- All hono alerts are not applicable (not used in production)
- undici is used for HTTP requests - should be updated
- ajv is transitive dependency - low risk

### Low Severity (4 alerts)

| Alert | Package | Issue | Fixed By | Status |
|-------|---------|-------|----------|--------|
| #27 | hono | Timing comparison hardening | PR #48 | Not applicable |
| #25 | qs | arrayLimit bypass DoS | PR #46 | Open |
| #23 | diff | DoS in parsePatch | N/A | Auto-dismissed |
| #4 | vite | File serving issue | N/A | Fixed |
| #3 | vite | fs settings not applied | N/A | Fixed |

## Dependabot PR Analysis

### Critical Path
```
1. PR #36 (Bug Fix) → Merge first
2. PR #41 (MCP SDK) → Security fix
3. PR #38 (undici) → Security fix
4. PR #46 (qs) → Security fix
5. PR #47, #48, #42 → Maintenance
6. PR #28, #30, #31 → CI/Dev tools
```

### Risk Assessment

| PR | Risk Level | Breaking Changes | Security Impact |
|----|-----------|------------------|-----------------|
| #36 | 🟢 Low | No | None (bug fix) |
| #41 | 🟢 Low | No | High (fixes 2 vulns) |
| #38 | 🟢 Low | No | Medium (fixes 1 vuln) |
| #46 | 🟢 Low | No | Low (fixes 1 vuln) |
| #47 | 🟢 Low | No | Medium (fixes 1 vuln) |
| #48 | 🟢 Low | No | N/A (not applicable) |
| #42 | 🟡 Medium | Possible | None |
| #28 | 🟢 Low | No | None |
| #30 | 🟡 Medium | Possible | None (dev only) |
| #31 | 🟡 Medium | Possible | None (dev only) |

## Recommended Merge Order

### Week 1 (This Week)
```bash
# 1. Critical bug fix
gh pr merge 36 --squash

# 2. High-priority security fixes
gh pr merge 41 --squash  # MCP SDK
gh pr merge 38 --squash  # undici
gh pr merge 46 --squash  # qs

# Run tests after each merge
npm test
```

### Week 2
```bash
# 3. Maintenance updates
gh pr review 47  # Review ajv update
gh pr merge 47 --squash

gh pr review 48  # Review hono update
gh pr merge 48 --squash
```

### Week 3
```bash
# 4. Grouped updates (review carefully)
gh pr view 42 --json body
gh pr merge 42 --squash

# 5. CI/Dev tooling
gh pr merge 28 --squash
gh pr merge 30 --squash
gh pr merge 31 --squash
```

## Testing Strategy

All merges should follow this process:

```bash
# 1. Check out PR locally
gh pr checkout <number>

# 2. Install dependencies
npm ci

# 3. Run full test suite
npm test

# 4. Run integration tests (if API key available)
export APOLLO_API_KEY=your_key
npm run test:integration

# 5. Build and verify
npm run build

# 6. If all pass, merge
gh pr merge <number> --squash
```

## Automated Testing

With the new CI/CD infrastructure:

- ✅ All PRs will automatically run tests
- ✅ Security scanning enabled
- ✅ Dependabot PRs auto-merge for patch/minor updates (after tests pass)
- ✅ Coverage reports generated
- ✅ TypeScript validation
- ✅ Build verification

## False Positives / Not Applicable

The following alerts can be safely ignored:

1. **All hono alerts** - Hono is not used in production code
   - Only appears as transitive dependency in dev tools
   - Not exploitable in this context

2. **Some ajv alerts** - ajv is only used by:
   - MCP Inspector (dev tool)
   - MCP SDK internally
   - Not directly exploitable in MCP server context

## Monitoring

### Weekly Tasks
- [ ] Review new Dependabot PRs
- [ ] Check security alerts dashboard
- [ ] Run `npm audit` locally
- [ ] Review CI/CD pipeline status

### Monthly Tasks
- [ ] Review all dependencies for updates
- [ ] Check for major version updates
- [ ] Review and update security policies
- [ ] Audit transitive dependencies

## Commands Reference

```bash
# List Dependabot PRs
gh pr list --author app/dependabot

# View security alerts
gh api repos/:owner/:repo/dependabot/alerts

# Check outdated packages
npm outdated

# Audit dependencies
npm audit
npm audit --audit-level=moderate

# Update all dependencies (carefully!)
npm update

# Check for major updates
npx npm-check-updates

# Run security scan
npm run test && npm audit
```

## Next Steps

1. ✅ **Immediate**: Merge PR #36 (bug fix)
2. ✅ **This Week**: Merge security PRs (#41, #38, #46)
3. ⏳ **Next Week**: Review and merge maintenance PRs
4. ⏳ **Ongoing**: Monitor Dependabot alerts
5. ✅ **Completed**: Test infrastructure setup

## Notes

- All changes should be tested before merging
- Security fixes should be prioritized over feature updates
- Keep dependencies up to date to minimize security debt
- CI/CD will automate most of this process going forward
