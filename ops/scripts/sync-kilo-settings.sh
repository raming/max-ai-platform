#!/usr/bin/env bash
set -euo pipefail

# sync-kilo-settings.sh
# Sync kilo settings and modes to all downstream projects
# Usage: ./scripts/sync-kilo-settings.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔄 Syncing kilo settings to all downstream projects..."
echo ""

# Source the projects registry
PROJECTS_FILE="$ROOT_DIR/registry/projects.yaml"

if [[ ! -f "$PROJECTS_FILE" ]]; then
  echo "❌ Projects registry not found: $PROJECTS_FILE"
  exit 1
fi

# Function to sync to a project
sync_to_project() {
  local project_name="$1"
  local project_path="$2"

  if [[ ! -d "$project_path" ]]; then
    echo "⚠️  Project path not found, skipping: $project_path"
    return
  fi

  echo "📁 Syncing to $project_name: $project_path"

  # Create kilo/settings directory if it doesn't exist
  mkdir -p "$project_path/kilo/settings"

  # Copy kilo settings
  if [[ -d "$ROOT_DIR/kilo/settings" ]]; then
    cp -r "$ROOT_DIR/kilo/settings/"* "$project_path/kilo/settings/" 2>/dev/null || true
    echo "   ✅ Copied kilo/settings"
  fi

  # Copy kilo modes
  if [[ -d "$ROOT_DIR/kilo/modes" ]]; then
    mkdir -p "$project_path/kilo/modes"
    cp -r "$ROOT_DIR/kilo/modes/"* "$project_path/kilo/modes/" 2>/dev/null || true
    echo "   ✅ Copied kilo/modes"
  fi

  # Copy .kilocodemodes file
  if [[ -f "$ROOT_DIR/.kilocodemodes" ]]; then
    cp "$ROOT_DIR/.kilocodemodes" "$project_path/.kilocodemodes" 2>/dev/null || true
    echo "   ✅ Copied .kilocodemodes"
  fi

  echo "   🎯 $project_name synced"
  echo ""
}

# Sync to each project (hardcoded for simplicity)
sync_to_project "hakim-platform-ops" "$HOME/repos/hakim/hakim-platform/ops"
sync_to_project "airmeez-mirror" "$HOME/repos/airmeez/airmeez_ui"
sync_to_project "max-ai-ops" "$HOME/repos/max-ai/platform/ops"
sync_to_project "metazone-dev-squad-agent-ops" "$HOME/repos/metazone/dev-squad-agent/ops"

echo "🚀 Kilo settings sync complete!"
echo ""
echo "Next steps:"
echo "1. Update project-specific settings in each project's kilo/settings/project-overrides.md"
echo "2. Regenerate merged prompts in each project: ./scripts/sync-kilo-prompts.sh"
echo "3. Create modes in kilo using the updated prompts"