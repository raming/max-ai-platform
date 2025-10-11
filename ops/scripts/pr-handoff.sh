#!/usr/bin/env bash
set -euo pipefail

# pr-handoff.sh
# Standardize PR handoff by updating the originating Issue and PR with seat/status/action labels
# and a comment that tells the next owner what to do. Works with GitHub via gh CLI.
#
# Required env vars:
#   REPO           org/repo (e.g., raming/max-ai-platform)
#   ISSUE          Issue number (e.g., 73)
#   PR             PR number (e.g., 123)
#   NEXT_SEAT      seat label to route to (e.g., seat:qa.mina-li or seat:team_lead.casey-brooks)
#   NEXT_STATUS    status label reflecting next action (e.g., status:needs-qa, status:needs-review, status:awaiting-human)
#   ACTIONS        comma-separated action labels (e.g., action:qa-review or action:qa-test or action:code-review or action:human-merge)
# Optional env vars:
#   PREV_SEAT      seat label to remove (e.g., seat:dev.avery-kim)
#   REVIEWERS      comma-separated GH handles to request on PR (e.g., mina-gh,casey-gh)
#   HELP_HUMAN     help label (e.g., help:ray-gerami) when human involvement is required
#   ASSIGNEE       GH username to assign on the PR for visibility (e.g., raming)
#
# Example (QA review handoff):
#   REPO=raming/max-ai-platform ISSUE=73 PR=123 NEXT_SEAT="seat:qa.mina-li" NEXT_STATUS="status:needs-qa" \
#   ACTIONS="action:qa-review" PREV_SEAT="seat:dev.avery-kim" REVIEWERS="mina-gh" ./pr-handoff.sh

: "${REPO:?Set REPO like org/repo}"
: "${ISSUE:?Set ISSUE number}"
: "${PR:?Set PR number}"
: "${NEXT_SEAT:?Set NEXT_SEAT like seat:qa.mina-li}"
: "${NEXT_STATUS:?Set NEXT_STATUS like status:needs-qa}"
: "${ACTIONS:?Set ACTIONS like action:qa-review or comma-separated list}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required" >&2
  exit 1
fi

# Resolve PR URL for the comment
PR_URL=$(gh pr view "$PR" --repo "$REPO" --json url -q .url)

# Build action labels array
IFS=',' read -r -a ACTION_ARR <<<"${ACTIONS}"

# Issue: comment, add next seat/status/actions, remove previous seat if provided
COMMENT="PR opened: ${PR_URL} — Requesting ${ACTIONS}."

echo "Commenting on issue #$ISSUE: $COMMENT"
gh issue comment "$ISSUE" --repo "$REPO" --body "$COMMENT"

echo "Updating issue labels: +$NEXT_SEAT +$NEXT_STATUS +$ACTIONS -${PREV_SEAT:-<none>}"
ISSUE_ARGS=(issue edit "$ISSUE" --repo "$REPO" --add-label "$NEXT_SEAT" --add-label "$NEXT_STATUS")
for a in "${ACTION_ARR[@]}"; do ISSUE_ARGS+=(--add-label "$a"); done
if [[ -n "${PREV_SEAT:-}" ]]; then ISSUE_ARGS+=(--remove-label "$PREV_SEAT"); fi
if [[ -n "${HELP_HUMAN:-}" ]]; then ISSUE_ARGS+=(--add-label "$HELP_HUMAN"); fi

# shellcheck disable=SC2068
gh ${ISSUE_ARGS[@]}

# PR: add labels and reviewers; optional assignee
echo "Updating PR labels: +$NEXT_SEAT +$NEXT_STATUS +$ACTIONS"
PR_ARGS=(pr edit "$PR" --repo "$REPO" --add-label "$NEXT_SEAT" --add-label "$NEXT_STATUS")
for a in "${ACTION_ARR[@]}"; do PR_ARGS+=(--add-label "$a"); done
if [[ -n "${HELP_HUMAN:-}" ]]; then PR_ARGS+=(--add-label "$HELP_HUMAN"); fi
# shellcheck disable=SC2068
gh ${PR_ARGS[@]}

if [[ -n "${REVIEWERS:-}" ]]; then
  IFS=',' read -r -a RARR <<<"${REVIEWERS}"
  for r in "${RARR[@]}"; do gh pr edit "$PR" --repo "$REPO" --add-reviewer "$r" || true; done
fi

if [[ -n "${ASSIGNEE:-}" ]]; then
  gh pr edit "$PR" --repo "$REPO" --add-assignee "$ASSIGNEE" || true
fi

echo "PR handoff complete."