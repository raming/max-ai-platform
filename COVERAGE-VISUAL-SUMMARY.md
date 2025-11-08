# Coverage Tier System - Visual Summary

## The Three-Tier Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   COVERAGE TIER SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

TIER 3: NEW CODE
═════════════════════════════════════════════════════════════════
  📊 Threshold: 95%+
  🎯 Use Case: Production-ready, new libraries, active projects
  📦 Current: client/web, client/libs/ui/editor, client/api
  ✅ Enforcement: Strict (all metrics must be ≥95%)
  
  Examples:
  - New React component libraries
  - Production API services
  - Recently refactored core modules
  
  Jest Config:
  ```typescript
  coverageThreshold: {
    global: {
      branches: 95, functions: 95, lines: 95, statements: 95
    }
  }
  ```

                            ↕️ (Promotion)
                            
TIER 2: ESTABLISHED
═════════════════════════════════════════════════════════════════
  📊 Threshold: 85-90%
  🎯 Use Case: Mature code, under active maintenance
  📦 Current: (available for future packages)
  ✅ Enforcement: Moderate (steady improvement path)
  
  Examples:
  - Existing services being actively maintained
  - Code with some legacy modules
  - Packages being refactored incrementally
  
  Jest Config:
  ```typescript
  coverageThreshold: {
    global: {
      branches: 85, functions: 88, lines: 90, statements: 90
    }
  }
  ```

                            ↕️ (Promotion)
                            
TIER 1: LEGACY
═════════════════════════════════════════════════════════════════
  📊 Threshold: 60-70%
  🎯 Use Case: Old patches, maintenance-only, future refactoring
  📦 Current: (available for legacy packages)
  ✅ Enforcement: Minimal (prevent regressions)
  
  Examples:
  - Older, rarely-changed modules
  - Maintenance-only utilities
  - Code planned for eventual refactoring
  
  Jest Config:
  ```typescript
  coverageThreshold: {
    global: {
      branches: 60, functions: 65, lines: 70, statements: 70
    }
  }
  ```

└─────────────────────────────────────────────────────────────────┘
```

## Migration Paths

```
HOW PACKAGES MOVE BETWEEN TIERS
═════════════════════════════════════════════════════════════════

Scenario 1: New Package
───────────────────────
  START → Tier 3 (95%)
  • Create new package
  • Start with 95% requirement from day 1
  • TDD ensures high coverage from beginning


Scenario 2: Legacy → Active Development
────────────────────────────────────────
  Tier 1 (60%) → Tier 2 (85%) → Tier 3 (95%)
  
  Step 1: Add tests for new features → Hit 85%
  Step 2: Refactor and test more → Hit 90%+
  Step 3: Comprehensive testing → Hit 95%
  
  Timeline: Typically 3-6 months


Scenario 3: Established → Production-Ready
───────────────────────────────────────────
  Tier 2 (85%) → Tier 3 (95%)
  
  When: Quarterly promotion review
  How: Increase tests for remaining 5-10%
  Result: Full Tier 3 coverage enforcement


Scenario 4: Temporary Exemptions
─────────────────────────────────
  Tier 3 (95%) → Tier 2 (85%) → Tier 3 (95%)
  
  Reason: Major refactoring introduces untested code
  Duration: 1-2 releases
  Recovery: Add tests and re-promote to Tier 3

