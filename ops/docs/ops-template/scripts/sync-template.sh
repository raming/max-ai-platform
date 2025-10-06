#!/usr/bin/env bash
set -euo pipefail

# sync-template.sh
# Sync canonical ops-template content into downstream projects listed in registry/projects.yaml
# Dry-run by default; use -w to write changes.
# Requires: yq, rsync

WRITE=false
QUIET=false
while getopts ":wq" opt; do
  case $opt in
    w) WRITE=true ;;
    q) QUIET=true ;;
    *) ;;
  esac
done
shift $((OPTIND -1))

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REGISTRY="$ROOT_DIR/registry/projects.yaml"

if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required (https://github.com/mikefarah/yq)" >&2
  exit 1
fi
if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required" >&2
  exit 1
fi

count=$(yq '.projects | length' "$REGISTRY")
for ((i=0; i<count; i++)); do
  NAME=$(yq -r ".projects[$i].name" "$REGISTRY")
  DEST=$(yq -r ".projects[$i].path" "$REGISTRY")
  DEST_EXPANDED=$(eval echo "$DEST")
  if ! $QUIET; then echo "==> Project: $NAME ($DEST_EXPANDED)"; fi

  INCLUDE_LIST=($(yq -r ".projects[$i].sync.include[]" "$REGISTRY"))
  EXCLUDE_LIST=($(yq -r ".projects[$i].sync.exclude[]" "$REGISTRY"))

  RSYNC_ARGS=("-a" "--delete")
  if $QUIET; then RSYNC_ARGS+=("--quiet"); fi
  for ex in "${EXCLUDE_LIST[@]}"; do RSYNC_ARGS+=("--exclude=$ex"); done

  for inc in "${INCLUDE_LIST[@]}"; do
    SRC_PATH="$ROOT_DIR/$inc"
    DEST_PATH="$DEST_EXPANDED/docs/ops-template/${inc%/**}"
    mkdir -p "$DEST_PATH"
    if ! $QUIET; then echo "   Sync: $inc -> $DEST_PATH"; fi
    if $WRITE; then
      rsync "${RSYNC_ARGS[@]}" "$SRC_PATH" "$DEST_PATH/"
    fi
  done
  if ! $WRITE && ! $QUIET; then
    echo "   (dry run) Use -w to write changes"
  fi
  if ! $QUIET; then echo ""; fi
done
