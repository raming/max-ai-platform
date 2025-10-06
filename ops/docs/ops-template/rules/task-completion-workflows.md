# Task completion workflows (canonical)

Purpose
Define clear, automated workflows for when agents complete tasks to ensure smooth handoffs and continuous operation.

Note: See also scope-control-and-triage.md for scope guardrails and end-of-task triage requirements.

## Completion States & Actions

### Developer Task Completion
When a dev completes implementation:
1. Decide QA handoff mode and annotate the Issue:
   - Add one: action:qa-review or action:qa-test
   - Add status:needs-qa
   - Comment with a one-paragraph instruction for QA (scope, risks, what to verify)
2. **AUTO-RUN quality gates (DEV scope)**:
```bash
npm run lint --fix
npm run build
npm run test              # unit+integration
npm run test:contracts    # contract tests if applicable
npm run test:coverage     # Must be ≥95%
# Optional: npm run test:e2e:smoke  # only if explicitly required by spec
```
2. **AUTO-COMMIT** if all gates pass:
```bash
git add .
git commit -m "feat(area): HAKIM-N short description"
git push origin work/dev/HAKIM-N-slug
```
3. **AUTO-CREATE PR** linking to issue and spec
4. **AUTO-TRANSITION** issue state to status:needs-qa with comment: "✅ Dev complete — ready for QA"
5. **AUTO-REASSIGN** to QA seat and keep role:qa label for routing
6. **IMMEDIATELY** query for next assigned issue

### QA Task Completion
When QA completes testing:
1. **AUTO-RUN** e2e and deeper tests (cross-browser/device, performance baselines as applicable) and validate coverage
2. **AUTO-UPDATE** issue with test results
3. **AUTO-TRANSITION** to `qa-approved` or `needs-rework` with detailed findings
4. **AUTO-REASSIGN** based on outcome:
   - Success: to `role:release_manager`
   - Issues found (implementation defects): back to the ORIGINAL Dev seat with findings
     - Add labels: `status:needs-dev-fix`, `blocked`
     - Ensure seat label `seat:dev.<seat>` is present or add it if missing
   - Issues found (design/spec gaps): reassign to Architect with explicit questions and links to spec/ADRs
     - Add labels: `type:design`, `help:architect`, `blocked`
   - Issues found (process/planning): reassign to Team Lead with clear ask (planning/coordination)
     - Add labels: `type:process`, `help:team-lead`
5. **IMMEDIATELY** query for next assigned issue

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

## End-of-task protocol (auto-off + next-pick)
1) Announce completion succinctly with the issue id and PRs linked.
2) If there are follow-up actions clearly assigned to you (e.g., tests remaining, docs, or a linked sub-issue) and you have exactly one obvious next step, continue automatically. Do not wait for human input.
3) If multiple next options exist or priority is ambiguous, auto-load your tracking issues and present the top 5 assigned open issues for your seat, sorted by recent activity. Ask the user to choose, defaulting to the most recently updated.
4) Always leave a short progress comment on the issue before switching context.

### Quick commands
- Show my issues (ready for my seat):
  PROJECT_OPS_DIR=<ops> SEAT=<role.name> READINESS_LABEL="status:ready" $HOME/repos/ops-template/scripts/list-issues.sh
- Auto next (continue if only one obvious option, else present choices):
  PROJECT_OPS_DIR=<ops> SEAT=<role.name> READINESS_LABEL="status:ready" $HOME/repos/ops-template/scripts/auto-next.sh
- Reload seat prompt:
  PROJECT_OPS_DIR=<ops> SEAT=<role.name> $HOME/repos/ops-template/scripts/reload-seat.sh
