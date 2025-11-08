# Coverage Tier Implementation Checklist

## ✅ Already Implemented

### Phase 1: Core Configuration
- [x] Created `.coverage-tiers.json` with three-tier registry
  - Tier 3 (95%+): web, editor, api
  - Tier 2 (85-90%): template available
  - Tier 1 (60-70%): template available

### Phase 2: Jest Configuration Updates
- [x] Updated `client/web/jest.config.ts`
  - Global: 95% threshold
  - Per-file: 100% for stores, 95% for contract-validation

- [x] Updated `client/libs/ui/editor/jest.config.ts`
  - Global: 95% threshold
  - Added collectCoverageFrom for accuracy

### Phase 3: CI/CD Enhancement
- [x] Enhanced `.github/workflows/ci.yml`
  - Added "Validate coverage meets tier requirements" step
  - Parses .coverage-tiers.json for thresholds
  - Compares against coverage-summary.json
  - Fails PR if any package below tier threshold
  - Provides clear remediation steps on failure

### Phase 4: Documentation
- [x] Created `COVERAGE-TIERS.md`
  - Complete guide with migration paths
  - Tier definitions and use cases
  - CI/CD enforcement explanation
  - Common workflows and FAQ

- [x] Created `COVERAGE-QUICK-REF.md`
  - Quick lookup for developers
  - Current tier assignments
  - Common tasks (5-min read)

- [x] Created `.TEMPLATE-jest.tier1-legacy.config.ts`
  - Template for legacy packages (60-70%)
  - Exemption examples
  - Migration guidance

- [x] Created `.TEMPLATE-jest.tier2-established.config.ts`
  - Template for established packages (85-90%)
  - Exemption examples
  - Promotion tracking

- [x] Created `COVERAGE-COMMIT-TEMPLATES.md`
  - Git commit message templates
  - Coverage change documentation
  - Quick reference by change type

---

## 📋 Next Steps for Your Team

### For New Packages
1. Copy template from `COVERAGE-QUICK-REF.md` step "Starting a new package"
2. Use `client/web/jest.config.ts` as Tier 3 reference
3. Update `.coverage-tiers.json` with package name
4. Run `npm run test -- --coverage` to verify

### For Existing Legacy Packages
1. Check current coverage with `npm run test -- --coverage`
2. Classify in `.coverage-tiers.json` (Tier 1, 2, or 3)
3. Copy appropriate template:
   - Legacy: `.TEMPLATE-jest.tier1-legacy.config.ts`
   - Established: `.TEMPLATE-jest.tier2-established.config.ts`
   - New: `client/web/jest.config.ts` as reference
4. Add to package's `jest.config.ts`

### For Existing Modern Packages
1. Verify current jest config enforces 95%
2. Update `.coverage-tiers.json` to Tier 3
3. All future PRs will auto-validate in CI

### Team Communication
- [ ] Share `COVERAGE-QUICK-REF.md` with team
- [ ] Schedule knowledge transfer session
- [ ] Add to PR template: "Coverage meets tier threshold"
- [ ] Update onboarding docs to reference COVERAGE-TIERS.md

---

## 🧪 Testing the Implementation

### Local Test (Before CI)
```bash
# 1. Navigate to project
cd /Users/rayg/repos/max-ai/platform

# 2. Run web tests
cd client
npm run test -- --coverage

# 3. Run editor tests
npm run test -- --coverage libs/ui/editor

# 4. Check coverage output
cat coverage/coverage-summary.json
```

### CI/CD Test (Next PR)
```bash
# 1. Create a test branch
git checkout -b test/coverage-enforcement

# 2. Intentionally reduce coverage to <95%
# (e.g., remove some tests)

# 3. Push to GitHub
git push origin test/coverage-enforcement

# 4. Create PR
# CI should FAIL with message:
# "❌ FAILURE: Coverage below 95% threshold"

# 5. Restore coverage
# Re-run: npm run test -- --coverage
# Should now PASS

# 6. Delete test branch
git checkout main
git branch -D test/coverage-enforcement
```

---

## 📚 File Manifest

