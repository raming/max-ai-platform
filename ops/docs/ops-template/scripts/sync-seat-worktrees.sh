#!/usr/bin/env bash
set -euo pipefail

# sync-seat-worktrees.sh
# Rebase (or fast-forward merge) all seat worktree branches onto origin/main for a repo.
# Usage:
#   BASE_REPO=/path/to/repo [MODE=rebase|ff] $HOME/repos/ops-template/scripts/sync-seat-worktrees.sh
# Default MODE=rebase.

BASE_REPO=${BASE_REPO:-}
MODE=${MODE:-rebase}

if [[ -z "$BASE_REPO" ]]; then
  echo "Set BASE_REPO to the repository root" >&2
  exit 1
fi

if [[ "$MODE" != "rebase" && "$MODE" != "ff" ]]; then
  echo "MODE must be rebase or ff" >&2
  exit 1
fi

echo "Syncing seat worktrees in $BASE_REPO (mode=$MODE)"

# Parse porcelain list to find worktrees on agents/* branches
mapfile -t entries < <(git -C "$BASE_REPO" worktree list --porcelain | awk '
  $1=="worktree" { wt=$2 }
  $1=="branch" && $2 ~ /^refs\/heads\/agents\// { print wt " " $2 }
')

if (( ${#entries[@]} == 0 )); then
  echo "No agents/* worktrees found."
  exit 0
fi

git -C "$BASE_REPO" fetch origin --prune

for line in "${entries[@]}"; do
  wt=${line%% *}
  ref=${line##* }
  br=${ref#refs/heads/}
  echo "-- $wt ($br)"
  if [[ ! -d "$wt/.git" ]]; then
    echo "   skipped (missing .git)"
    continue
  fi
  if [[ "$MODE" == "rebase" ]]; then
    git -C "$wt" rebase origin/main || {
      echo "   rebase conflict; resolve manually and rerun";
      continue;
    }
  else
    git -C "$wt" merge --ff-only origin/main || {
      echo "   not fast-forwardable; consider rebase";
      continue;
    }
  fi
  echo "   synced"
done
