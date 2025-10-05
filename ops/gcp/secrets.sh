#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage:
  $0 create-secret NAME
  $0 add-version NAME

Notes:
- add-version reads secret content from stdin; press CTRL-D when finished.
EOF
}

if [[ $# -lt 2 ]]; then usage; exit 1; fi

CMD="$1"; NAME="$2"; shift 2 || true

case "$CMD" in
  create-secret)
    gcloud secrets create "$NAME" --replication-policy=automatic || true
    ;;
  add-version)
    echo "Paste secret content, then CTRL-D:" >&2
    gcloud secrets versions add "$NAME" --data-file=-
    ;;
  *) usage; exit 1 ;;
 esac
