# Coverage Tier Quick Reference

## Three-Tier System

```
TIER 3 (NEW CODE)       → 95%+  ✅ Production standard, all new packages
TIER 2 (ESTABLISHED)    → 85-90% 🔄 Mature packages, gradual improvement
TIER 1 (LEGACY)         → 60-70% ⚠️  Old patches, refactoring planned
```

## What's in Each Tier?

### Tier 3 (95%+ Coverage)
**Current packages:**
- `client/web` — Production Next.js app
- `client/libs/ui/editor` — New UI component library
- `client/api` — Core API

**Characteristics:**
- Production-ready code
- Comprehensive test coverage
- All edge cases tested
- No exceptions

---

### Tier 2 (85-90% Coverage)
**Current packages:** None (template available)

**When to use:**
- Existing code undergoing active maintenance
- Moving up from Tier 1
- Some legacy code still being refactored

**Characteristics:**
- Good test coverage
- Some exemptions allowed (with justification)
- Quarterly review for promotion to Tier 3

---

### Tier 1 (60-70% Coverage)
**Current packages:** None (template available)

**When to use:**
- Old code not yet modernized
- Maintenance-only modules
- Planned for future refactoring

**Characteristics:**
- Minimal test requirements
- Focus on preventing regressions
- Quarterly promotion review

---

## For Developers: Running Tests

```bash
# Install dependencies
npm ci

# Run tests with coverage (enforces tier thresholds)
npm run test -- --coverage

# View coverage report
open coverage/index.html
```

### If tests fail due to coverage:
1. Find uncovered lines: `cat coverage/coverage-summary.json`
2. Write tests for uncovered code
3. Re-run tests until passing

---

## For CI/CD: What Happens

1. **Push to PR** → GitHub Actions runs tests
2. **Jest runs with `--coverage`** → Fails if below tier threshold
3. **CI validates** → Checks against `.coverage-tiers.json`
4. **Result:**
   - ✅ **Pass** — Coverage meets tier threshold
   - ❌ **Fail** — Coverage below threshold, PR blocks merge

---

## Tier Migration

### How to Promote (e.g., Tier 1 → Tier 2)

1. Increase test coverage to 85-90%
2. Update `jest.config.ts` threshold
3. Update `.coverage-tiers.json`
4. Create PR with title: `refactor: promote {package} to Tier 2`
5. Get approval, merge

**Quarterly review:** Check if any Tier 2 packages are ready for Tier 3 (95%+)

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| `.coverage-tiers.json` | Registry of all packages and their tiers |
| `/docs/COVERAGE-TIERS.md` | Comprehensive guide (read this first!) |
| `.TEMPLATE-jest.tier1-legacy.config.ts` | Copy this for legacy packages |
| `.TEMPLATE-jest.tier2-established.config.ts` | Copy this for transitional packages |
| `.github/workflows/ci.yml` | CI validation logic |
| `{package}/jest.config.ts` | Per-package thresholds (web, editor, etc.) |

---

## Common Tasks

### Starting a new package
```bash
# 1. Create package
mkdir -p client/libs/new-feature

# 2. Copy Tier 3 jest config
cp client/web/jest.config.ts client/libs/new-feature/

# 3. Write tests with TDD
npm run test -- client/libs/new-feature --coverage

# 4. Update .coverage-tiers.json
# Add: "client/libs/new-feature" to tier_3_new_code.packages

# 5. Push PR (CI will validate)
```

### Fixing coverage failure in CI
```bash
# 1. See which package failed
cat .coverage-tiers.json  # Find your package's tier

# 2. Check coverage locally
npm run test -- --coverage

# 3. Add tests for uncovered code
# See: coverage/coverage-summary.json

# 4. Re-run until passing
npm run test -- --coverage

# 5. Commit and push
```

### Checking tier for your package
```bash
# Quick lookup
cat .coverage-tiers.json | jq '.tiers | to_entries[] | select(.value.packages[] | contains("your-package"))'
```

---

## FAQ

**Q: My tests are failing because coverage is below 95%. Can I lower the threshold?**
A: Move your package to Tier 2 (85-90%) with justification, or add more tests. See `/docs/COVERAGE-TIERS.md` for migration steps.

**Q: I have legacy code with 50% coverage. What do I do?**
A: Use Tier 1 (60-70%) temporarily. Add issues for each untested area. Promote quarterly when ready.

**Q: Can I skip tests for certain files?**
A: Yes, use `collectCoverageFrom` in jest config to exclude paths. Document why in a code comment.

**Q: What if coverage drops in CI?**
A: Write more tests or explain why (e.g., removed dead code). PR will block until coverage meets tier threshold.

**Q: How do I know if my package is ready for Tier 3?**
A: Coverage >95% globally + all edge cases tested. Open an issue: "Promote {package} to Tier 3"

---

## Next Steps

1. **Read full guide:** `/docs/COVERAGE-TIERS.md`
2. **Check your package's tier:** `cat .coverage-tiers.json`
3. **Run tests locally:** `npm run test -- --coverage`
4. **Add missing tests:** Update files with low coverage
5. **Check CI:** GitHub Actions will validate automatically

---

**Questions?** See `/docs/COVERAGE-TIERS.md` or open an issue.
