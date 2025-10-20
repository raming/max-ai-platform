#!/usr/bin/env bash
set -euo pipefail

# sync-all-kilo-projects.sh
# Sync Kilo prompts to all registered projects (similar to sync-all-projects.sh)
# Usage:
#   ./scripts/sync-all-kilo-projects.sh          # Sync all projects
#   ./scripts/sync-all-kilo-projects.sh --dry-run  # Show what would be synced

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KILO_REGISTRY="$ROOT_DIR/registry/kilo-projects.yaml"

DRY_RUN=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -w|--write)
      FORCE=true
      shift
      ;;
    -p|--project)
      PROJECT_FILTER="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 [--dry-run] [-w|--write] [-p|--project PROJECT_NAME]" >&2
      exit 1
      ;;
  esac
done

if ! command -v yq >/dev/null 2>&1; then
  echo "ERROR: yq required for registry processing. Install with: brew install yq" >&2
  exit 1
fi

# Get all Kilo projects from registry
projects=$(yq -r '.kilo_projects[] | select(.use_kilo_prompts == true) | .name' "$KILO_REGISTRY")

if [[ -n "${PROJECT_FILTER:-}" ]]; then
  projects=$(echo "$projects" | grep "$PROJECT_FILTER")
fi

project_count=$(echo "$projects" | wc -l)
echo "Found $project_count Kilo project(s) in registry"

if [[ $project_count -eq 0 ]]; then
  echo "No Kilo projects found in registry: $KILO_REGISTRY" >&2
  exit 1
fi

for project in $projects; do
  echo ""
  echo "==> Processing Kilo project: $project"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  DRY RUN: Would sync Kilo prompts for $project"
    echo "  Command: PROJECT_NAME=\"$project\" $ROOT_DIR/scripts/sync-kilo-prompts.sh"
  else
    echo "  Syncing Kilo prompts for $project..."

    # Run the sync script
    PROJECT_NAME="$project" "$ROOT_DIR/scripts/sync-kilo-prompts.sh"

    echo "  ✓ Generated Kilo prompts for $project"
  fi
done

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY RUN complete - use without --dry-run to actually sync"
  echo "Or use -w/--write to force sync even if project not in registry"
else
  echo "All Kilo projects synced successfully! 🎉"
  echo ""
  echo "Next steps:"
  echo "1. Test loading agents in Kilo: /architect, /dev, /qa"
  echo "2. Verify prompts work with your existing GitHub issue tracking"
  echo "3. Update your automation scripts to include Kilo sync"
fi