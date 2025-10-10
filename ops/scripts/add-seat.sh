#!/usr/bin/env bash
set -euo pipefail

# add-seat.sh
# Add or update a seat -> GitHub user mapping in a project's .agents/rules/agents.yaml
# Usage:
#   PROJECT_OPS_DIR=$HOME/projects/myorg/my-ops-repo SEAT=dev.alex-chen GH_USER=alex-gh $HOME/opt-template/scripts/add-seat.sh
# Requires: yq

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
GH_USER=${GH_USER:-}

if [[ -z "$PROJECT_OPS_DIR" || -z "$SEAT" || -z "$GH_USER" ]]; then
  echo "Set PROJECT_OPS_DIR, SEAT, and GH_USER" >&2
  exit 1
fi
if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required (https://github.com/mikefarah/yq)" >&2
  exit 1
fi

AGENTS_FILE="$PROJECT_OPS_DIR/.agents/rules/agents.yaml"
mkdir -p "$(dirname "$AGENTS_FILE")"
[[ -f "$AGENTS_FILE" ]] || echo "seats: {}" > "$AGENTS_FILE"

yq -i ".seats[\"$SEAT\"].github = \"$GH_USER\"" "$AGENTS_FILE"

echo "Updated $AGENTS_FILE with $SEAT -> $GH_USER"
