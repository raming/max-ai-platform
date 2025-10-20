#!/usr/bin/env bash
set -euo pipefail

# kilo-context-update.sh
# Update Kilo agents with latest project context
# Usage: ./scripts/kilo-context-update.sh [project]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_OPS_DIR=${1:-$ROOT_DIR}

CONTEXT_FILE="$PROJECT_OPS_DIR/.agents/rules/context.md"

if [[ ! -f "$CONTEXT_FILE" ]]; then
  echo "No context file found: $CONTEXT_FILE" >&2
  echo "Create project context first in .agents/rules/context.md" >&2
  exit 1
fi

echo "=== Latest Project Context for Kilo Agents ==="
echo "📁 Project: $(basename "$PROJECT_OPS_DIR")"
echo "📅 Updated: $(date)"
echo ""

cat "$CONTEXT_FILE"

echo ""
echo "=== Kilo Integration Status ==="
echo "📋 Registry: $(basename "$ROOT_DIR")/registry/kilo-projects.yaml"
echo "🔧 Scripts: $(basename "$ROOT_DIR")/scripts/sync-kilo-prompts.sh"
echo ""

# Check if Kilo prompts exist
KILO_PROMPTS_DIR="$PROJECT_OPS_DIR/kilo/prompts/merged"
if [[ -d "$KILO_PROMPTS_DIR" ]]; then
  prompt_count=$(find "$KILO_PROMPTS_DIR" -name "*.kilo.md" | wc -l)
  echo "✅ Kilo prompts: $prompt_count found"

  echo ""
  echo "Available Kilo agents:"
  find "$KILO_PROMPTS_DIR" -name "*.kilo.md" | while read -r prompt_file; do
    role=$(basename "$prompt_file" .kilo.md)
    role_lower=$(echo "$role" | awk '{print tolower(substr($0,1,1)) substr($0,2)}')
    echo "  /$role_lower    → Load $role agent"
  done
else
  echo "❌ Kilo prompts: Not generated yet"
  echo "Run: PROJECT_OPS_DIR=\"$PROJECT_OPS_DIR\" ./scripts/sync-kilo-prompts.sh"
fi

echo ""
echo "=== End Context ==="