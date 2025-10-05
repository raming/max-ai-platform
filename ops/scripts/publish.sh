#!/usr/bin/env bash
set -euo pipefail

# Publish a delivery branch and open a PR/MR to the client host.
# Supports docs inclusion: summary (default), copy, or none.

# Config defaults (can be overridden by config file, env vars, or flags)
CONFIG_FILE="${OPS_PUBLISH_CONFIG:-$(dirname "$0")/../config/client_publish.yaml}"
HOST_DEFAULT="github"
BASE_DEFAULT="main"
TEMPLATE_DEFAULT="feature/{ticket}-{slug}"
INCLUDE_DOCS_DEFAULT="summary"

usage() {
  cat <<USAGE
Usage: $0 --ticket TICKET [--client-remote client] [--host github|gitlab|bitbucket] \\
          [--base BASE] [--template 'feature/{ticket}-{slug}'] \\
          [--include-docs summary|copy|none] [--ops-dir PATH] [--commit-docs]

Env vars:
  GH_CLIENT_TOKEN, GL_TOKEN, BB_USER, BB_TOKEN
  OPS_DIR: path to your ops repo (defaults to parent of this script)
  DOC_SUMMARIZER_CMD: optional command to generate summaries (stdin->stdout)
USAGE
}

# Parse args
CLIENT_REMOTE="client"
TICKET=""
HOST=""
BASE_BRANCH=""
BRANCH_TEMPLATE=""
INCLUDE_DOCS=""
OPS_DIR="${OPS_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
COMMIT_DOCS="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket) TICKET="$2"; shift 2;;
    --client-remote) CLIENT_REMOTE="$2"; shift 2;;
    --host) HOST="$2"; shift 2;;
    --base) BASE_BRANCH="$2"; shift 2;;
    --template) BRANCH_TEMPLATE="$2"; shift 2;;
    --include-docs) INCLUDE_DOCS="$2"; shift 2;;
    --ops-dir) OPS_DIR="$2"; shift 2;;
    --commit-docs) COMMIT_DOCS="true"; shift 1;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1;;
  esac
done

[[ -n "$TICKET" ]] || { echo "--ticket is required" >&2; exit 1; }

# Read config file (very small YAML reader using grep/sed)
val_from_yaml() { # key path e.g. host
  local key="$1"
  sed -n "s/^$key:[[:space:]]*\(.*\)$/\1/p" "$CONFIG_FILE" | head -n1 | tr -d '"'
}

default_host=$(val_from_yaml host || true); default_host=${default_host:-$HOST_DEFAULT}
default_base=$(val_from_yaml base_branch || true); default_base=${default_base:-$BASE_DEFAULT}
default_tmpl=$(val_from_yaml branch_template || true); default_tmpl=${default_tmpl:-$TEMPLATE_DEFAULT}
default_mode=$(val_from_yaml include_docs || true); default_mode=${default_mode:-$INCLUDE_DOCS_DEFAULT}

HOST=${HOST:-${HOST:-$default_host}}
[[ -n "$HOST" ]] || HOST="$default_host"
BASE_BRANCH=${BASE_BRANCH:-${BASE_BRANCH:-$default_base}}
BRANCH_TEMPLATE=${BRANCH_TEMPLATE:-${BRANCH_TEMPLATE:-$default_tmpl}}
INCLUDE_DOCS=${INCLUDE_DOCS:-${INCLUDE_DOCS:-$default_mode}}

# Determine client default branch if not set
if [[ -z "$BASE_BRANCH" || "$BASE_BRANCH" == "auto" ]]; then
  BASE_BRANCH=$(git remote show "$CLIENT_REMOTE" | awk '/HEAD branch/ {print $NF}')
fi

# Fetch and rebase
git fetch "$CLIENT_REMOTE" --no-tags
DEFAULT_BRANCH_REF="$CLIENT_REMOTE/$BASE_BRANCH"

git diff --quiet || { echo "Working tree not clean" >&2; exit 1; }

# Current branch and slug
CURR=$(git rev-parse --abbrev-ref HEAD)
SLUG=$(echo "$CURR" | tr '/ ' '-' | tr -cd '[:alnum:]-')
DELIVER_BRANCH=$(echo "$BRANCH_TEMPLATE" | sed "s/{ticket}/$TICKET/g" | sed "s/{slug}/$SLUG/g")

# Rebase and create delivery branch via squash for clean history
TMP_INT_BRANCH="int/$TICKET"

git switch -c "$TMP_INT_BRANCH" "$DEFAULT_BRANCH_REF" >/dev/null 2>&1 || git switch "$TMP_INT_BRANCH"
# Merge current branch into integration branch
git merge --no-ff --no-edit "$CURR"

# Create clean delivery branch from base and squash merge
DELIVERY_START_REF="$DEFAULT_BRANCH_REF"
DELIVERY_MSG="feat: deliver $TICKET from $CURR"

