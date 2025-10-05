# AI-agent conventions (canonical)

Purpose
Standardize how Warp agents generate consistent code and documentation across sessions and among multiple agents.

Key rules
- Story spec template: every story must state inputs/outputs, ports, error handling, observability/audit, flags, and test plan.
- Contracts: validate adapter I/O against JSON Schemas at runtime (non-prod) and in CI contract tests.
- Coverage: enforce ≥95% line/branch coverage.
- Linting: produce lint-clean code; ESLint warnings are treated as errors in CI (--max-warnings 0). Use targeted rule disables only with justification and an issue link.
- Ports/adapters only: domain/services depend on ports; DB access limited to repository adapters; no inline SQL.
- Observability/audit: structured logs/metrics/traces with correlation IDs; audit sensitive actions.
- Security/compliance: RBAC guards; no PHI/secrets in logs; consent/PCI constraints respected.
- DB portability: follow project portability policy; ANSI-first queries; document vendor fallbacks.

Agent task continuity
- Persist in-flight steps as agent-owned tasks so progress survives tab/session changes.
- Directories (recommended):
  - tracker/agents/ — agent-owned tasks
  - tracker/tasks/ — human-owned tasks
- States: todo → in-progress → needs-review → approved → done

Assignment routing
- If GH_USER is set for the seat: filter issues by assignee: GH_USER.
- If GH_USER is not set: filter issues by label: seat:<seat> (label-based routing).

Multi-agent concurrency
- Separate tabs/sessions per agent; all coordination via tasks (assignment/status/comments).
- Tasks can move between agents until approved for next stage (design → impl → QA).
- Separation of duties for code: authorship and review occur in different seats; see rules/agent-code-review.md.

Startup routine
- **MANDATORY**: Follow the agent-startup checklist immediately after role initialization
- **AUTO-EXECUTE**: Query GitHub Issues and begin work without waiting for human requests
- **CONTINUOUS**: Follow task-completion-workflows.md for automated handoffs

Batch processing
- Default batch size: work on up to 5 open issues assigned to your seat at a time (by label seat:<seat> or assignee). When you finish one, immediately query GitHub Issues for the next ready task. If you have fewer than 5, poll periodically (e.g., every 15–30 minutes) for new assigned tasks.

Escalation protocol (asking humans)
- If blocked or needing clarification:
  - Move the issue to needs-review and add label: help:needed and (optionally) blocked.
  - Add a comment describing the question and tag a human by label (human:<name>) and/or @mention if applicable.
  - If no response within the expected SLA window, escalate to Team Lead (seat:team_lead.*) with a comment.

Default repos
- Docs and tracking default to the ops repo: open issues in ops unless a story explicitly targets the client codebase.
- For client-only bugs/features, open issues in the client repo and cross-link the spec.

Branching & PRs
- Agents must not push to main; use work/{role}/{task-id}-{slug} and open PRs.
- Humans merge PRs for now; when confidence improves, Release Manager may be delegated merge authority.

Bug reporting protocol
- For process/infrastructure/template bugs, open a new issue in the ops repo (labels: area:process or area:ops-template, help:needed if human input required) rather than commenting on an unrelated task.
- Cross-link any blocked task and add blocked label there.

References (canonical rules)
- rules/agent-startup.md (mandatory startup behavior)
- rules/agent-autonomy.md (command approval policies)
- rules/task-completion-workflows.md (automated handoffs)
- rules/coding-standards.md (build/test automation)
- rules/escalation-decision-matrix.md (smart escalation guidelines)
- rules/human-input-management.md (systematic input capture and triage)
- rules/agent-state-management.md (work persistence and recovery across interruptions)
- design/engineering/ai-agent-conventions.md (project-specific)
- docs/adr/* (DB portability policy)
- docs/design/adapter-contracts.md (JSON Schemas)
