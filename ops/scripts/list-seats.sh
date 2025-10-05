#!/usr/bin/env bash
set -euo pipefail

# list-seats.sh
# List seats defined in a project's .agents/rules/agents.yaml
# Usage:
#   PROJECT_OPS_DIR=$HOME/projects/hakim/hakim-platform-ops $HOME/opt-template/scripts/list-seats.sh
# Requires: yq

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR" >&2
  exit 1
fi
if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required (https://github.com/mikefarah/yq)" >&2
  exit 1
fi

FILE="$PROJECT_OPS_DIR/.agents/rules/agents.yaml"
if [[ ! -f "$FILE" ]]; then
  echo "No agents.yaml found at $FILE" >&2
  exit 1
fi

yq '.seats | to_entries[] | [.key, (.value.name // ""), (.value.github // "")] | @tsv' "$FILE" | awk -F"\t" 'BEGIN { printf("%-35s %-20s %-15s\n","SEAT","NAME","GITHUB"); printf("%-35s %-20s %-15s\n","---------------------------------","--------------------","---------------"); } { printf("%-35s %-20s %-15s\n", $1, $2, $3); }'
