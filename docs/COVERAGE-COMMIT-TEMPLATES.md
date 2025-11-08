# Coverage-Related Commit Message Templates

Use these templates when committing coverage-related changes:

## Promoting Package to New Tier

```
refactor: promote {package-name} to Tier {new-tier}

Coverage: {old-threshold}% → {new-threshold}%

Changelog:
- Updated jest.config.ts with new thresholds
- Updated .coverage-tiers.json tier classification
- All code paths now comprehensively tested
- Ready for production standard: 95%+ coverage

Metrics:
- Lines:      X% → Y%
- Statements: X% → Y%
- Functions:  X% → Y%
- Branches:   X% → Y%

Related issues: fixes #123 (tracking issue for coverage improvement)
```

## Adding Tests for Coverage Gap

```
test: improve {package} coverage from X% to Y%

Added {N} new test cases covering:
- Edge case: {description}
- Error scenario: {description}
- Integration path: {description}

Coverage metrics:
- Lines:      X% → Y%
- Branches:   X% → Y%

All changes meet Tier {tier} threshold ({threshold}%+)
```

## Upgrading Jest Config for New Package

```
build: configure {package} with Tier {tier} coverage enforcement

- Created jest.config.ts with {threshold}% thresholds
- Configured collectCoverageFrom for accuracy
- Updated .coverage-tiers.json registry
- CI will enforce coverage on all future commits

Coverage target: {threshold}% (Tier {tier} standard)
```

## Exempting Legacy Code (Temporary)

```
refactor: exempt legacy module during modernization

Package: {package}
Module: {module-path}
Tier: {tier} (coverage: {threshold}%)

Rationale:
- [Explain why this module is exempted]
- [Link to refactoring issue]

Plan to re-integrate:
- Issue: #{issue-number}
- Timeline: {description}

All new code in this package still meets tier threshold.
```

## Removing Coverage Exemption

```
refactor: remove coverage exemption from {module}

Exemption removed from: {module-path}
New coverage: X%

All code now integrated into global Tier {tier} threshold ({threshold}%+)

Related: fixes #{issue-number}
```

## Creating New Jest Config Template

```
docs: add Tier {tier} jest config template

Added: .TEMPLATE-jest.tier{tier}-{description}.config.ts

Template includes:
- Correct coverage thresholds for Tier {tier}
- collectCoverageFrom configuration
- Per-file exemption examples (commented out)
- Migration path documentation

Usage:
1. Copy template to your-package/jest.config.ts
2. Update package name and paths
3. Add to .coverage-tiers.json
4. Run: npm run test -- --coverage
```

## Updating Coverage Registry

```
docs: update .coverage-tiers.json

Changes:
- Promoted {package-1} from Tier 1 → Tier 2
- Added {package-2} to Tier 3 (new package)
- Updated threshold for {package-3}
- Documented migration path for {package-4}

Quarterly Review: {date}

Current distribution:
- Tier 3 (95%+):   {count} packages
- Tier 2 (85-90%): {count} packages
- Tier 1 (60-70%): {count} packages
```

## CI/CD Configuration Update

```
ci: enhance coverage validation in GitHub Actions

Changes:
- Added "Validate coverage meets tier requirements" step
- Parses .coverage-tiers.json for per-tier thresholds
- Compares against global metrics
- Provides clear remediation steps on failure

Behavior:
- ✅ Pass: All packages meet their tier threshold
- ❌ Fail: Any package below tier threshold (blocks merge)

Related: {issue-or-pr}
```

---

## Quick Reference

### When committing test additions:
```
test: improve X coverage to 95%
```

### When promoting a package:
```
refactor: promote X to Tier 3 (95% coverage)
```

### When updating configs:
```
build: update Tier configuration
```

### When adding exemptions:
```
refactor: exempt legacy code during modernization
```

### When documenting:
```
docs: update COVERAGE-TIERS.md
```

---

**Tip:** Reference the related issue/task in every coverage commit. Makes it easy to track why changes were made.

Last Updated: 2025-11-08
