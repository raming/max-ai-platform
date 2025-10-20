#!/usr/bin/env bash
# validate-labels.sh
# Check for issues using undefined labels and report inconsistencies
# Usage: ./validate-labels.sh [--fix]

set -euo pipefail

FIX_MODE=false
if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
  echo "🔧 FIX MODE - Will offer to correct undefined labels"
fi

# Find project ops directory
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-.}
cd "$PROJECT_OPS_DIR"

if [[ ! -f "config/labels.yaml" ]]; then
  echo "❌ ERROR: config/labels.yaml not found" >&2
  exit 1
fi

# Get repository
if ! REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
  echo "❌ ERROR: Could not determine GitHub repository" >&2
  exit 1
fi

echo "🔍 Validating labels in $REPO"
echo ""

# Check if yq is installed
if ! command -v yq &> /dev/null; then
  echo "❌ ERROR: yq is required but not installed" >&2
  echo "   Install with: brew install yq" >&2
  exit 1
fi

# Get all defined labels
DEFINED_LABELS=$(cat config/labels.yaml config/labels-project.yaml 2>/dev/null | \
  yq -r '.labels[]?.name, .project_labels[]?.name' 2>/dev/null | sort -u)

echo "==> Defined labels:"
echo "$DEFINED_LABELS" | sed 's/^/   /'
echo ""

# Get all labels used in open issues
echo "==> Checking open issues for undefined labels..."
USED_LABELS=$(gh issue list --json labels --state open -L 1000 | \
  jq -r '.[].labels[].name' 2>/dev/null | sort -u)

UNDEFINED_FOUND=false
UNDEFINED_LABELS=()

while read -r label; do
  if [[ -n "$label" ]] && ! echo "$DEFINED_LABELS" | grep -qx "$label"; then
    if [[ "$UNDEFINED_FOUND" == "false" ]]; then
      echo ""
      echo "⚠️  Undefined labels in use:"
      UNDEFINED_FOUND=true
    fi
    
    UNDEFINED_LABELS+=("$label")
    echo ""
    echo "   Label: $label"
    
    # Show issues using this label
    ISSUE_COUNT=$(gh issue list --label "$label" --json number --state open | jq '. | length')
    echo "   Used by $ISSUE_COUNT issue(s):"
    gh issue list --label "$label" --json number,title --state open -q '.[] | "      #\(.number): \(.title)"'
  fi
done <<< "$USED_LABELS"

if [[ "$UNDEFINED_FOUND" == "false" ]]; then
  echo "   ✅ All labels are properly defined"
fi

echo ""

# Check for issues without required labels
echo "==> Checking for issues missing required labels..."
MISSING_TYPE=0
MISSING_SEAT=0

while IFS=$'\t' read -r number title labels; do
  # Check for type: label
  if ! echo "$labels" | grep -q "type:"; then
    if [[ "$MISSING_TYPE" == "0" ]]; then
      echo ""
      echo "⚠️  Issues missing type: label:"
    fi
    echo "   #$number: $title"
    ((MISSING_TYPE++))
  fi
  
  # Check for seat: label
  if ! echo "$labels" | grep -q "seat:"; then
    if [[ "$MISSING_SEAT" == "0" ]]; then
      echo ""
      echo "⚠️  Issues missing seat: label:"
    fi
    echo "   #$number: $title"
    ((MISSING_SEAT++))
  fi
done < <(gh issue list --json number,title,labels --state open -L 1000 | \
  jq -r '.[] | [.number, .title, (.labels | map(.name) | join(","))] | @tsv')

if [[ "$MISSING_TYPE" == "0" ]] && [[ "$MISSING_SEAT" == "0" ]]; then
  echo "   ✅ All issues have required labels (type:, seat:)"
fi

echo ""

# Summary
echo "==> Summary:"
if [[ "$UNDEFINED_FOUND" == "true" ]]; then
  echo "   ⚠️  ${#UNDEFINED_LABELS[@]} undefined label(s) found"
  echo ""
  echo "   💡 Recommended actions:"
  echo "      1. Review undefined labels above"
  echo "      2. For valid labels: Add to config/labels-project.yaml"
  echo "      3. For invalid labels: Re-label issues with correct labels"
  echo "      4. Run scripts/sync-labels.sh after updating definitions"
  echo ""
  
  # Suggest similar labels
  for undefined in "${UNDEFINED_LABELS[@]}"; do
    echo "   Suggestions for '$undefined':"
    # Find similar defined labels
    while read -r defined; do
      if [[ "$defined" == *"$undefined"* ]] || [[ "$undefined" == *"$defined"* ]]; then
        echo "      - Use '$defined' instead?"
      fi
    done <<< "$DEFINED_LABELS"
  done
else
  echo "   ✅ No undefined labels found"
fi

if [[ "$MISSING_TYPE" -gt "0" ]] || [[ "$MISSING_SEAT" -gt "0" ]]; then
  echo "   ⚠️  $MISSING_TYPE issue(s) missing type: label"
  echo "   ⚠️  $MISSING_SEAT issue(s) missing seat: label"
fi

echo ""

# Fix mode
if [[ "$FIX_MODE" == "true" ]] && [[ "$UNDEFINED_FOUND" == "true" ]]; then
  echo "🔧 FIX MODE: Generating fix commands"
  echo ""
  echo "   Copy and run these commands to fix undefined labels:"
  echo ""
  
  for undefined in "${UNDEFINED_LABELS[@]}"; do
    # Get issues with this label
    ISSUE_NUMBERS=$(gh issue list --label "$undefined" --json number --state open -q '.[].number')
    
    if [[ -n "$ISSUE_NUMBERS" ]]; then
      echo "   # Fix issues with label: $undefined"
      
      # Try to suggest a replacement
      SUGGESTED=""
      while read -r defined; do
        if [[ "$defined" == *"$undefined"* ]] || [[ "$undefined" == *"$defined"* ]]; then
          SUGGESTED="$defined"
          break
        fi
      done <<< "$DEFINED_LABELS"
      
      if [[ -n "$SUGGESTED" ]]; then
        for issue_num in $ISSUE_NUMBERS; do
          echo "   gh issue edit $issue_num --remove-label '$undefined' --add-label '$SUGGESTED'"
        done
      else
        for issue_num in $ISSUE_NUMBERS; do
          echo "   gh issue edit $issue_num --remove-label '$undefined'  # Add correct label manually"
        done
      fi
      echo ""
    fi
  done
fi

if [[ "$UNDEFINED_FOUND" == "true" ]]; then
  exit 1
else
  echo "✅ Label validation passed"
  exit 0
fi
