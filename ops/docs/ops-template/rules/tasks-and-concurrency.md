# Tasks and concurrency policy (canonical)

Note: See also scope-control-and-triage.md for guardrails and required end-of-task triage.

Primary tracker
- Use the Git host issue tracker (e.g., GitHub Issues) for all tasks/bugs/epics by default.
- Do NOT create local files for tasks or bugs in the repo; local folders may contain templates only.
- Default tracker repo: ops (create issues in the ops repo by default for planning/specs/process/infrastructure and cross-functional items).
- Create issues in the client repo only for code-level defects or feature work explicitly scoped to the client codebase.

Issue conventions
- Title: <PROJECT>-<N> — <short outcome>
- Body must include: links to spec/ADRs/designs; acceptance criteria; AI story template (when applicable).
- Labels: role (team_lead/dev/qa), phase (phase-1/2/3), area (ordering/iam/lab/etc.), seat:<seat> for label-based assignment.
- Cross-links: PRs must include Fixes #<N> (client) or Refs org/hakim-platform-ops#<N> (ops).

Assignment of record
- Seat label is authoritative: use seat:<role.seat> to route work. Agents must only pick issues with their seat label.
- Readiness gate required: status:ready must be present for an agent to pick an issue. Use status:triage or status:blocked otherwise.
- Assignee optional: GH “Assignee” may be used for visibility, but agents must key off seat labels for routing.
- Comments are non-authoritative: use comments for context/instructions; do not rely on them for routing.
- Priority labels: use priority:P0, priority:P1, etc. Sorting and triage should respect these.
- Handoff: when Team Lead is done coordinating, flip seat:team_lead.<seat> -> seat:dev.<seat> and keep status:ready if applicable.

Directories (optional, for templates only)
- tracker/specs — specifications (one per tracker ID)
- tracker/tasks — leave empty (no local tasks); keep only templates if needed
- tracker/agents — agent-owned task templates or mirrors (no source of truth)

States
- todo → in-progress → needs-review → approved → done (reflect via issue labels or workflow states)

Concurrency model
- Use issues for all inter-agent communication (assignments, comments, status changes).
- Do not directly overwrite another agent’s in-progress work; request changes by reassigning or commenting.

Handoff rules
- Summarize work done, decisions, open questions, next actions.
- Link specs/ADRs/designs and PR summaries.
