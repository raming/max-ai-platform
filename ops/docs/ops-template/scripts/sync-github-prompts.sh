#!/usr/bin/env bash
set -euo pipefail

# sync-github-prompts.sh
# Sync merged role prompts into a downstream project's .github/prompts/ directory
# Usage examples:
#  PROJECT_OPS_DIR=$HOME/repos/metazone/dev-squad-agent/ops PROJECT_NAME=metazone-dev-squad-agent-ops $0
#  or
#  PROJECT_NAME=metazone-dev-squad-agent-ops $0

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="$ROOT_DIR/registry/projects.yaml"

PROJECT_NAME=${PROJECT_NAME:-}
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
FORCE=${FORCE:-false}

if [[ -z "$PROJECT_OPS_DIR" && -n "$PROJECT_NAME" ]]; then
  if ! command -v yq >/dev/null 2>&1; then
    echo "ERROR: PROJECT_OPS_DIR not set and yq not available to read registry." >&2
    exit 1
  fi
  # find path from registry
  entry_count=$(yq '.projects | length' "$REGISTRY")
  found=false
  for ((i=0;i<entry_count;i++)); do
    name=$(yq -r ".projects[$i].name" "$REGISTRY")
    if [[ "$name" == "$PROJECT_NAME" ]]; then
      PROJECT_OPS_DIR=$(yq -r ".projects[$i].path" "$REGISTRY")
      PROJECT_OPS_DIR=$(eval echo "$PROJECT_OPS_DIR")
      use_github_prompts=$(yq -r ".projects[$i].use_github_prompts // "false"" "$REGISTRY")
      found=true
      break
    fi
  done
  if ! $found; then
    echo "Project $PROJECT_NAME not found in registry" >&2
    exit 1
  fi
  if [[ "$use_github_prompts" != "true" && "$FORCE" != "true" ]]; then
    echo "Project $PROJECT_NAME is not tagged for GitHub prompts sync (use_github_prompts != true). Use FORCE=true to override." >&2
    exit 1
  fi
fi

if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR or PROJECT_NAME to identify the target project ops directory." >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$PROJECT_OPS_DIR/.." && pwd)"
DEST_DIR="$PROJECT_ROOT/.github/prompts"
mkdir -p "$DEST_DIR"

MERGER="$ROOT_DIR/scripts/merge-role-prompt.sh"
if [[ ! -x "$MERGER" ]]; then
  echo "merge-role-prompt.sh not found or not executable at $MERGER" >&2
  exit 1
fi

ROLES=(architect team_lead dev qa release_manager sre)

titlecase() {
  local s="$1"
  if [[ "$s" == "qa" || "$s" == "sre" ]]; then
    # Uppercase acronyms in a portable way
    echo "$(echo "$s" | tr '[:lower:]' '[:upper:]')"
    return
  fi
  IFS='_'
  read -ra parts <<< "$s"
  out_parts=()
  for p in "${parts[@]}"; do
    first="$(echo "${p:0:1}" | tr '[:lower:]' '[:upper:]')"
    rest="$(echo "${p:1}" | tr '[:upper:]' '[:lower:]')"
    out_parts+=("$first$rest")
  done
  # Re-join with underscore to preserve readability (Team_Lead, Release_Manager)
  (IFS='_'; echo "${out_parts[*]}")
}

for role in "${ROLES[@]}"; do
  cap=$(titlecase "$role")
  out="$DEST_DIR/${cap}.prompt.md"
  echo "Generating merged prompt for role=$role -> $out"
  ROLE="$role" SEAT="" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER" > "$out"
done

echo "Synced GitHub prompts to $DEST_DIR"
