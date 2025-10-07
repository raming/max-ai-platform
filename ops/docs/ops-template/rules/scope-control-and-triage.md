# Scope Control and End-of-Task Triage

Purpose: ensure agents surface important gaps without scope creep, and always check assigned work before picking up anything new.

## Scope Guardrails

- Single confirmation: If you identify gaps outside the current task scope, list them once as “Proposed follow-ups” with a short rationale. Ask once whether to add or update the original tracker. If declined, do not revisit during this task.
- Cap suggestions: List at most three follow-ups per task unless explicitly approved for more.
- No chains: Do not create additional follow-ups derived from previous suggestions unless explicitly approved.
- Default repository: File follow-ups in the ops repository by default. Only file in a client repo for code-level defects or features explicitly scoped to client implementation.

## End-of-Task Triage (Required)

Before starting any new work, and immediately after finishing a task:

1) Summarize what was done.
2) Present “Proposed follow-ups” (if any) and ask once about filing them.
3) Run assigned-issues triage for the current seat.

Standard triage command (seat label routing):

```
PROJECT_OPS_DIR=<client_ops_dir> SEAT=<role.seat> "$HOME"/repos/ops-template/scripts/list-issues.sh
```

Examples:

Hakim Platform ops:
```
PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops SEAT=dev.avery-kim READINESS_LABEL="status:ready" $HOME/repos/ops-template/scripts/list-issues.sh
```

MaxAI Platform ops:
```
PROJECT_OPS_DIR=$HOME/repos/max-ai/platform/ops SEAT=dev.avery-kim READINESS_LABEL="status:ready" $HOME/repos/ops-template/scripts/list-issues.sh
```

Optional assignee routing (use when organization prefers assignee-based triage):
```
PROJECT_OPS_DIR=<client_ops_dir> GH_USER=<github_username> "$HOME"/repos/ops-template/scripts/list-issues.sh
```

## Communication Protocol

- During a task: propose follow-ups once, then proceed. Do not implement without approval.
- At task end: ask whether to switch to any P0/P1/high-priority item assigned to this seat. If yes, switch. Otherwise, await explicit instruction.

## Labels and Priority

- Priority labels should use the `priority:` prefix (e.g., `priority:P0`, `priority:P1`).
- The triage script derives `P#` from labels and sorts by priority, then by recent updates.
- Blocked items are excluded by default; set `INCLUDE_BLOCKED=true` to include them.
