#!/usr/bin/env bash
set -euo pipefail

# load-kilo-agent.sh
# Load a specific Kilo agent with ops-template prompts
# Usage: ./scripts/load-kilo-agent.sh <role> [project]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_OPS_DIR=${2:-$ROOT_DIR}

ROLE=${1:-}
if [[ -z "$ROLE" ]]; then
  echo "Usage: $0 <role> [project_ops_dir]" >&2
  echo "Roles: architect, dev, qa, team_lead, release_manager, sre, ops_agent" >&2
  echo "Example: $0 architect" >&2
  exit 1
fi

# Check if yq is available for registry lookup
if ! command -v yq >/dev/null 2>&1; then
  echo "Warning: yq not available - using direct path mode" >&2
fi

KILO_PROMPTS_DIR="$PROJECT_OPS_DIR/kilo/prompts/merged"
PROMPT_FILE="$KILO_PROMPTS_DIR/$(echo "$ROLE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}').kilo.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Kilo prompt not found: $PROMPT_FILE" >&2
  echo "Run sync-kilo-prompts.sh first:" >&2
  echo "  PROJECT_OPS_DIR=\"$PROJECT_OPS_DIR\" ./scripts/sync-kilo-prompts.sh" >&2
  exit 1
fi

echo "🤖 Loading $ROLE agent in Kilo..."
echo "📁 Project: $(basename "$PROJECT_OPS_DIR")"
echo "📄 Prompt: $PROMPT_FILE"
echo "🚀 Trigger command: /$ROLE"
echo ""

# Output the prompt for Kilo to load
cat "$PROMPT_FILE"