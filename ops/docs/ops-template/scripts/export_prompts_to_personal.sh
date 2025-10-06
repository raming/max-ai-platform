#!/usr/bin/env bash
set -euo pipefail

# export_prompts_to_personal.sh (template)
# Wrapper to compile prompts to a stable local folder ~/.warp/prompts/<project>/instances
# which you can drag into Warp Drive (UI-managed).
# Usage:
#   scripts/export_prompts_to_personal.sh [--project <slug>] [--skip-context]

PROJECT=""
SKIP_CONTEXT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT="$2"; shift 2 ;;
    --skip-context)
      SKIP_CONTEXT=true; shift ;;
    -h|--help)
      sed -n '2,200p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RULES_DIR="${REPO_ROOT}/.agents/rules"

if [[ -z "$PROJECT" ]]; then
  PROJECT=$(awk -F': *' '/^\s*project:/{print $2}' "$RULES_DIR/context.md" | tr -d '"' | tr -d '\r')
  PROJECT=${PROJECT:-project}
fi
TARGET_DIR="$HOME/.warp/prompts/${PROJECT}/instances"
mkdir -p "$TARGET_DIR"

CMD=("${SCRIPT_DIR}/compile_all_instances.sh" --out "$TARGET_DIR")
if [[ "$SKIP_CONTEXT" == true ]]; then CMD+=(--skip-context); fi
"${CMD[@]}"

echo "Prompts exported to $TARGET_DIR"
