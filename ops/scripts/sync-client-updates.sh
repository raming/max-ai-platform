#!/usr/bin/env bash
set -euo pipefail

# sync-client-updates.sh
# Convenience wrapper to sync latest client code to mirror repo
# Run this from the mirror repository root

# Usage:
# ./sync-client-updates.sh [--dry-run] [--verbose]

DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
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
      echo "Usage: $0 [--dry-run] [--verbose]"
      exit 1
      ;;
  esac
done

# Get the mirror repo path (current directory)
MIRROR_REPO="$(pwd)"

# Check if we're in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: Not in a git repository. Run this from the mirror repo root."
  exit 1
fi

# Find the ops template scripts
SCRIPT_DIR=""
if [[ -f "../ops-template/scripts/sync-client-to-mirror.sh" ]]; then
  SCRIPT_DIR="../ops-template/scripts"
elif [[ -f "../../ops-template/scripts/sync-client-to-mirror.sh" ]]; then
  SCRIPT_DIR="../../ops-template/scripts"
elif [[ -f "scripts/sync-client-to-mirror.sh" ]]; then
  SCRIPT_DIR="scripts"
else
  echo "Error: Could not find sync-client-to-mirror.sh script"
  echo "Make sure you're in the mirror repo and ops-template is available"
  exit 1
fi

# Build command
CMD="$SCRIPT_DIR/sync-client-to-mirror.sh --mirror-repo $MIRROR_REPO"
if $DRY_RUN; then
  CMD="$CMD --dry-run"
fi
if $VERBOSE; then
  CMD="$CMD --verbose"
fi

echo "🚀 Running client sync from mirror repo..."
echo "   Command: $CMD"
echo ""

# Run the sync
exec $CMD