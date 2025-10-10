#!/usr/bin/env bash
set -euo pipefail

# sync-all-projects.sh
# Comprehensive sync script that handles both template syncing and role prompt generation
# for all registered projects. This ensures complete synchronization of:
# - Templates, scripts, rules, and .github/prompts (via sync-template.sh)
# - Generated role prompts based on project agent configurations (via sync-github-prompts.sh)
# - Agent identity files (.agents/rules/agents.yaml)
#
# Usage:
#   ./scripts/sync-all-projects.sh          # Sync all projects (dry run)
#   ./scripts/sync-all-projects.sh -w       # Sync all projects (write changes)
#   ./scripts/sync-all-projects.sh -p hakim-platform-ops  # Sync specific project

WRITE=false
QUIET=false
SPECIFIC_PROJECT=""

while getopts ":wqp:" opt; do
  case $opt in
    w) WRITE=true ;;
    q) QUIET=true ;;
    p) SPECIFIC_PROJECT="$OPTARG" ;;
    *) echo "Usage: $0 [-w] [-q] [-p project-name]" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="$ROOT_DIR/registry/projects.yaml"

if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required (https://github.com/mikefarah/yq)" >&2
  exit 1
fi

SYNC_TEMPLATE="$ROOT_DIR/scripts/sync-template.sh"
SYNC_GITHUB_PROMPTS="$ROOT_DIR/scripts/sync-github-prompts.sh"
INIT_IDENTITIES="$ROOT_DIR/scripts/init-project-identities.sh"

# Get list of projects to sync
if [[ -n "$SPECIFIC_PROJECT" ]]; then
  PROJECTS=("$SPECIFIC_PROJECT")
else
  count=$(yq '.projects | length' "$REGISTRY")
  PROJECTS=()
  for ((i=0; i<count; i++)); do
    name=$(yq -r ".projects[$i].name" "$REGISTRY")
    PROJECTS+=("$name")
  done
fi

echo "🔄 Starting comprehensive sync for ${#PROJECTS[@]} project(s)..."
echo ""

for project_name in "${PROJECTS[@]}"; do
  if ! $QUIET; then echo "📁 Processing project: $project_name"; fi

  # Get project details from registry
  count=$(yq '.projects | length' "$REGISTRY")
  for ((i=0; i<count; i++)); do
    name=$(yq -r ".projects[$i].name" "$REGISTRY")
    if [[ "$name" == "$project_name" ]]; then
      PROJECT_PATH=$(yq -r ".projects[$i].path" "$REGISTRY")
      PROJECT_PATH=$(eval echo "$PROJECT_PATH")
      USE_GITHUB_PROMPTS=$(yq -r ".projects[$i].use_github_prompts // \"false\"" "$REGISTRY")
      break
    fi
  done

  if [[ ! -d "$PROJECT_PATH" ]]; then
    echo "⚠️  Warning: Project directory $PROJECT_PATH does not exist, skipping..."
    continue
  fi

  # Step 1: Sync templates, scripts, rules, and .github/prompts
  if ! $QUIET; then echo "  📋 Step 1: Syncing templates, scripts, rules, and prompts..."; fi
  if $WRITE; then
    "$SYNC_TEMPLATE" -w "$PROJECT_PATH" >/dev/null 2>&1
  else
    "$SYNC_TEMPLATE" "$PROJECT_PATH" >/dev/null 2>&1
  fi

  # Step 2: Initialize/update agent identities if needed
  AGENTS_FILE="$PROJECT_PATH/.agents/rules/agents.yaml"
  if [[ ! -f "$AGENTS_FILE" ]]; then
    if ! $QUIET; then echo "  👥 Step 2: Initializing agent identities..."; fi
    if $WRITE; then
      PROJECT_OPS_DIR="$PROJECT_PATH" "$INIT_IDENTITIES"
    fi
  else
    # Update with latest template if write mode
    if $WRITE; then
      if ! $QUIET; then echo "  👥 Step 2: Updating agent identities..."; fi
      cp "$ROOT_DIR/templates/agents.yaml" "$AGENTS_FILE"
    fi
  fi

  # Step 3: Generate role prompts if project uses GitHub prompts
  if [[ "$USE_GITHUB_PROMPTS" == "true" ]]; then
    if ! $QUIET; then echo "  🤖 Step 3: Generating role prompts..."; fi
    if $WRITE; then
      PROJECT_NAME="$project_name" "$SYNC_GITHUB_PROMPTS" >/dev/null 2>&1
    fi
  else
    if ! $QUIET; then echo "  ⏭️  Step 3: Skipping role prompts (use_github_prompts=false)"; fi
  fi

  if ! $QUIET; then echo "  ✅ $project_name sync complete"; fi
  if ! $QUIET; then echo ""; fi
done

if $WRITE; then
  echo "✅ All projects synchronized successfully!"
  echo ""
  echo "📋 Summary of what was synced:"
  echo "  • Templates, scripts, and rules from ops-template"
  echo "  • GitHub-integrated agent prompts (.github/prompts/)"
  echo "  • Agent identity configurations (.agents/rules/agents.yaml)"
  echo "  • Generated role prompts for projects with use_github_prompts=true"
else
  echo "🔍 Dry run complete. Use -w flag to apply changes."
fi