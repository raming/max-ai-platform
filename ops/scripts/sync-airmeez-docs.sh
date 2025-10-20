#!/usr/bin/env bash
set -euo pipefail

# sync-airmeez-docs.sh
# Convenience script to sync documentation to airmeez frontend/backend repositories
# Uses registry configuration to determine correct paths

# Usage:
# ./sync-airmeez-docs.sh --target frontend [--dry-run] [--verbose]
# ./sync-airmeez-docs.sh --target backend [--dry-run] [--verbose]

# Default values
TARGET=""
DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --target <frontend|backend> [--dry-run] [--verbose]"
      exit 1
      ;;
  esac
done

# Validate target
if [[ -z "$TARGET" ]]; then
  echo "Error: --target is required (frontend or backend)"
  exit 1
fi

if [[ "$TARGET" != "frontend" && "$TARGET" != "backend" ]]; then
  echo "Error: target must be 'frontend' or 'backend'"
  exit 1
fi

# Get script directory and paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OPS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REGISTRY="$OPS_ROOT/registry/projects.yaml"

# Check for required tools
if ! command -v yq >/dev/null 2>&1; then
  echo "Error: yq is required for YAML processing. Install from https://github.com/mikefarah/yq"
  exit 1
fi

# Find airmeez project in registry
AIRMEEZ_INDEX=""
PROJECT_COUNT=$(yq '.projects | length' "$REGISTRY")
for ((i=0; i<PROJECT_COUNT; i++)); do
  PROJECT_NAME=$(yq -r ".projects[$i].name" "$REGISTRY")
  if [[ "$PROJECT_NAME" == "airmeez-mirror" ]]; then
    AIRMEEZ_INDEX=$i
    break
  fi
done

if [[ -z "$AIRMEEZ_INDEX" ]]; then
  echo "Error: airmeez-ui-ops project not found in registry"
  exit 1
fi

# Get airmeez ops path and repository paths
OPS_PATH=$(yq -r ".projects[$AIRMEEZ_INDEX].path" "$REGISTRY")
OPS_PATH_EXPANDED=$(eval echo "$OPS_PATH")

# For worktree-safe operation, use direct paths instead of symlinks
# This avoids symlink issues when agents create worktrees
case "$TARGET" in
  frontend)
    # Use direct path to frontend repository (actual client repo with Bitbucket config)
    TARGET_REPO="$HOME/repos/airmeez/airmeez_frontend"
    ALTERNATIVE_REPO="$HOME/repos/airmeez/frontend"  # Alternative common naming
    ;;
  backend)
    # Use direct path to backend repository (actual client repo with Bitbucket config)
    TARGET_REPO="$HOME/repos/airmeez/airmeez_backend"
    ALTERNATIVE_REPO="$HOME/repos/airmeez/backend"  # Alternative common naming
    ;;
esac

# Check primary path first, then alternative
if [[ ! -d "$TARGET_REPO" ]]; then
  if [[ -d "$ALTERNATIVE_REPO" ]]; then
    TARGET_REPO="$ALTERNATIVE_REPO"
  else
    echo "Error: Target repository directory not found at expected locations:"
    echo "  Primary: $TARGET_REPO"
    echo "  Alternative: $ALTERNATIVE_REPO"
    echo ""
    echo "Please ensure the $TARGET repository exists at one of these locations,"
    echo "or update the paths in this script to match your actual repository locations."
    exit 1
  fi
fi

echo "📚 Syncing airmeez $TARGET documentation"
echo "   Ops Path: $OPS_PATH_EXPANDED"
echo "   Target Repo: $TARGET_REPO"
echo ""

# Build command arguments
CMD_ARGS=(
  "--project" "airmeez"
  "--target" "$TARGET"
  "--source-docs" "$OPS_ROOT/docs"
  "--target-repo" "$TARGET_REPO"
)

if $DRY_RUN; then
  CMD_ARGS+=("--dry-run")
fi

if $VERBOSE; then
  CMD_ARGS+=("--verbose")
fi

# Execute the sync script
"$SCRIPT_DIR/sync-docs-to-repo.sh" "${CMD_ARGS[@]}"