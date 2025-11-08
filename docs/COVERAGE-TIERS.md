# Coverage Tier Enforcement Strategy

## Overview

This project uses a **three-tier coverage enforcement system** to balance quality standards with practical development realities:

| Tier | Threshold | Use Case | Examples |
|------|-----------|----------|----------|
| **Tier 3 (NEW CODE)** | 95%+ | Production-grade libraries, actively maintained core modules | `client/web`, `client/libs/ui/editor`, `client/api` |
| **Tier 2 (ESTABLISHED)** | 85-90% | Mature packages with good test coverage, gradual improvement path | (none currently, available for future packages) |
| **Tier 1 (LEGACY)** | 60-70% | Older patches, maintenance-only modules, planned for refactoring | (none currently, for older code that hasn't been modernized) |

---

## How It Works

### For Developers

1. **Before writing code:** Check `.coverage-tiers.json` to find your package's tier
2. **Write tests:** Tests must achieve the threshold for your tier
3. **Run tests locally:** Jest will fail if coverage is below threshold
   ```bash
   cd client
   npm run test -- --coverage
   ```
4. **In CI/CD:** GitHub Actions validates coverage against tier thresholds
5. **In PRs:** Fails merge if coverage drops below threshold

### For QA / CI

1. **Local Jest enforcement:** Jest config validates on every `npm test`
2. **CI workflow validation:** Parses coverage JSON and compares against `.coverage-tiers.json`
3. **PR status checks:** Blocks merge if any package fails its tier threshold
4. **Codecov integration:** (Optional) Provides visual feedback in PR comments

---

## Tier Definitions

### TIER 3: New Code (95%+)

**Use this for:**
- New UI libraries (React components, hooks)
- Production-critical services
- Recently refactored modules
- Public APIs that are actively maintained

**Characteristics:**
- High test coverage requirement
- Comprehensive unit + integration tests
- Edge cases documented and tested
- Production-ready standard

**Example:** `client/web`, `client/libs/ui/editor`

**Config:**
```typescript
coverageThreshold: {
  global: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95,
  }
}
```

---

### TIER 2: Established Packages (85-90%)

**Use this for:**
- Mature libraries with good coverage
- Stable services being actively maintained
- Modules with some legacy code being phased out
- Packages on path to Tier 3

**Characteristics:**
- Good test coverage but not complete
- Some exemptions for legacy/complex areas
- Quarterly reviews for promotion to Tier 3
- Incremental improvements tracked

**Config:**
```typescript
coverageThreshold: {
  global: {
    branches: 85,
    functions: 88,
    lines: 90,
    statements: 90,
  }
}
```

---

### TIER 1: Legacy Patches (60-70%)

**Use this for:**
- Older code not yet modernized
- Maintenance-only modules
- Code slated for refactoring
- Temporary exemptions during migration

**Characteristics:**
- Minimal test coverage
- Focus on preventing regressions (no new functionality without tests)
- Quarterly promotion review
- Clear refactoring plan required

**Config:**
```typescript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 65,
    lines: 70,
    statements: 70,
  }
}
```

---

## Migration Path: Moving Between Tiers

### Tier 1 → Tier 2 (Legacy → Established)
**Trigger:** Active development or refactoring begins
1. Add comprehensive tests for new features
2. Document legacy code that will remain untested
3. Update `.coverage-tiers.json` and jest config
4. Set thresholds to 85-90%
5. Create tracking issues for remaining gaps

### Tier 2 → Tier 3 (Established → New Code)
**Trigger:** Coverage consistently above 95% + all edge cases tested
1. Review coverage gaps
2. Write tests for remaining 5-10%
3. Update jest config to 95% global threshold
4. Remove per-file exemptions
5. Update `.coverage-tiers.json`

### Promotion Review (Quarterly)
Every quarter, review packages in Tier 2 for readiness to promote to Tier 3:
```bash
# Check current coverage
npm run test -- --coverage

# If >95% globally, promote!
```

---

## Configuration Files

### Per-Package Jest Configs

**New Tier 3 packages:**
- File: `{package}/jest.config.ts`
- Update coverageThreshold to 95%
- Example: `client/web/jest.config.ts`, `client/libs/ui/editor/jest.config.ts`

**Tier 2 packages:**
- Template: `.TEMPLATE-jest.tier2-established.config.ts`
- Copy & customize for your package

**Tier 1 packages:**
- Template: `.TEMPLATE-jest.tier1-legacy.config.ts`
- Copy & customize for your package

### Tier Registry

**File:** `.coverage-tiers.json`

Lists all packages and their current tier. Update this whenever you:
- Add a new package
- Promote/demote a package between tiers
- Change tier thresholds

```json
{
  "tiers": {
    "tier_3_new_code": {
      "threshold": 95,
      "packages": ["client/web", "client/libs/ui/editor", ...]
    },
    "tier_2_established": {
      "threshold": 85,
      "packages": [...]
    },
    "tier_1_legacy": {
      "threshold": 60,
      "packages": [...]
    }
  }
}
```

### CI Workflow

**File:** `.github/workflows/ci.yml`

Includes:
1. Jest test execution with `--coverage` flag
2. Coverage validation script that:
   - Loads `.coverage-tiers.json`
   - Parses coverage JSON
   - Compares against tier thresholds
   - Fails PR if any package below threshold

---

## CI/CD Enforcement

### Jest Local Enforcement (Always Runs)
```bash
npm test -- --coverage
# ✅ PASS if coverage >= tier threshold
# ❌ FAIL if coverage < tier threshold
```

### CI Workflow Validation (On Push/PR)
1. Runs Jest with coverage
2. Parses `coverage/coverage-summary.json`
3. Compares against `.coverage-tiers.json`
4. ✅ Passes if all packages meet their tier
5. ❌ Fails if any package below threshold

### Example Failure Output
```
❌ FAILURE: Coverage below 95% threshold

Current Coverage Metrics:
  Lines:      87%
  Statements: 89%
  Functions:  91%
  Branches:   84%

📋 To fix this PR:
  1. Add/update tests to increase coverage
  2. Verify all code paths are tested
  3. Run: npm run test -- --coverage
  4. Check: coverage/coverage-summary.json
```

---

## Common Workflows

### I'm starting a new package

1. Create your package structure
2. Add `jest.config.ts` with Tier 3 (95%) threshold (copy from `client/web/jest.config.ts`)
3. Write tests first (TDD)
4. Update `.coverage-tiers.json`
5. Push PR → CI validates

### I'm refactoring legacy code

1. Check current tier in `.coverage-tiers.json`
2. If Tier 1 → Stay at 60-70% OR promote to Tier 2 if adding features
3. Add tests for new functionality
4. Update jest config if promoting tiers
5. Update `.coverage-tiers.json`

### Coverage is failing in CI

**Check which tier your package is in:**
```bash
cat .coverage-tiers.json | grep -A 5 "my-package"
```

**Run tests locally with coverage:**
```bash
npm run test -- --coverage
# See which files are missing coverage
cat coverage/coverage-summary.json
```

**Add tests for uncovered lines:**
- Find uncovered code: `npm run test -- --coverage --collectCoverageFrom="src/my-file.ts"`
- Write tests in `src/my-file.spec.ts`
- Re-run until coverage hits threshold

### Promoting a package to Tier 3

**Prerequisites:**
- Coverage consistently >95%
- All edge cases tested
- No intentional gaps

**Process:**
1. Update `.coverage-tiers.json` (move to tier_3_new_code)
2. Update `jest.config.ts` (set all thresholds to 95)
3. Remove any per-file exemptions
4. Create PR with title: `refactor: promote {package} to Tier 3 (95% coverage)`
5. Get approval, merge

---

## FAQ

**Q: Can I exempt a file from coverage?**
A: Yes, but document why. Use `collectCoverageFrom` to exclude paths, or create a todo/issue to address later.

**Q: What if my package has legacy code I can't test?**
A: Use Tier 1 (60-70%) while you plan refactoring. Add issues for each untested area.

**Q: Can I lower a tier threshold temporarily?**
A: No—thresholds are tier-defined. If you need flexibility, move to a lower tier temporarily with justification.

**Q: How often are tiers reviewed?**
A: Quarterly. Add calendar reminders to check which Tier 2 packages are ready for Tier 3.

**Q: What if coverage drops between commits?**
A: CI fails, PR blocks. Either add more tests or justify why coverage dropped (e.g., removed dead code).

**Q: Can I use codecov instead of Jest thresholds?**
A: Both are useful! Jest fails locally (faster feedback), CI validates (baseline check), Codecov gives visual PR feedback.

---

## Support

For questions about coverage tiers or configuration, see:
- `.coverage-tiers.json` — Current tier assignments
- `/docs/COVERAGE-QUICK-REF.md` — Quick lookup guide
- `.TEMPLATE-jest.tier1-legacy.config.ts` — Legacy package template
- `.TEMPLATE-jest.tier2-established.config.ts` — Established package template
- `.github/workflows/ci.yml` — CI validation logic
