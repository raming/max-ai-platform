#!/usr/bin/env bash
set -euo pipefail

# auto-merge-prs.sh
# Attempt to merge origin/main into every open PR branch (locally) and report conflicts.
# Requires: git, gh
# Usage:
#   ./scripts/auto-merge-prs.sh            # dry-run, creates reports in ./scripts/pr-merge-reports/
#   PUSH=true ./scripts/auto-merge-prs.sh  # will push successful merges to their PR branch's remote
# Notes:
# - The script will not attempt automatic conflict resolution. It will collect conflict file lists
#   per PR into ./scripts/pr-merge-reports/pr-<number>-conflicts.txt for manual resolution.
# - Set SKIP_PR_NUMS to a space-separated list of PR numbers to skip.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/scripts/pr-merge-reports"
mkdir -p "$REPORT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required. Please install git (xcode-select --install or brew install git)" >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) is required. Install it: https://cli.github.com/" >&2
  exit 1
fi

PUSH=${PUSH:-false}
SKIP_PR_NUMS=${SKIP_PR_NUMS:-}

echo "Fetching origin..."
git fetch origin --prune

echo "Listing open PRs..."
PRS=$(gh pr list --state open --json number --jq '.[].number')
if [[ -z "$PRS" ]]; then
  echo "No open PRs found."; exit 0
fi

for num in $PRS; do
  if [[ -n "$SKIP_PR_NUMS" ]]; then
    for s in $SKIP_PR_NUMS; do
      if [[ "$s" == "$num" ]]; then
        echo "Skipping PR #$num"; continue 2
      fi
    done
  fi

  echo "Processing PR #$num"
  # Checkout PR locally
  if ! gh pr checkout "$num" >/dev/null 2>&1; then
    echo "  failed to checkout PR #$num (skipping)"; continue
  fi

  branch=$(git rev-parse --abbrev-ref HEAD)
  echo "  on branch $branch"

  # Ensure up-to-date
  git pull --rebase origin "$branch" || true

  # Try merging origin/main
  set +e
  git merge origin/main --no-edit
  MERGE_EXIT=$?
  set -e

  if [[ $MERGE_EXIT -eq 0 ]]; then
    echo "  merge succeeded for PR #$num"
    if [[ "$PUSH" == "true" ]]; then
      echo "  pushing merged branch to origin/$branch"
      git push origin HEAD
    fi
    echo "PR #$num: merge-ok" > "$REPORT_DIR/pr-${num}.txt"
  else
    echo "  merge conflicts detected for PR #$num"
    # list conflicted files
    git diff --name-only --diff-filter=U > "$REPORT_DIR/pr-${num}-conflicts.txt" || true
    git status --porcelain > "$REPORT_DIR/pr-${num}-status.txt" || true
    echo "PR #$num: conflicts -> $REPORT_DIR/pr-${num}-conflicts.txt" > "$REPORT_DIR/pr-${num}.txt"
    # abort the merge to leave the branch in a clean state (user can re-checkout for manual work)
    git merge --abort || true
  fi

  # return to main (safe default)
  git checkout - >/dev/null 2>&1 || git checkout main || true
done

echo "Reports written to $REPORT_DIR"
echo "For PRs with conflicts, open the corresponding pr-<num>-conflicts.txt and share the list; I will prepare exact patches to resolve them." 
