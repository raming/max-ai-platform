#!/usr/bin/env bash
set -euo pipefail

ID="${1:-}" # e.g., PROJ-1234
TITLE="${2:-}" # short title
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$ID" || -z "$TITLE" ]]; then
  echo "Usage: $0 PROJ-1234 'Short title'" >&2; exit 1
fi

slug=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]+/-/g; s/^-\|-$//g')

spec_path="$BASE_DIR/tracker/specs/${ID}.md"
design_path="$BASE_DIR/docs/design/${ID}.md"

mkdir -p "$(dirname "$spec_path")" "$(dirname "$design_path")"

if [[ ! -f "$spec_path" ]]; then
  cat > "$spec_path" <<EOF
# ${ID}: ${TITLE}
Status: Draft
Owner: ARCH-01

Acceptance Criteria
- 

Non-Functional Requirements
- 

Links
- ADRs: 
- Design: ../docs/design/${ID}.md
- Related tasks: 

Context
Describe background, user stories, constraints.
EOF
  echo "Created $spec_path"
fi

if [[ ! -f "$design_path" ]]; then
  cat > "$design_path" <<EOF
# ${ID}: ${TITLE} — Design

Overview
Goals / Non-goals
Architecture
Data model / APIs
Risks / Open questions
Test strategy impacts
EOF
  echo "Created $design_path"
fi
