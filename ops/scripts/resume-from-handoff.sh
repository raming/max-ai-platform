#!/usr/bin/env bash
set -euo pipefail

# resume-from-handoff.sh
# Guide an agent to resume from a handoff: locate worktree, sync branch, and load prompt.
# Optionally pulls the issue comment via gh to provide a brief summary.
#
# Inputs:
#   PROJECT_OPS_DIR (required)
#   SEAT           (required)
#   ISSUE          (optional; improves guidance if gh is available)
#
# Example:
#   PROJECT_OPS_DIR=$HOME/repos/max-ai/platform/ops SEAT=architect.morgan-lee ISSUE=123 \
#     docs/ops-template/scripts/resume-from-handoff.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
ISSUE=${ISSUE:-}

if [[ -z "$PROJECT_OPS_DIR" || -z "$SEAT" ]]; then
  echo "Set PROJECT_OPS_DIR and SEAT" >&2
  exit 1
fi

BASE_REPO=$(cd "$PROJECT_OPS_DIR/.." && pwd)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SEAT_PATH=$(BASE_REPO="$BASE_REPO" SEAT="$SEAT" "$SCRIPT_DIR/seat-path.sh")
BRANCH="agents/$SEAT"
ROLE=${SEAT%%.*}

# Show next actions succinctly
cat <<TXT
Resume checklist for $SEAT
1) Worktree: $SEAT_PATH
2) Branch:   $BRANCH
3) Sync:     git -C "$SEAT_PATH" fetch --all --prune && git -C "$SEAT_PATH" status && git -C "$SEAT_PATH" rev-list --count @{u}..HEAD || true
4) Load prompt:
   ROLE=$ROLE SEAT=$SEAT PROJECT_OPS_DIR=$PROJECT_OPS_DIR $HOME/repos/ops-template/scripts/copy-role-prompt.sh
TXT

# If gh and ISSUE provided, show the last comment context
if [[ -n "${ISSUE:-}" ]] && command -v gh >/dev/null 2>&1; then
  issue_ref="$ISSUE"
  if [[ "$ISSUE" == http* ]]; then
    issue_ref=$(basename "$ISSUE")
  fi
  echo "\nLatest comments (last 1):" >&2
  gh issue view "$issue_ref" --comments --limit 1 --json comments --jq '.comments[-1].body' || true
fi
