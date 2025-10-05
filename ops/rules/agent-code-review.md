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

Queries (human triage examples)
- High priority first:
  gh pr list -R <org>/<repo> --search 'is:open label:"priority:P0"' --limit 100
- Current sprint:
  gh pr list -R <org>/<repo> --search 'is:open label:"sprint:2025-09-29"' --limit 100

Constraints
- No self-approval: author seat cannot act as reviewer.
- Escalate to human when Coder and Reviewer disagree after 2 iterations.
- All discussion and decisions must be recorded on the PR.
