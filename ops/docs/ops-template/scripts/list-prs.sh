#!/usr/bin/env bash
set -euo pipefail

# list-prs.sh
# List open PRs with priority and sprint labels, sorted by priority (P0→P3) and last update.
# Requires: gh, jq
# Usage:
#   ./list-prs.sh -R <org/repo> [-l priority:P0] [-l sprint:<label>] [-n <limit>]
# Examples:
#   ./list-prs.sh -R metazone-repo/hakim-platform -l priority:P0 -n 50
#   ./list-prs.sh -R metazone-repo/hakim-platform-ops -l sprint:2025-10-03

REPO=""
LIMIT=100
FILTER_LABELS=()

while getopts ":R:l:n:" opt; do
  case $opt in
    R) REPO="$OPTARG" ;;
    l) FILTER_LABELS+=("$OPTARG") ;;
    n) LIMIT="$OPTARG" ;;
    *) ;;
  esac
done
shift $((OPTIND -1))

if ! command -v gh >/dev/null || ! command -v jq >/dev/null; then
  echo "Requires gh and jq" >&2
  exit 1
fi
if [[ -z "$REPO" ]]; then
  echo "Usage: $0 -R <org/repo> [-l label]... [-n limit]" >&2
  exit 1
fi

# Build search query from labels
SEARCH="is:open"
for L in "${FILTER_LABELS[@]:-}"; do
  SEARCH+=" label:\"$L\""
done

JSON=$(gh pr list -R "$REPO" --state open --limit "$LIMIT" --json number,title,labels,updatedAt,url,author --search "$SEARCH")

# Compute priority rank (P0=0..P3=3; else 4) and print sorted rows
jq -r '
  def prio_rank($labs):
    ([$labs[]?.name] // []) as $names |
    if ($names | index("priority:P0")) then 0
    elif ($names | index("priority:P1")) then 1
    elif ($names | index("priority:P2")) then 2
    elif ($names | index("priority:P3")) then 3
    else 4 end;
  map({
    number, title, url, updatedAt,
    labels: ([.labels[]?.name] // []),
    author: .author.login,
    prio: prio_rank(.labels)
  })
  | sort_by(.prio, (.updatedAt | fromdateiso8601) * -1)
  | .[]
  | "[P\(.prio)] #\(.number)  \(.title)  (\(.author))\n  updated: \(.updatedAt)\n  labels: \(.labels | join(", "))\n  url: \(.url)\n"' <<< "$JSON"
