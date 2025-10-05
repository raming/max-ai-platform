#!/usr/bin/env bash
set -euo pipefail

# seat-path.sh
# Resolve the filesystem path of a seat's worktree by parsing `git worktree list`.
# Usage:
#   BASE_REPO=/path/to/repo SEAT=role.name ./seat-path.sh
# Prints the path on stdout.

BASE_REPO=${BASE_REPO:-}
SEAT=${SEAT:-}

if [[ -z "$BASE_REPO" || -z "$SEAT" ]]; then
  echo "Set BASE_REPO and SEAT" >&2
  exit 1
fi

# Find a worktree path that corresponds to branch agents/<seat>
branch="agents/$SEAT"
if ! git -C "$BASE_REPO" rev-parse --verify --quiet "refs/heads/$branch" >/dev/null; then
  # Branch may still be present as a linked worktree even if local ref missing; continue
  :
fi

# Parse porcelain output for robustness
path=$(git -C "$BASE_REPO" worktree list --porcelain | awk -v b="[$]branch" '
  $1=="worktree" { wt=$2 }
  $1=="branch" && $2==b { print wt }
')

if [[ -z "${path:-}" ]]; then
  # Fallback: grep non-porcelain list
  path=$(git -C "$BASE_REPO" worktree list | awk -v b="[$]branch" '$NF ~ "\[" b "\]" { print $1 }')
fi

if [[ -z "${path:-}" ]]; then
  echo "Seat worktree not found for $SEAT (branch $branch)" >&2
  exit 2
fi

printf "%s\n" "$path"
