#!/usr/bin/env bash
# sync-labels.sh
# Sync labels from config/labels.yaml and config/labels-project.yaml to GitHub
# Usage: ./sync-labels.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - No changes will be made"
fi

# Find project ops directory
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-.}
cd "$PROJECT_OPS_DIR"

if [[ ! -f "config/labels.yaml" ]]; then
  echo "❌ ERROR: config/labels.yaml not found" >&2
  echo "   Are you in the project ops directory?" >&2
  exit 1
fi

# Get repository from git remote
if ! REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
  echo "❌ ERROR: Could not determine GitHub repository" >&2
  echo "   Are you in a git repository with a GitHub remote?" >&2
  exit 1
fi

echo "📋 Syncing labels to $REPO"
echo ""

# Function to create or update label
sync_label() {
  local name=$1
  local color=$2
  local description=$3
  
  # Check if label exists
  if gh label list --json name -q ".[] | select(.name == \"$name\")" 2>/dev/null | grep -q "$name"; then
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "   Would update: $name"
    else
      echo "   Updating: $name"
      if ! gh label edit "$name" --color "$color" --description "$description" 2>/dev/null; then
        echo "   ⚠️  Failed to update $name (may need different color format)"
      fi
    fi
  else
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "   Would create: $name"
    else
      echo "   Creating: $name"
      if ! gh label create "$name" --color "$color" --description "$description" 2>/dev/null; then
        echo "   ⚠️  Failed to create $name"
      fi
    fi
  fi
}

# Check if yq is installed
if ! command -v yq &> /dev/null; then
  echo "❌ ERROR: yq is required but not installed" >&2
  echo "   Install with: brew install yq" >&2
  exit 1
fi

# Sync canonical ops labels
echo "==> Syncing canonical ops labels (config/labels.yaml)"
LABEL_COUNT=0
while IFS=$'\t' read -r name color description; do
  if [[ -n "$name" ]]; then
    sync_label "$name" "$color" "$description"
    ((LABEL_COUNT++))
  fi
done < <(yq -r '.labels[] | [.name, .color, .description] | @tsv' config/labels.yaml)
echo "   Processed $LABEL_COUNT ops labels"
echo ""

# Sync project-specific labels if file exists
if [[ -f "config/labels-project.yaml" ]]; then
  echo "==> Syncing project-specific labels (config/labels-project.yaml)"
  PROJECT_LABEL_COUNT=0
  while IFS=$'\t' read -r name color description; do
    if [[ -n "$name" ]]; then
      sync_label "$name" "$color" "$description"
      ((PROJECT_LABEL_COUNT++))
    fi
  done < <(yq -r '.project_labels[] | [.name, .color, .description] | @tsv' config/labels-project.yaml)
  echo "   Processed $PROJECT_LABEL_COUNT project labels"
  echo ""
else
  echo "⚠️  No config/labels-project.yaml found (project-specific labels)"
  echo "   This is okay if project doesn't have custom labels yet"
  echo ""
fi

# Report on undefined labels in GitHub
echo "==> Checking for undefined labels in GitHub"
DEFINED_LABELS=$(cat config/labels.yaml config/labels-project.yaml 2>/dev/null | \
  yq -r '.labels[]?.name, .project_labels[]?.name' 2>/dev/null | sort -u)

UNDEFINED_COUNT=0
while read -r gh_label; do
  if ! echo "$DEFINED_LABELS" | grep -qx "$gh_label"; then
    if [[ "$UNDEFINED_COUNT" == "0" ]]; then
      echo "   ⚠️  Labels in GitHub but not in definition files:"
    fi
    echo "      - $gh_label"
    ((UNDEFINED_COUNT++))
  fi
done < <(gh label list --json name -q '.[].name' | sort)

if [[ "$UNDEFINED_COUNT" == "0" ]]; then
  echo "   ✅ All GitHub labels are defined"
else
  echo ""
  echo "   💡 Consider:"
  echo "      - Add these labels to config/labels-project.yaml if they're valid"
  echo "      - Or remove them from GitHub if they're obsolete"
  echo "      - Run scripts/validate-labels.sh to see if they're in use"
fi

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo "🔍 DRY RUN COMPLETE - No changes were made"
  echo "   Run without --dry-run to apply changes"
else
  echo "✅ Label sync complete"
fi
