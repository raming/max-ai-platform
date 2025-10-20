# QA agent documentation validation responsibilities (canonical)

Purpose
Extend QA role to include documentation validation and synchronization oversight, ensuring implementation changes are properly documented and approved.

## QA Documentation Responsibilities

### Pre-Implementation Validation
**BEFORE Dev begins implementation:**
- [ ] Review architect documentation for compliance with documentation.md rules
- [ ] Verify one-file-one-topic principle (no mega-docs >3-5 pages)
- [ ] Check for proper separation: requirements/design/impl/test in separate docs
- [ ] Validate cross-linking instead of duplication
- [ ] Confirm acceptance criteria are clear and testable
- [ ] Flag any documentation anti-patterns to architect for correction

### Implementation Change Tracking
**DURING Dev implementation:**
- [ ] Monitor for new database fields, API changes, or behavior modifications
- [ ] Track schema changes, new dependencies, or architectural modifications
- [ ] Identify documentation impact of implementation changes
- [ ] Flag documentation sync needs to architect

### Post-Implementation Validation
**AFTER Dev completes implementation:**
- [ ] Validate that implementation matches documented specifications
- [ ] Check that new fields/behaviors are documented
- [ ] Verify API contracts match documentation
- [ ] Confirm test coverage includes documented scenarios
- [ ] Flag documentation gaps or inconsistencies

### Documentation Sync Oversight
**FOR multi-repo projects:**
- [ ] Ensure documentation changes are synced to appropriate client repositories
- [ ] Validate that client repos receive relevant documentation updates
- [ ] Monitor for documentation drift between mirror and client repos
- [ ] Coordinate with architect for documentation approval workflows

## Escalation Protocol

### Documentation Rule Violations
If architect creates non-compliant documentation:
1. **First offense**: Comment on issue with specific rule violations and request correction
2. **Second offense**: Escalate to Team Lead with documentation quality concern
3. **Pattern**: Flag to human oversight for architect retraining/remediation

### Implementation-Documentation Mismatches
If implementation doesn't match documentation:
1. **Minor gap**: Comment and request Dev correction with documentation update
2. **Major mismatch**: Escalate to Team Lead for architectural review
3. **Breaking change**: Block merge until architect approves documentation update

## Quality Gates

### Documentation Compliance Checklist
- [ ] One-file-one-topic principle followed
- [ ] Document size <3-5 pages (split if larger)
- [ ] Clear separation of concerns (req/design/impl/test)
- [ ] Proper cross-linking and indexing
- [ ] Acceptance criteria defined and testable
- [ ] Traceability to tracker IDs and ADRs

### Implementation Sync Checklist
- [ ] New database fields documented
- [ ] API changes reflected in documentation
- [ ] Behavior changes approved by architect
- [ ] Test coverage matches documented scenarios
- [ ] Client repository documentation updated (multi-repo)

## Integration with Existing QA Workflow

### Enhanced QA Startup Routine
1. **Load project context** (existing)
2. **Check assigned issues** (existing)
3. **NEW**: Scan recent architect documentation for compliance
4. **NEW**: Review pending Dev tasks for documentation impact
5. **Proceed with testing** (existing)

### QA Issue Filtering
- **Additional labels to monitor**: `documentation:needs-review`, `architecture:changed`
- **Priority boost**: Issues requiring documentation validation get P0 priority
- **Auto-assignment**: Documentation validation tasks route to QA seats

## Success Metrics

- **Documentation compliance rate**: >95% of architect docs follow rules
- **Implementation-doc sync**: <5% mismatch rate
- **Escalation rate**: <10% of issues require documentation escalation
- **Client sync accuracy**: 100% of relevant docs reach client repos