git switch -c "$DELIVER_BRANCH" "$DELIVERY_START_REF"
# Squash the integration work
if git merge --squash "$TMP_INT_BRANCH"; then
  git commit -m "$DELIVERY_MSG"
else
  echo "Merge failed; resolve conflicts then commit and rerun push step." >&2
fi

# Optional: include docs (copy or summary)
expand_template() { echo "$1" | sed "s/{ticket}/$TICKET/g"; }
SPEC_FILE_OPS=$(expand_template "$(val_from_yaml spec_path_template)")
DESIGN_FILE_OPS=$(expand_template "$(val_from_yaml design_path_template)")
SPEC_PATH="$OPS_DIR/$SPEC_FILE_OPS"
DESIGN_PATH="$OPS_DIR/$DESIGN_FILE_OPS"

PR_BODY_SECTIONS=""

if [[ "$INCLUDE_DOCS" == "copy" || ( "$INCLUDE_DOCS" == "summary" && "$COMMIT_DOCS" == "true" ) ]]; then
  # Copy mode (or commit summaries if requested)
  dest_dir=$(val_from_yaml 'copy:\n  dest_dir' || true)
  if [[ -z "$dest_dir" ]]; then dest_dir="docs/requirements"; fi
  mkdir -p "$dest_dir"
  for f in "$SPEC_PATH" "$DESIGN_PATH"; do
    if [[ -f "$f" ]]; then
      cp "$f" "$dest_dir/"
      git add "$dest_dir/$(basename "$f")"
    fi
  done
  if ! git diff --cached --quiet; then
    git commit -m "docs($TICKET): include spec/design"
  fi
fi

if [[ "$INCLUDE_DOCS" == "summary" ]]; then
  # Build summaries for PR body only
  summarizer="${DOC_SUMMARIZER_CMD:-}"
  if [[ -n "$summarizer" && -f "$SPEC_PATH" ]]; then
    spec_excerpt=$(cat "$SPEC_PATH" | eval "$summarizer" || sed -n '1,200p' "$SPEC_PATH")
  elif [[ -f "$SPEC_PATH" ]]; then
    spec_excerpt=$(sed -n '1,200p' "$SPEC_PATH")
  else spec_excerpt="N/A"; fi
  if [[ -n "$summarizer" && -f "$DESIGN_PATH" ]]; then
    design_excerpt=$(cat "$DESIGN_PATH" | eval "$summarizer" || sed -n '1,200p' "$DESIGN_PATH")
  elif [[ -f "$DESIGN_PATH" ]]; then
    design_excerpt=$(sed -n '1,200p' "$DESIGN_PATH")
  else design_excerpt="N/A"; fi
  PR_BODY_SECTIONS=$(cat <<EOF
Spec (excerpt)
----------------
${spec_excerpt}

Design (excerpt)
----------------
${design_excerpt}
EOF
)
fi

# Push branch
git push -u "$CLIENT_REMOTE" "$DELIVER_BRANCH"

# Compose PR/MR body
BODY=$(cat <<EOF
Links
- Internal task: $TICKET

$PR_BODY_SECTIONS

Checklist
- [ ] Tests included
- [ ] Docs/CHANGELOG updated if applicable
- [ ] Security considerations addressed
EOF
)

# Open PR/MR
case "$HOST" in
  github)
    : "${GH_CLIENT_TOKEN:?Set GH_CLIENT_TOKEN for GitHub}"
    export GITHUB_TOKEN="$GH_CLIENT_TOKEN"
    gh pr create --base "$BASE_BRANCH" --head "$DELIVER_BRANCH" --title "[$TICKET] Delivery" --body "$BODY"
    ;;
  gitlab)
    : "${GL_TOKEN:?Set GL_TOKEN for GitLab}"
    glab mr create --source-branch "$DELIVER_BRANCH" --target-branch "$BASE_BRANCH" --title "[$TICKET] Delivery" --description "$BODY"
    ;;
  bitbucket)
    : "${BB_TOKEN:?Set BB_TOKEN for Bitbucket}"; : "${BB_USER:?Set BB_USER for Bitbucket}"
    URL=$(git remote get-url "$CLIENT_REMOTE")
    WS=$(echo "$URL" | awk -F'bitbucket.org/' '{print $2}' | cut -d'/' -f1)
    REPO=$(echo "$URL" | awk -F'bitbucket.org/' '{print $2}' | cut -d'/' -f2 | sed 's/.git$//')
    json=$(jq -n --arg title "[$TICKET] Delivery" --arg src "$DELIVER_BRANCH" --arg dst "$BASE_BRANCH" --arg body "$BODY" \
      '{title:$title, source:{branch:{name:$src}}, destination:{branch:{name:$dst}}, description:$body}')
    curl -sSf -u "$BB_USER:$BB_TOKEN" -H "Content-Type: application/json" \
      -X POST "https://api.bitbucket.org/2.0/repositories/$WS/$REPO/pullrequests" -d "$json" >/dev/null
    echo "Bitbucket PR created."
    ;;
  *) echo "Unsupported host: $HOST" >&2; exit 1;;
fi
