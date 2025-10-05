#!/usr/bin/env bash
set -euo pipefail

# create_agent_instances.sh
# Generate Warp agent instance files under .agents/rules/instances
# Usage:
#   scripts/create_agent_instances.sh <role> <name1> [name2 ...]
# Options:
#   --dir <path>   Optional target instances directory (default: repo/.agents/rules/instances)
#   --force        Overwrite files if they already exist
# Examples:
#   scripts/create_agent_instances.sh dev Alice Bob
#   scripts/create_agent_instances.sh qa "Chris Doe" --force

TARGET_DIR=""
FORCE=false

role=""
names=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      TARGET_DIR="$2"; shift 2 ;;
    --force)
      FORCE=true; shift ;;
    -h|--help)
      sed -n '2,200p' "$0"; exit 0 ;;
    *)
      if [[ -z "$role" ]]; then
        role="$1"; shift
      else
        names+=("$1"); shift
      fi ;;
  esac
done

if [[ -z "${role}" || ${#names[@]} -eq 0 ]]; then
  echo "Usage: scripts/create_agent_instances.sh <role> <name1> [name2 ...] [--dir <path>] [--force]" >&2
  exit 1
fi

# Determine repo root = script dir/..
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_INST_DIR="${REPO_ROOT}/.agents/rules/instances"
INST_DIR="${TARGET_DIR:-$DEFAULT_INST_DIR}"

mkdir -p "$INST_DIR"

slugify() {
  # to-lower, replace non-alnum with '-', trim leading/trailing '-'
  printf "%s" "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9\-\._\+]/-/g; s/^-\+//; s/\-\+$//'
}

for full_name in "${names[@]}"; do
  seat_slug="$(slugify "$full_name")"
  file_path="${INST_DIR}/${role}.${seat_slug}.md"
  if [[ -f "$file_path" && "$FORCE" != true ]]; then
    echo "Skipping existing $file_path (use --force to overwrite)"
    continue
  fi
  cat > "$file_path" <<EOF
---
name: ${role^} — ${full_name}
role: ${role}
seat: ${seat_slug}
# See ../context.md for project settings and ../${role}.md for base role conventions
---
You are ${full_name}, a ${role} on this project.
Follow the base ${role} expectations (../${role}.md) and project context (../context.md).
Use the tracker ID prefix and branch naming defined in context.md.
EOF
  echo "Created $file_path"
 done