```

## Team Workflow

```
┌─ DEVELOPER ───────────────────────────────────────────────────┐
│                                                                 │
│  1. Check Package Tier                                         │
│     $ cat .coverage-tiers.json | grep my-package              │
│                                                                 │
│  2. Write Tests to Meet Threshold                             │
│     $ npm run test -- --coverage                              │
│     See: coverage/coverage-summary.json                        │
│                                                                 │
│  3. If Coverage Below Tier:                                    │
│     ❌ Jest fails → Add more tests                            │
│     📝 Update untested code documentation                     │
│                                                                 │
│  4. Push PR                                                    │
│     Git push → GitHub Actions runs CI                          │
│                                                                 │
└────────────────────┬──────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                    CI/CD VALIDATION                            │
│                                                                 │
│  1. Run Tests with Coverage                                   │
│     npx jest --coverage                                        │
│                                                                 │
│  2. Parse .coverage-tiers.json                                │
│     Load tier thresholds and packages                          │
│                                                                 │
│  3. Compare Metrics                                           │
│     coverage-summary.json vs .coverage-tiers.json             │
│                                                                 │
│  4. Decision                                                   │
│     ✅ PASS: Coverage meets tier → PR allowed                 │
│     ❌ FAIL: Coverage below tier → PR blocked                 │
│                                                                 │
│  5. Feedback                                                   │
│     Display metrics, show what failed, link to docs            │
│                                                                 │
└────────────────────┬──────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                   MERGE DECISION                               │
│                                                                 │
│  ✅ Coverage PASS + Code Review PASS → Merge ✓               │
│  ❌ Coverage FAIL → Update tests → Re-push                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Organization

```
PROJECT ROOT
│
├── .coverage-tiers.json ..................... Tier registry
├── COVERAGE-TIERS.md ........................ Complete guide
├── COVERAGE-QUICK-REF.md ................... Quick lookup
├── COVERAGE-IMPLEMENTATION.md .............. Rollout checklist
├── COVERAGE-COMMIT-TEMPLATES.md ........... Git templates
│
├── .TEMPLATE-jest.tier1-legacy.config.ts .. Tier 1 template
├── .TEMPLATE-jest.tier2-established.config.ts .. Tier 2 template
│
├── .github/workflows/
│   └── ci.yml ............................. CI validation
│
└── client/
    ├── web/
    │   └── jest.config.ts ................. Tier 3 example
    │
    └── libs/ui/
        └── editor/
            └── jest.config.ts ............. Tier 3 example
```

## Coverage Metrics Dashboard

```
CURRENT TIER DISTRIBUTION
═════════════════════════════════════════════════════════════════

Tier 3 (95%+)           █████ 40%  (3 packages)
├── client/web          ✅ 98%
├── client/libs/ui/editor ✅ 97%
└── client/api          ✅ 95%

Tier 2 (85-90%)         ░░░░░  0%  (0 packages)

Tier 1 (60-70%)         ░░░░░  0%  (0 packages)

Current Status: ✅ All active packages at Tier 3
Next Review: Q1 2026 (quarterly tier promotions)
```

## Getting Started (30 seconds)

```
1. READ
   Open: COVERAGE-QUICK-REF.md (5 minutes)

2. UNDERSTAND
   Check: .coverage-tiers.json (see your package's tier)
   Review: Your package's jest.config.ts

3. RUN TESTS
   npm run test -- --coverage

4. IF FAILING
   Add tests for uncovered lines
   Check: coverage/coverage-summary.json
   Re-run tests

5. PUSH PR
   CI automatically validates coverage
   GitHub Actions shows pass/fail
```

## Key Takeaways

```
✅ DO THIS:
  • Run tests locally before pushing: npm run test -- --coverage
  • Check your package's tier in .coverage-tiers.json
  • Add tests to reach tier threshold
  • Document exemptions with rationale
  • Promote packages quarterly when ready

❌ DON'T DO THIS:
  • Skip tests to save time
  • Lower thresholds without justification
  • Commit untested code "just this once"
  • Leave coverage gaps undocumented
  • Ignore CI coverage failures
```

---

**Questions?** → Read `COVERAGE-QUICK-REF.md`  
**Need details?** → Read `COVERAGE-TIERS.md`  
**Implementing?** → Follow `COVERAGE-IMPLEMENTATION.md`  
**Git help?** → See `COVERAGE-COMMIT-TEMPLATES.md`

Last Updated: 2025-11-08
