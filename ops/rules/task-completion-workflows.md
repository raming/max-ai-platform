# Task completion workflows (canonical)

Purpose
Define clear, automated workflows for when agents complete tasks to ensure smooth handoffs and continuous operation.

## Completion States & Actions

### Developer Task Completion
When a dev completes implementation:
1. Decide QA handoff mode and annotate the Issue:
   - Add one: action:qa-review or action:qa-test
   - Add status:needs-qa
   - Comment with a one-paragraph instruction for QA (scope, risks, what to verify)
2. Ensure IAM DoR gates are present on affected endpoints:
   - OIDC token verification using Keycloak discovery/JWKS
   - Casbin authorization checks for protected resources
   - JSON Schema contracts referenced and tests added
   - Structured logs + audit events for sensitive actions
3. **AUTO-RUN quality gates**:
```bash
npm run lint --fix
npm run build
npm run test
npm run test:coverage  # Must be ≥95%
```
4. **AUTO-COMMIT** if all gates pass:
```bash
git add .
git commit -m "feat(area): HAKIM-N short description"
git push origin work/dev/HAKIM-N-slug
```
5. **AUTO-CREATE PR** linking to issue and spec
6. **AUTO-TRANSITION** issue state to status:needs-qa with comment: "Dev complete — ready for QA"
7. **AUTO-REASSIGN** to QA seat and keep role:qa label for routing
8. **IMMEDIATELY** query for next assigned issue

### Architect Task Completion  
When architect completes spec/design:
1. **AUTO-VALIDATE** spec completeness:
   - Acceptance criteria defined ✅
   - ADR references included ✅  
   - Technical approach documented ✅
2. **AUTO-COMMIT** spec changes to ops repo
3. **AUTO-TRANSITION** issue to `spec-ready` 
4. **AUTO-NOTIFY** team lead: "✅ Spec ready - definition of ready approved"
5. **IMMEDIATELY** query for next assigned issue

### QA Task Completion
When QA completes testing:
1. **AUTO-RUN** test suites and validate coverage
2. **AUTO-UPDATE** issue with test results
3. **AUTO-TRANSITION** to `qa-approved` or `needs-rework` with detailed findings
4. **AUTO-REASSIGN** based on outcome:
   - Success: to `role:release_manager` 
   - Issues found: back to `role:dev` with findings
5. **IMMEDIATELY** query for next assigned issue

### Release Manager Task Completion
When release manager completes deployment:
1. **AUTO-VALIDATE** deployment success
2. **AUTO-UPDATE** changelog and release notes  
3. **AUTO-CLOSE** linked issues with "✅ Released in v1.x.x"
4. **AUTO-TAG** release in git
5. **IMMEDIATELY** query for next assigned issue

## Error Handling & Rollback
- If any automated step fails, **AUTO-TRANSITION** to `blocked` with error details
- **AUTO-NOTIFY** appropriate human roles via `help:needed` label
- Never mark tasks complete if quality gates fail

## Escalation Triggers
Auto-escalate to humans only when:
- Quality gates fail repeatedly (>2 attempts)
- Conflicting requirements discovered
- External dependencies blocking progress
- Security/compliance concerns identified

## Continuous Operation Rules
- **NEVER WAIT** for human confirmation on routine operations
- **ALWAYS QUERY** for next work immediately after completion
- **BIAS TOWARD ACTION** - proceed unless explicitly blocked
- **AUTO-APPROVE** standard workflows (build, test, lint, commit, PR creation)