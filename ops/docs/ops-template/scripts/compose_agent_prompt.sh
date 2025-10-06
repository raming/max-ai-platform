#!/usr/bin/env bash
set -euo pipefail

# compose_agent_prompt.sh
# Compose a Warp Agent prompt from context + base role + instance files.
# Prints to stdout by default; use --copy to send to clipboard (macOS pbcopy).
#
# Usage:
#   scripts/compose_agent_prompt.sh <role> <seat_slug> [--dir <rules_dir>] [--copy] [--skip-context]
# Examples:
#   scripts/compose_agent_prompt.sh dev avery-kim --copy
#   scripts/compose_agent_prompt.sh qa analyst-1 | pbcopy

RULES_DIR=""
DO_COPY=false
SKIP_CONTEXT=false
ROLE=""
SEAT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      RULES_DIR="$2"; shift 2 ;;
    --copy)
      DO_COPY=true; shift ;;
    --skip-context)
      SKIP_CONTEXT=true; shift ;;
    -h|--help)
      sed -n '2,200p' "$0"; exit 0 ;;
    *)
      if [[ -z "$ROLE" ]]; then
        ROLE="$1"; shift
      elif [[ -z "$SEAT" ]]; then
        SEAT="$1"; shift
      else
        echo "Unexpected argument: $1" >&2; exit 1
      fi ;;
  esac
done

if [[ -z "$ROLE" || -z "$SEAT" ]]; then
  echo "Usage: scripts/compose_agent_prompt.sh <role> <seat_slug> [--dir <rules_dir>] [--copy] [--skip-context]" >&2
  exit 1
fi

# Resolve repo root and default rules dir
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_RULES_DIR="${REPO_ROOT}/.agents/rules"
RULES_DIR="${RULES_DIR:-$DEFAULT_RULES_DIR}"

CTX_FILE="${RULES_DIR}/context.md"
ROLE_FILE="${RULES_DIR}/${ROLE}.md"
INST_FILE="${RULES_DIR}/instances/${ROLE}.${SEAT}.md"

missing=()
if [[ "$SKIP_CONTEXT" != true && ! -f "$CTX_FILE" ]]; then missing+=("$CTX_FILE"); fi
if [[ ! -f "$ROLE_FILE" ]]; then missing+=("$ROLE_FILE"); fi
if [[ ! -f "$INST_FILE" ]]; then missing+=("$INST_FILE"); fi
if (( ${#missing[@]} > 0 )); then
  echo "Missing required files:" >&2
  for m in "${missing[@]}"; do echo " - $m" >&2; done
  echo "Check your role/seat and rules directory." >&2
  exit 2
fi

compose() {
  if [[ "$SKIP_CONTEXT" != true ]]; then
    cat "$CTX_FILE"
    echo -e "\n"
  fi
  cat "$ROLE_FILE"
  echo -e "\n"
  cat "$INST_FILE"
}

if [[ "$DO_COPY" == true ]]; then
  if command -v pbcopy >/dev/null 2>&1; then
    compose | pbcopy
    echo "Composed prompt copied to clipboard for role=$ROLE seat=$SEAT"
  else
    echo "pbcopy not found; printing to stdout instead" >&2
    compose
  fi
else
  compose
fi
