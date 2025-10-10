# Agent code review (canonical multi-agent)

Purpose
Reduce single-agent blind spots by separating authorship (Coder) and review (Reviewer) across different seats and, optionally, different model profiles.

Principles
- Separation of duties: the author seat may not approve their own PR.
- Reviewer independence: prefer a different agent seat and, when available, a different model profile.
- PR-first: all changes land via PRs; comments and decisions live on the PR.
- Human override: unresolved disagreements escalate to a human decider.

Roles
- Coder (seat: dev.*): implements changes on a work/{role}/{task-id}-{slug} branch.
- Reviewer (seat: dev.*-reviewer or qa.*): reviews code changes, tests, and risk.

Workflow
1) Coder
   - Implement on a feature branch: work/dev/{TASK}-{slug}
   - Ensure local checks pass (lint, type, unit/integration, contracts, basic SAST)
   - Open a PR with labels:
     - role:dev
     - priority:{P0|P1|P2|P3}
     - sprint:{sprint-YYYY-WW or sprint-N}
     - area:{domain}
   - Link the task issue (Fixes #<N>) and relevant spec/ADR.
   - Handoff via Issue: add one of the QA action labels and a short instruction comment, then reassign to QA seat:
     - action:qa-review — focus on code review (checklist, contracts, risks)
     - action:qa-test   — focus on detailed test execution and results
     - status:needs-qa  — mark issue state pending QA
2) Reviewer (QA or dedicated reviewer seat)
   - Must be a different seat than the author. Prefer a different model profile.
   - Follow the instruction from the Issue (qa-review vs qa-test). If unspecified, do code review plus smoke tests.
   - Run the Code Review Checklist (below).
   - Request changes or Approve with summary, risks, and verification steps.
   - If materially disagree with spec/architecture, escalate to Architect or TL.
3) Merge
   - For now: human merges once CI is green and review is complete.
   - Future: Release Manager can be delegated to merge once confidence is high.

Code Review Checklist
- Scope & diff size: small, focused PR; no unrelated changes
- Tests: added/updated; coverage maintained (≥95% for code PRs)
- Contracts: public interfaces and adapters validated; no breaking changes without versioning
- Lint & type: zero warnings policy enforced; no new warnings
- Security: basic SAST/dependency scan issues acknowledged or fixed
- Observability: logs/metrics added or unchanged appropriately
- Rollback plan: changes can be rolled back if needed
- Docs/spec: PR links to spec/ADR; README/configs updated when relevant

Model diversity (optional)
- Configure coder vs reviewer seats to use different LLM profiles where available to diversify reasoning styles.
- Examples: coder → fast coding-tuned model; reviewer → more cautious reasoning model.

Labels & triage
- priority:{P0,P1,P2,P3}: P0 = urgent; P3 = lowest
- sprint:{sprint-YYYY-WW} or sprint:{sprint-N}
- Agents MUST apply priority and sprint labels to enable human triage.
- Review routing (authoritative, on Issue and PR):
  - action:qa-review or action:qa-test → seat:qa.<seat>, status:needs-qa
  - action:code-review → seat:team_lead.<seat> (or peer dev), status:needs-review
  - action:human-merge → status:awaiting-human + help:<human-label> (e.g., help:ray-gerami); agents do not proceed until cleared

Handoff helper
- Use pr-handoff.sh to update the Issue and PR after opening the PR:
```
REPO=<org>/<repo> ISSUE=<N> PR=<PR#> NEXT_SEAT=<seat:...> NEXT_STATUS=<status:...> ACTIONS="action:..." \
$HOME/repos/ops-template/scripts/pr-handoff.sh
```

Queries (human triage examples)
- High priority first:
  gh pr list -R <org>/<repo> --search 'is:open label:"priority:P0"' --limit 100
- Current sprint:
  gh pr list -R <org>/<repo> --search 'is:open label:"sprint:2025-09-29"' --limit 100

Constraints
- No self-approval: author seat cannot act as reviewer.
- Escalate to human when Coder and Reviewer disagree after 2 iterations.
- All discussion and decisions must be recorded on the PR.

## PR Readiness & Merge Etiquette

### PR Readiness Checklist (author)
- CI: All required checks are green (lint, type, unit/integration, contracts, basic SAST)
- Tests: Added/updated; coverage not reduced (≥95% for code PRs unless explicitly waived)
- **Architecture**: Implementation follows layer separation (UI/presentation, business logic, data access); no mixing of concerns
- Scope: Single-purpose PR, small diff size, no unrelated changes or noisy formatting
- Security: Address high/critical SAST or dependency alerts or document deferrals
- Docs: README/configs/spec/ADR updated; migration notes included if needed
- Labels: priority:{P0–P3}, sprint:{…}, area:{…}; action:qa-review or action:qa-test set for handoff
- Links: Issue reference (Fixes #N) and spec/ADR links
- Title: Clear, action-oriented; use Conventional Commit style when appropriate (e.g., feat:, fix:, chore:)

### Review Hygiene (reviewer and author)
- Keep feedback actionable and scoped to the PR intent
- Resolve discussions explicitly; re-request review after updates
- Avoid force-push that invalidates review context; if needed, summarize changes
- Escalate after 2 back-and-forth iterations if fundamental disagreement persists

### Merge Strategy
- Default: Squash merge with a clean summary and co-authors when applicable
- History sensitivity:
  - Use squash for most feature/fix PRs
  - Consider merge-commit for large/stacked changes where commit history adds value
- Preconditions:
  - Green CI, required approvals from a different seat (no self-approval)
  - Branch in sync with base (rebase or merge base if behind/conflicts)
- Rebase policy: Prefer rebase onto main for linear history; if risky, merge base into PR with a clear “sync with main” commit
- Self-merge: Disallowed for authors; must be completed by a different seat or designated Release Manager

### Post-Merge Actions
- Auto-close issues with “Fixes #N”; verify linked issues closed
- Delete the remote branch after merge (local optional)
- Update CHANGELOG/release notes if the repo requires them; tag if part of a release cut
- Backports: Apply backport labels or create follow-up issues as needed

### PR Size Guidance
- Target < ~400 LoC changed (excluding vendored/generated); split large PRs when feasible
- For stacked changes, clearly link parent/child PRs and note dependencies in the description
