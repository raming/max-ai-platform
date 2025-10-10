#!/usr/bin/env bash
set -euo pipefail

# reload-seat.sh
# Quickly reload a seat's canonical prompt into the clipboard without specifying ROLE.
# Usage:
#   PROJECT_OPS_DIR=/path/to/ops SEAT=role.name $HOME/repos/ops-template/scripts/reload-seat.sh
# Example:
#   PROJECT_OPS_DIR=$HOME/repos/max-ai/platform/ops SEAT=dev.avery-kim $HOME/repos/ops-template/scripts/reload-seat.sh

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}

if [[ -z "$PROJECT_OPS_DIR" || -z "$SEAT" ]]; then
  echo "Set PROJECT_OPS_DIR and SEAT" >&2
  exit 1
fi

ROLE=${SEAT%%.*}
exec "$HOME/repos/ops-template/scripts/copy-role-prompt.sh"