| File | Purpose | Read Time |
|------|---------|-----------|
| `.coverage-tiers.json` | Registry of tier assignments | 2 min |
| `COVERAGE-TIERS.md` | Complete guide + FAQ | 15 min |
| `COVERAGE-QUICK-REF.md` | Quick lookup guide | 5 min |
| `.TEMPLATE-jest.tier1-legacy.config.ts` | Legacy package template | 3 min |
| `.TEMPLATE-jest.tier2-established.config.ts` | Established package template | 3 min |
| `COVERAGE-COMMIT-TEMPLATES.md` | Git message templates | 3 min |
| `.github/workflows/ci.yml` | CI validation logic | 5 min |
| `client/web/jest.config.ts` | Tier 3 example (web) | 3 min |
| `client/libs/ui/editor/jest.config.ts` | Tier 3 example (editor) | 3 min |

---

## 🚀 Rollout Plan

### Week 1: Soft Launch
- [ ] Share COVERAGE-QUICK-REF.md with dev team
- [ ] Let devs familiarize with 3-tier system
- [ ] Run one PR through new CI validation

### Week 2: Full Enforcement
- [ ] All new PRs must meet tier thresholds
- [ ] CI fails if coverage drops below tier
- [ ] Team addresses any false positives

### Week 3: Optimization
- [ ] Review first week of coverage metrics
- [ ] Identify packages ready for tier promotion
- [ ] Plan Tier 1→Tier 2 migrations

### Ongoing: Quarterly Review
- [ ] Review tier assignments quarterly
- [ ] Promote Tier 2 packages that hit 95%
- [ ] Identify Tier 1 packages for refactoring
- [ ] Update `.coverage-tiers.json` accordingly

---

## ❓ FAQ During Rollout

**Q: My PR failed because coverage is 90% but I need 95%. What do I do?**
A: See `COVERAGE-TIERS.md` section "Coverage is failing in CI". Add tests for uncovered lines.

**Q: Can I temporarily lower the threshold?**
A: Not recommended. If needed, promote to Tier 2 (85-90%) with justification. Create issue for eventual return to 95%.

**Q: I have a package with 0% coverage. Where do I start?**
A: Classify as Tier 1 (60-70%) in `.coverage-tiers.json`. Add tests incrementally. Promote when ready.

**Q: When do you review tiers for promotion?**
A: Quarterly. Add a reminder to your calendar. Move Tier 2→Tier 3 when >95%. Move Tier 1→Tier 2 when adding features.

**Q: Does this apply to all packages?**
A: Yes, new/modified code must meet tier threshold. Legacy packages use Tier 1 temporarily (60-70%).

---

## 🎯 Success Metrics

After implementation, track:

1. **Coverage Distribution**
   - % of code in Tier 3 (95%+)
   - % of code in Tier 2 (85-90%)
   - % of code in Tier 1 (60-70%)
   - Goal: 80% in Tier 3 within 6 months

2. **PR Health**
   - % of PRs passing coverage validation on first attempt
   - Average # of attempts to meet threshold
   - Goal: 90% pass on first attempt

3. **Team Adoption**
   - % of developers familiar with COVERAGE-TIERS.md
   - % of code reviews mentioning coverage
   - % of new packages starting at Tier 3
   - Goal: 100% adoption within month 1

4. **Coverage Trends**
   - Monthly average coverage across all packages
   - Tier promotion rate (Tier 1→2→3 progression)
   - Bug detection rate improvement
   - Goal: 5% improvement monthly

---

## 🔗 Related Documents

- **For Developers:** `COVERAGE-QUICK-REF.md`
- **For Architects:** `COVERAGE-TIERS.md` (full guide)
- **For CI/CD:** `.github/workflows/ci.yml` (validation logic)
- **For Git:** `COVERAGE-COMMIT-TEMPLATES.md` (commit messages)

---

## 📞 Support

**Questions?**
1. Check `COVERAGE-QUICK-REF.md` (5-min read)
2. Read `COVERAGE-TIERS.md` section "FAQ" (detailed answers)
3. Open a GitHub issue with label `area:testing` or `help:coverage`

**Bug in CI validation?**
- Check `.github/workflows/ci.yml` for validation logic
- Review `.coverage-tiers.json` format
- Run local test: `npm run test -- --coverage`
- Open issue with label `area:ci-cd` and `priority:P1`

---

**Created:** 2025-11-08  
**Status:** ✅ Ready for deployment  
**Last Updated:** 2025-11-08
