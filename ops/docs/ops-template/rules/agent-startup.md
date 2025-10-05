# Agent startup and current task pickup (canonical)

Purpose
Define a consistent startup routine so agents always resume the correct work using the Git host issue tracker.

**MANDATORY PROACTIVE BEHAVIOR**: After role initialization (copy-role-prompt.sh), agents MUST immediately execute the startup checklist without waiting for human requests.

Architect exception (interactive pickup)
- When ROLE=architect, do NOT auto-start work. On initialization:
  1) Load project context and role rules.
  2) Query assigned open issues for the architect seat (or GH_USER), sorted by recent activity.
  3) Present a concise list of assigned tasks with IDs, titles, and status, plus the most recent progress note if available.
  4) Ask the user to choose: continue last active task, pick an issue from the list, or standby.
  5) Only begin execution after the user confirms. If the user opts into "auto start" later, resume using the normal auto-pickup flow.
- Rationale: the architect is the primary human-facing role; interactive triage at session start prevents conflicts while the user is changing priorities.

Startup checklist (every session) — EXECUTE IMMEDIATELY
1) Load project context and role rules (e.g., .agents/rules/context.md and role.md if present).
2) Determine your seat (e.g., architect, team_lead, dev, sre).
3) **CHECK FOR UNFINISHED WORK**: Look for previous state checkpoints in recent issue comments or workspace cache.
4) **IMMEDIATELY** query GitHub Issues list for this project and filter:
   - assignee: <your seat or username>
   - state: open
   - sort: recently updated
5) **AUTO-SELECT** the top priority issue assigned to you and begin work. If none:
   - Ask for assignment in the appropriate planning issue, or
   - Create a triage comment on the planning issue noting you're idle and propose next actions.
6) Before making changes, ensure you are on a work branch for the current task:
   - Branch naming: work/{role}/{task-id}-{slug}
   - If not on such a branch, create it from up-to-date main: git fetch origin && git checkout -B work/{role}/{task-id}-{slug} origin/main
   - Push the branch to origin to enable PRs: git push -u origin work/{role}/{task-id}-{slug}
7) Read the linked spec/ADRs/designs from the issue body before taking action.
8) Record progress appropriately in issue comments. Do not create local task files.
   - Do not post trivial "picked up" notes.
   - Post only meaningful updates: decisions, blockers, completed sub-tasks, and handoffs. Keep comments concise.
9) **CONTINUOUS OPERATION**: Upon completing a task, immediately query for the next assigned issue.

Rules
- Source of truth for tasks: GitHub Issues (not repo files).
- Use issue comments for progress notes; link artifacts/PRs. Prefer concise, non-noisy updates.
- Follow story template and acceptance criteria from the issue body.

Quality gates
- Before moving an issue to needs-review, ensure tests meet coverage and contracts are validated per project rules.
