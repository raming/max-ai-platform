#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Install the internal .ops snapshot into a client repo (working copy).

Options:
  --target PATH   Path to client repository (required)
  --dry-run       Print actions without making changes
USAGE
}

TARGET=""
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

if [[ -z "${TARGET}" ]]; then
  echo "--target is required" >&2; usage; exit 1
fi
if [[ ! -d "${TARGET}" ]]; then
  echo "Target directory not found: ${TARGET}" >&2; exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
SRC="${ROOT_DIR}/ops-snapshot/.ops"
if [[ ! -d "${SRC}" ]]; then
  echo "Snapshot not found: ${SRC}" >&2; exit 1
fi

if [[ ${DRY_RUN} -eq 1 ]]; then
  echo "DRY-RUN: rsync -a --exclude _private --exclude .contractor ${SRC}/ ${TARGET}/.ops/"
else
  rsync -a --exclude _private --exclude .contractor "${SRC}/" "${TARGET}/.ops/"
fi

echo "Installed .ops snapshot to ${TARGET}/.ops/"
