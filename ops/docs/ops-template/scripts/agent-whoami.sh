#!/usr/bin/env bash
set -euo pipefail

# agent-whoami.sh
# Emit a consistent identity response for the active seat and branch.
# Usage:
#   PROJECT_OPS_DIR=/path/to/ops SEAT=role.name $HOME/repos/ops-template/scripts/agent-whoami.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}

if [[ -z "$PROJECT_OPS_DIR" || -z "$SEAT" ]]; then
  echo "Set PROJECT_OPS_DIR and SEAT" >&2
  exit 1
fi

ROLE=${SEAT%%.*}
BASE_REPO=$(cd "$PROJECT_OPS_DIR/.." && pwd)
SEAT_PATH=""
if [[ -x "$HOME/repos/ops-template/scripts/seat-path.sh" ]]; then
  SEAT_PATH=$(BASE_REPO="$BASE_REPO" SEAT="$SEAT" "$HOME/repos/ops-template/scripts/seat-path.sh" 2>/dev/null || true)
fi
BRANCH=""
if [[ -n "$SEAT_PATH" && -d "$SEAT_PATH/.git" ]]; then
  BRANCH=$(git -C "$SEAT_PATH" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
fi

printf "I am the %s agent (%s)." "$ROLE" "$SEAT"
if [[ -n "$BRANCH" ]]; then
  printf " On branch: %s." "$BRANCH"
fi
if [[ -n "$SEAT_PATH" ]]; then
  printf " Worktree: %s" "$SEAT_PATH"
fi
printf "\n"