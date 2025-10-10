#!/usr/bin/env bash
set -euo pipefail

# init-project-identities.sh
# Initialize per-project agent identity mapping (.agents/rules/agents.yaml).
# Usage:
#   PROJECT_OPS_DIR=$HOME/projects/myorg/my-ops-repo $HOME/opt-template/scripts/init-project-identities.sh
# Requires: bash. If yq is present and an existing file is found, it will be left unchanged.

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR to the ops repo path" >&2
  exit 1
fi

AGENTS_DIR="$PROJECT_OPS_DIR/.agents/rules"
AGENTS_FILE="$AGENTS_DIR/agents.yaml"
mkdir -p "$AGENTS_DIR"

if [[ -f "$AGENTS_FILE" ]]; then
  echo "Found existing $AGENTS_FILE — leaving as is."
  exit 0
fi

# Seed from canonical template with example named seats; maintainers should customize immediately.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/templates/agents.yaml"
if [[ ! -f "$TEMPLATE_FILE" ]]; then
  echo "Missing template: $TEMPLATE_FILE" >&2
  exit 1
fi

{
  echo "# agents.yaml — per-project agent identity mapping (seats -> GitHub users)"
  echo "# Customize seat slugs and GitHub usernames. Add more seats with add-seat.sh or edit directly."
  cat "$TEMPLATE_FILE"
} > "$AGENTS_FILE"

echo "Initialized $AGENTS_FILE from templates/agents.yaml"
