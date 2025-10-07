#!/usr/bin/env bash
set -euo pipefail

# agent-progress.sh
# Persist and restore agent progress in a non-interactive, durable way.
# - Writes workspace cache: $PROJECT_OPS_DIR/.agents/workspaces/$SEAT/current-state.json
# - Optionally posts issue comments via gh (if ISSUE set and gh configured)
#
# Usage:
#   SEAT=<role.seat> PROJECT_OPS_DIR=<ops_dir> ISSUE=<N?> agent-progress.sh start --title "..." --focus "..." [--branch "..."]
#   SEAT=<role.seat> PROJECT_OPS_DIR=<ops_dir> ISSUE=<N?> agent-progress.sh save  --note  "..." [--focus "..."]
#   SEAT=<role.seat> PROJECT_OPS_DIR=<ops_dir> ISSUE=<N?> agent-progress.sh done  --note  "..."
#   SEAT=<role.seat> PROJECT_OPS_DIR=<ops_dir>                              agent-progress.sh show
#   SEAT=<role.seat> PROJECT_OPS_DIR=<ops_dir>                              agent-progress.sh clear
#
# Notes:
# - Requires SEAT and PROJECT_OPS_DIR env vars
# - ISSUE is optional; if set and gh CLI is available, a comment will be posted

command="${1:-}"
shift || true

if [[ -z "${SEAT:-}" ]]; then
  echo "SEAT is required (e.g., dev.avery-kim, qa.mina-li, ops.template)" >&2
  exit 1
fi

PROJECT_OPS_DIR="${PROJECT_OPS_DIR:-}" 
if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "PROJECT_OPS_DIR is required (path to project ops repo)" >&2
  exit 1
fi

TS() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

STATE_DIR="$PROJECT_OPS_DIR/.agents/workspaces/$SEAT"
STATE_FILE="$STATE_DIR/current-state.json"
mkdir -p "$STATE_DIR"

has_gh=0
if command -v gh >/dev/null 2>&1; then
  has_gh=1
fi

post_comment() {
  local body="$1"
  if [[ -n "${ISSUE:-}" && $has_gh -eq 1 ]]; then
    # Do not echo tokens; rely on gh configuration.
    gh issue comment "$ISSUE" --body "$body" || true
  fi
}

write_state() {
  local title="$1"; shift || true
  local focus="$1"; shift || true
  local note="${1:-}"; shift || true
  local status="${1:-in_progress}"; shift || true
  local branch_name="${1:-}"; shift || true

  local now
  now="$(TS)"

  cat >"$STATE_FILE" <<JSON
{
  "agent_seat": "${SEAT}",
  "task_issue_number": ${ISSUE:-0},
  "task_title": "${title}",
  "status": "${status}",
  "started_at": "${now}",
  "last_updated": "${now}",
  "current_focus": "${focus}",
  "last_note": "${note}",
  "branch_name": "${branch_name}"
}
JSON
}

show_state() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  else
    echo "No current state for $SEAT" >&2
    return 1
  fi
}

clear_state() {
  rm -f "$STATE_FILE"
}

# Parse args for subcommands
TITLE=""; FOCUS=""; NOTE=""; BRANCH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)  TITLE="$2"; shift 2;;
    --focus)  FOCUS="$2"; shift 2;;
    --note)   NOTE="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

case "$command" in
  start)
    write_state "$TITLE" "$FOCUS" "$NOTE" "in_progress" "$BRANCH"
    post_comment "🔄 AGENT STATE CHECKPOINT — ${SEAT} — $(TS)

Task: #${ISSUE:-0}
Progress: starting
Current Focus: ${FOCUS}
Next Steps:
- [ ] ${NOTE}
"
    ;;
  save)
    # Overwrite with updated last_updated + note/focus
    write_state "$TITLE" "$FOCUS" "$NOTE" "in_progress" "$BRANCH"
    post_comment "🔄 AGENT STATE CHECKPOINT — ${SEAT} — $(TS)

Task: #${ISSUE:-0}
Progress: ${NOTE}
Current Focus: ${FOCUS}
"
    ;;
  done)
    write_state "$TITLE" "$FOCUS" "$NOTE" "completed" "$BRANCH"
    post_comment "✅ AGENT STATE CLEARED — ${SEAT} — $(TS)

Task: #${ISSUE:-0}
Status: COMPLETED
Note: ${NOTE}
Next: Ready for next assignment
"
    ;;
  show)
    show_state
    ;;
  clear)
    clear_state
    ;;
  *)
    echo "Usage: SEAT=<seat> PROJECT_OPS_DIR=<ops_dir> [ISSUE=<N>] $0 <start|save|done|show|clear> [--title ...] [--focus ...] [--note ...] [--branch ...]" >&2
    exit 2
    ;;
fi
