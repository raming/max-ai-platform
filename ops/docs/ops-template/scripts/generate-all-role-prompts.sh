#!/usr/bin/env bash
set -euo pipefail

# generate-all-role-prompts.sh
# Generate merged prompts for all roles for a project, using seats from agents.yaml if present.
# Usage:
#   PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops $HOME/repos/ops-template/scripts/generate-all-role-prompts.sh
# Outputs: /tmp/warp-merged-<role>.txt per role.

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MERGER="$ROOT_DIR/scripts/merge-role-prompt.sh"

if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR" >&2
  exit 1
fi

roles=(architect team_lead dev qa release_manager sre)

for role in "${roles[@]}"; do
  seat_default="$role.default"
  out="/tmp/warp-merged-$role.txt"
  ROLE="$role" SEAT="$seat_default" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER" > "$out"
  echo "Wrote $out"

done
