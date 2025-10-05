#!/usr/bin/env bash
set -euo pipefail

# copy-role-prompt.sh
# Build a merged prompt for a ROLE and copy it to the clipboard (macOS pbcopy).
# Usage examples:
#   ROLE=architect PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops SEAT=architect.morgan-lee $HOME/repos/ops-template/scripts/copy-role-prompt.sh
#   ROLE=dev        PROJECT_OPS_DIR=$HOME/repos/hakim/hakim-platform/ops SEAT=dev.avery-kim       $HOME/repos/ops-template/scripts/copy-role-prompt.sh

ROLE=${ROLE:-}
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MERGER="$SCRIPT_DIR/merge-role-prompt.sh"

if [[ -z "$ROLE" || -z "$PROJECT_OPS_DIR" || -z "$SEAT" ]]; then
  echo "Set ROLE, PROJECT_OPS_DIR, and SEAT" >&2
  exit 1
fi

if ! command -v pbcopy >/dev/null 2>&1; then
  echo "pbcopy not found (this script targets macOS). Falling back to printing output." >&2
  ROLE="$ROLE" SEAT="$SEAT" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER"
  exit 0
fi

ROLE="$ROLE" SEAT="$SEAT" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" "$MERGER" | pbcopy

echo "Merged prompt for ROLE=$ROLE (SEAT=$SEAT) copied to clipboard. Paste into Warp tab personal prompt."