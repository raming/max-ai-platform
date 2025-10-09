#!/usr/bin/env bash
set -euo pipefail

# list-issues.sh
# List seat- or user-routed open issues with priority-aware sorting.
# Defaults to seat-label routing: label seat:<seat>, exclude blocked, sort by priority then updatedAt desc.
# Usage:
#   PROJECT_OPS_DIR=/path/to/ops SEAT=role.name [REPO=org/repo] [LIMIT=50] [INCLUDE_BLOCKED=false] $HOME/repos/ops-template/scripts/list-issues.sh
#   PROJECT_OPS_DIR=/path/to/ops GH_USER=octocat [REPO=org/repo] [LIMIT=50] $HOME/repos/ops-template/scripts/list-issues.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
GH_USER=${GH_USER:-}
ROLE=${ROLE:-}
if [[ -z "$ROLE" && -n "$SEAT" ]]; then ROLE="${SEAT%%.*}"; fi
REPO=${REPO:-}
LIMIT=${LIMIT:-50}
STATE=${STATE:-open}
INCLUDE_BLOCKED=${INCLUDE_BLOCKED:-false}
INCLUDE_CODE=${INCLUDE_CODE:-false}
PRIORITY_PREFIX=${PRIORITY_PREFIX:-priority:}
READINESS_LABEL=${READINESS_LABEL:-}

if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required for list-issues.sh" >&2
  exit 1
fi

# Prefer seat-label routing; assignee is optional/secondary
label_filter=""
if [[ -n "$SEAT" ]]; then
  label_filter=(--label "seat:$SEAT")
fi

# Optional readiness filter
if [[ -n "$READINESS_LABEL" ]]; then
  label_filter+=(--label "$READINESS_LABEL")
fi

# Assignee mode (opt-in if GH_USER provided and you want it)
assignee_filter=()
if [[ -n "$GH_USER" ]]; then
  assignee_filter=(--assignee "$GH_USER")
fi

# Build gh args (we fetch a larger set, then sort client-side by priority)
args=(issue list --state "$STATE" --limit "$LIMIT" --json number,title,labels,updatedAt)
if [[ -n "$REPO" ]]; then
  args=(-R "$REPO" "${args[@]}")
fi

args+=("${label_filter[@]}")
# By default exclude blocked; gh lacks negative label filter, so we filter client-side

json=$(gh "${args[@]}")

# Client-side filter: exclude blocked unless INCLUDE_BLOCKED=true
# Also: if ROLE=team_lead and INCLUDE_CODE!=true, exclude issues labeled type:code
sorted=$(printf "%s" "$json" | jq -r '[.[]
  | select(("'"$INCLUDE_BLOCKED"'"=="true") or ((.labels|map(.name)|index("blocked"))|not))
  | select(("'"$ROLE"'" != "team_lead") or ("'"$INCLUDE_CODE"'" == "true") or ((.labels|map(.name)|index("type:code"))|not))
  | .prio=((.labels|map(.name)|map(select(startswith("'"$PRIORITY_PREFIX"'")))|map(captures("P(?<p>[0-9]+)")|.captures[0].string|tonumber)|first) // 5)
] | sort_by(.prio, (.updatedAt|fromdateiso8601) * -1) | .[] | {number,title,labels:[.labels[].name],updatedAt,prio} | @json')

# Pretty print succinct table
printf "# Seat issues (seat=%s, state=%s, limit=%s)\n" "${SEAT:-<unset>}" "$STATE" "$LIMIT"
printf "%-8s  %-4s  %-60s  %-24s  %-40s\n" "NUMBER" "PRIO" "TITLE" "UPDATED" "LABELS"
printf "%-8s  %-4s  %-60s  %-24s  %-40s\n" "--------" "----" "------------------------------------------------------------" "------------------------" "----------------------------------------"
while IFS= read -r line; do
  num=$(printf "%s" "$line" | jq -r .number)
  prio=$(printf "%s" "$line" | jq -r .prio)
  title=$(printf "%s" "$line" | jq -r .title | cut -c1-60)
  updated=$(printf "%s" "$line" | jq -r .updatedAt | cut -c1-24)
  labels=$(printf "%s" "$line" | jq -r '.labels | join(",")' | cut -c1-40)
  printf "%-8s  %-4s  %-60s  %-24s  %-40s\n" "$num" "$prio" "$title" "$updated" "$labels"
done <<< "$sorted"
