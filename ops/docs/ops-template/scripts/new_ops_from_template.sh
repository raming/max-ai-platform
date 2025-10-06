#!/usr/bin/env bash
set -euo pipefail

# Create a new per-client ops repo by copying from ops-template, excluding VCS metadata.
# Usage: new_ops_from_template.sh /absolute/target/dir [--init-git]

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"  # ops-template root
TARGET_DIR="${1:-}"
INIT_GIT=false

if [[ -z "$TARGET_DIR" ]]; then
  echo "Usage: $0 /absolute/target/dir [--init-git]" >&2
  exit 1
fi
if [[ "${2:-}" == "--init-git" ]]; then
  INIT_GIT=true
fi

mkdir -p "$TARGET_DIR"
# Use rsync to exclude .git and OS junk
rsync -a --delete --exclude ".git" --exclude ".DS_Store" "$SRC_DIR/" "$TARGET_DIR/"

if $INIT_GIT; then
  if [[ ! -d "$TARGET_DIR/.git" ]]; then
    git init -b main "$TARGET_DIR" >/dev/null 2>&1 || { git init "$TARGET_DIR"; git -C "$TARGET_DIR" branch -m main; }
  fi
  git -C "$TARGET_DIR" add -A
  git -C "$TARGET_DIR" commit -m "chore(ops): initialize per-client ops repo from template" || true
fi

echo "Per-client ops repo scaffolded at $TARGET_DIR"