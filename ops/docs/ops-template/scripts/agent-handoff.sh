#!/usr/bin/env bash
set -euo pipefail

# agent-handoff.sh
# Snapshot current work, push (best effort), and generate an issue handoff comment.
# Copies the comment to clipboard; optionally posts via GitHub CLI if ISSUE is provided.
#
# Inputs:
#   PROJECT_OPS_DIR  (required)  e.g., /Users/me/repos/project/ops
#   FROM_SEAT        (required)  e.g., dev.avery-kim
#   TO_SEAT          (required)  e.g., architect.morgan-lee
#   ISSUE            (optional)  issue number or full URL (if gh installed)
#   STATUS_BRIEF     (optional)  1-2 line summary
#   REQUEST          (optional)  explicit ask for receiver
#
# Example:
#   PROJECT_OPS_DIR=$HOME/repos/max-ai/platform/ops FROM_SEAT=dev.avery-kim TO_SEAT=architect.morgan-lee ISSUE=123 \
#     docs/ops-template/scripts/agent-handoff.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
FROM_SEAT=${FROM_SEAT:-}
TO_SEAT=${TO_SEAT:-}
ISSUE=${ISSUE:-}
STATUS_BRIEF=${STATUS_BRIEF:-}
REQUEST=${REQUEST:-}

if [[ -z "$PROJECT_OPS_DIR" || -z "$FROM_SEAT" || -z "$TO_SEAT" ]]; then
  echo "Set PROJECT_OPS_DIR, FROM_SEAT, and TO_SEAT" >&2
  exit 1
fi

# Derive base repo path
BASE_REPO=$(cd "$PROJECT_OPS_DIR/.." && pwd)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SEAT_PATH=$(BASE_REPO="$BASE_REPO" SEAT="$FROM_SEAT" "$SCRIPT_DIR/seat-path.sh")

# Derive roles from seat naming convention role.name
from_role=${FROM_SEAT%%.*}
to_role=${TO_SEAT%%.*}

# Ensure branch info and snapshot
branch=$(git -C "$SEAT_PATH" rev-parse --abbrev-ref HEAD)
if [[ "$branch" != agents/* ]]; then
  echo "Warning: expected agents/* branch, found $branch" >&2
fi

# Capture state before commit
dirty="clean"
if ! git -C "$SEAT_PATH" diff --quiet || ! git -C "$SEAT_PATH" diff --cached --quiet; then
  dirty="dirty"
fi

# Snapshot commit
set +e
if [[ "$dirty" == "dirty" ]]; then
  git -C "$SEAT_PATH" add -A
  git -C "$SEAT_PATH" commit -m "WIP($FROM_SEAT): snapshot before handoff to $TO_SEAT"
fi
set -e

# Best-effort push
push_note="pushed"
set +e
git -C "$SEAT_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1
has_upstream=$?
if [[ $has_upstream -ne 0 ]]; then
  git -C "$SEAT_PATH" push -u origin "$branch" || push_note="push failed (no upstream?)"
else
  git -C "$SEAT_PATH" push || push_note="push failed"
fi
set -e

# Compute snapshot info
last_commit=$(git -C "$SEAT_PATH" log -1 --oneline || true)
unpushed=0
set +e
upline=$(git -C "$SEAT_PATH" rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
if [[ -n "${upline:-}" ]]; then
  unpushed=$(git -C "$SEAT_PATH" rev-list --count "${upline}..HEAD" 2>/dev/null || echo 0)
fi
set -e
diff_stat=$(git -C "$SEAT_PATH" diff --stat "origin/main...HEAD" 2>/dev/null || echo "(diff stat unavailable)")

# Render comment from template
TEMPLATE="$PROJECT_OPS_DIR/docs/ops-template/templates/handoff-comment.md"
COPY_CMD="$HOME/repos/ops-template/scripts/copy-role-prompt.sh"
project_name=$(basename "$(cd "$BASE_REPO" && pwd)")

comment=$(\
  sed -e "s/{{PROJECT}}/$project_name/g" \
      -e "s/{{FROM_SEAT}}/$FROM_SEAT/g" \
      -e "s/{{TO_SEAT}}/$TO_SEAT/g" \
      -e "s/{{FROM_ROLE}}/$from_role/g" \
      -e "s/{{TO_ROLE}}/$to_role/g" \
      -e "s,{{WORKTREE_PATH}},$SEAT_PATH,g" \
      -e "s,{{BRANCH}},$branch,g" \
      -e "s,{{ISSUE}},${ISSUE:-N/A},g" \
      -e "s,{{STATUS_BRIEF}},${STATUS_BRIEF:-},g" \
      -e "s,{{REQUEST}},${REQUEST:-},g" \
      -e "s,{{LAST_COMMIT}},$last_commit,g" \
      -e "s,{{UNPUSHED_COUNT}},$unpushed,g" \
      -e "s,{{DIFF_STAT}},$(printf "%s" "$diff_stat" | sed 's,/,\/,g'),g" \
      -e "s,{{DIRTY}},$dirty; $push_note,g" \
      -e "s,{{PROJECT_OPS_DIR}},$PROJECT_OPS_DIR,g" \
      -e "s,{{COPY_CMD}},$COPY_CMD,g" "$TEMPLATE" )

# Copy to clipboard if available
if command -v pbcopy >/dev/null 2>&1; then
  printf "%s\n" "$comment" | pbcopy
  echo "Handoff comment copied to clipboard." >&2
else
  echo "pbcopy not available; printing handoff comment:" >&2
  echo "---" >&2
  printf "%s\n" "$comment" >&2
  echo "---" >&2
fi

# Optional: post comment and apply labels using gh
if [[ -n "${ISSUE:-}" ]] && command -v gh >/dev/null 2>&1; then
  # Normalize issue to number if URL
  issue_ref="$ISSUE"
  if [[ "$ISSUE" == http* ]]; then
    issue_ref=$(basename "$ISSUE")
  fi
  set +e
  printf "%s\n" "$comment" | gh issue comment "$issue_ref" >/dev/null 2>&1 && \
    gh issue edit "$issue_ref" --add-label "handoff/pending,blocked/waiting" >/dev/null 2>&1
  set -e
fi

# Persist minimal wait-state cache
mkdir -p "$PROJECT_OPS_DIR/tracker/workspace"
cat > "$PROJECT_OPS_DIR/tracker/workspace/$FROM_SEAT.json" <<JSON
{
  "issue": "${ISSUE:-}",
  "from_seat": "$FROM_SEAT",
  "to_seat": "$TO_SEAT",
  "branch": "$branch",
  "worktree": "$SEAT_PATH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "Handoff recorded for $FROM_SEAT -> $TO_SEAT (issue: ${ISSUE:-N/A})" >&2
