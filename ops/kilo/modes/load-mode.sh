#!/usr/bin/env bash
# Load a specific Kilo mode with ops-template integration

MODE=${1:-}
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 <mode>" >&2
  echo "Available modes:" >&2
  ls -1 "$PROJECT_ROOT/kilo/modes" | grep "\.json$" | sed 's/\.json$//' | sed 's/^/  /' >&2
  exit 1
fi

MODE_FILE="$PROJECT_ROOT/kilo/modes/$MODE.json"
PROMPT_FILE="$PROJECT_ROOT/kilo/prompts/merged/$(echo "$MODE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}').kilo.md"

if [[ ! -f "$MODE_FILE" ]]; then
  echo "❌ Mode configuration not found: $MODE_FILE" >&2
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "❌ Prompt file not found: $PROMPT_FILE" >&2
  echo "Run: ./scripts/sync-kilo-prompts.sh" >&2
  exit 1
fi

echo "🔄 Loading $MODE mode..."
echo "📄 Configuration: $MODE_FILE"
echo "🤖 Prompt: $PROMPT_FILE"
echo ""

# Output the prompt for Kilo to load
cat "$PROMPT_FILE"
