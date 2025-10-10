#!/usr/bin/env bash
set -euo pipefail

# auto-next.sh
# If exactly one obvious next issue is assigned to this seat via seat-label routing, AUTO-CONTINUE.
# Otherwise, present top issues sorted by priority then updatedAt.
# Usage:
#   PROJECT_OPS_DIR=/path/to/ops SEAT=role.name [REPO=org/repo] [LIMIT=50] $HOME/repos/ops-template/scripts/auto-next.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
ROLE=${ROLE:-}
if [[ -z "$ROLE" && -n "$SEAT" ]]; then ROLE="${SEAT%%.*}"; fi
REPO=${REPO:-}
LIMIT=${LIMIT:-50}
PRIORITY_PREFIX=${PRIORITY_PREFIX:-priority:}
STATE=${STATE:-open}
INCLUDE_BLOCKED=${INCLUDE_BLOCKED:-false}
INCLUDE_CODE=${INCLUDE_CODE:-false}

if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required for auto-next.sh" >&2
  exit 1
fi

label_filter=(--label "seat:$SEAT")
args=(issue list --state "$STATE" --limit "$LIMIT" --json number,title,updatedAt,labels)
if [[ -n "$REPO" ]]; then
  args=(-R "$REPO" "${args[@]}")
fi
args+=("${label_filter[@]}")

json=$(gh "${args[@]}")

sorted=$(printf "%s" "$json" | jq -r '[.[]
  | select(("'"$INCLUDE_BLOCKED"'"=="true") or ((.labels|map(.name)|index("blocked"))|not))
  | select(("'"$ROLE"'" != "team_lead") or ("'"$INCLUDE_CODE"'" == "true") or ((.labels|map(.name)|index("type:code"))|not))
  | .prio=((.labels|map(.name)|map(select(startswith("'"$PRIORITY_PREFIX"'")))|map(captures("P(?<p>[0-9]+)")|.captures[0].string|tonumber)|first) // 5)
] | sort_by(.prio, (.updatedAt|fromdateiso8601) * -1) | .[] | {number,title,updatedAt,prio} | @json')
count=$(printf "%s\n" "$sorted" | grep -c '^' || true)

if [[ "$count" -eq 1 ]]; then
  one=$(printf "%s\n" "$sorted")
  num=$(printf "%s" "$one" | jq -r .number)
  title=$(printf "%s" "$one" | jq -r .title)
  echo "AUTO-CONTINUE: Only one seat-routed open issue found for $SEAT"
  echo "Issue #$num - $title"
  echo "Next action: proceed to pick up this issue automatically."
else
  echo "Multiple open issues for $SEAT (showing up to $LIMIT, priority-sorted):"
  printf "%-8s  %-4s  %-60s  %-20s\n" "NUMBER" "PRIO" "TITLE" "UPDATED"
  printf "%-8s  %-4s  %-60s  %-20s\n" "--------" "----" "------------------------------------------------------------" "--------------------"
  while IFS= read -r line; do
    num=$(printf "%s" "$line" | jq -r .number)
    prio=$(printf "%s" "$line" | jq -r .prio)
    title=$(printf "%s" "$line" | jq -r .title | cut -c1-60)
    updated=$(printf "%s" "$line" | jq -r .updatedAt | cut -c1-19)
    printf "%-8s  %-4s  %-60s  %-20s\n" "$num" "$prio" "$title" "$updated"
  done <<< "$sorted"
  echo "Prompt the user to select the next issue (default: top priority, most recently updated)."
fi
