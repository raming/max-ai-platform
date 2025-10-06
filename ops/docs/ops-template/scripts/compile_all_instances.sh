#!/usr/bin/env bash
set -euo pipefail

# compile_all_instances.sh (template)
# Compose prompts for all instance files under .agents/rules/instances and write to an output directory.
# Usage:
#   scripts/compile_all_instances.sh [--out <dir>] [--skip-context]

OUT_DIR="compiled-prompts"
SKIP_CONTEXT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      OUT_DIR="$2"; shift 2 ;;
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
INST_DIR="${RULES_DIR}/instances"
COMPOSE="${SCRIPT_DIR}/compose_agent_prompt.sh"

mkdir -p "$OUT_DIR"
shopt -s nullglob
for f in "$INST_DIR"/*.md; do
  base="$(basename "$f")"
  # Skip folder readme or non-instance files
  if [[ "$base" == "README.md" ]]; then
    continue
  fi
  role="${base%%.*}"
  seat="${base#*.}"; seat="${seat%.md}"
  out_file="${OUT_DIR}/${role}.${seat}.md"
  if [[ "$SKIP_CONTEXT" == true ]]; then
    "$COMPOSE" "$role" "$seat" --skip-context > "$out_file"
  else
    "$COMPOSE" "$role" "$seat" > "$out_file"
  fi
  echo "Wrote $out_file"
done
