#!/usr/bin/env bash
set -euo pipefail

# sync-docs-to-repo.sh
# Selectively sync documentation from ops repo to client repositories
# based on target metadata in docs-index.yaml

# Usage:
# ./sync-docs-to-repo.sh \
#   --project "airmeez" \
#   --target "frontend" \
#   --source-docs "/path/to/ops/docs" \
#   --target-repo "/path/to/client/repo"

# Default values
PROJECT=""
TARGET=""
SOURCE_DOCS=""
TARGET_REPO=""
DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      PROJECT="$2"
      shift 2
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --source-docs)
      SOURCE_DOCS="$2"
      shift 2
      ;;
    --target-repo)
      TARGET_REPO="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --project <name> --target <frontend|backend> --source-docs <path> --target-repo <path> [--dry-run] [--verbose]"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$PROJECT" || -z "$TARGET" || -z "$SOURCE_DOCS" || -z "$TARGET_REPO" ]]; then
  echo "Error: All parameters are required"
  echo "Usage: $0 --project <name> --target <frontend|backend> --source-docs <path> --target-repo <path> [--dry-run] [--verbose]"
  exit 1
fi

# Validate directories exist
if [[ ! -d "$SOURCE_DOCS" ]]; then
  echo "Error: Source docs directory does not exist: $SOURCE_DOCS"
  exit 1
fi

if [[ ! -d "$TARGET_REPO" ]]; then
  echo "Error: Target repo directory does not exist: $TARGET_REPO"
  exit 1
fi

# Check for yq (YAML processor)
if ! command -v yq >/dev/null 2>&1; then
  echo "Error: yq is required for YAML processing. Install from https://github.com/mikefarah/yq"
  exit 1
fi

INDEX_FILE="$SOURCE_DOCS/docs-index.yaml"
if [[ ! -f "$INDEX_FILE" ]]; then
  echo "Error: Documentation index not found: $INDEX_FILE"
  exit 1
fi

echo "📚 Syncing documentation for $PROJECT ($TARGET)"
echo "   Source: $SOURCE_DOCS"
echo "   Target: $TARGET_REPO"
echo "   Index: $INDEX_FILE"
echo ""

# Get total number of docs in index
TOTAL_DOCS=$(yq '.docs | length' "$INDEX_FILE")

if [[ "$TOTAL_DOCS" == "0" ]]; then
  echo "No documents found in index"
  exit 0
fi

echo "📋 Found $TOTAL_DOCS documents in index"

# Find docs that target this repository
TARGET_DOCS=()
for ((i=0; i<TOTAL_DOCS; i++)); do
  # Check if this target is in the targets array
  TARGET_MATCH=$(yq -r ".docs[$i].targets[] | select(. == \"$TARGET\")" "$INDEX_FILE" 2>/dev/null || true)
  
  if [[ -n "$TARGET_MATCH" ]]; then
    DOC_PATH=$(yq -r ".docs[$i].path" "$INDEX_FILE")
    DOC_TITLE=$(yq -r ".docs[$i].title" "$INDEX_FILE")
    TARGET_DOCS+=("$DOC_PATH|$DOC_TITLE")
  fi
done

if [[ ${#TARGET_DOCS[@]} -eq 0 ]]; then
  echo "No documents found for target: $TARGET"
  exit 0
fi

echo "🎯 Found ${#TARGET_DOCS[@]} documents for target '$TARGET':"
for doc_info in "${TARGET_DOCS[@]}"; do
  IFS='|' read -r doc_path doc_title <<< "$doc_info"
  echo "   • $doc_path - $doc_title"
done
echo ""

# Create target docs directory
TARGET_DOCS_DIR="$TARGET_REPO/docs"
if ! $DRY_RUN; then
  mkdir -p "$TARGET_DOCS_DIR"
fi

# Sync each document
SYNCED_COUNT=0
SKIPPED_COUNT=0

for doc_info in "${TARGET_DOCS[@]}"; do
  IFS='|' read -r doc_path doc_title <<< "$doc_info"
  
  SOURCE_FILE="$SOURCE_DOCS/$doc_path"
  TARGET_FILE="$TARGET_DOCS_DIR/$doc_path"
  
  if [[ ! -f "$SOURCE_FILE" ]]; then
    echo "⚠️  Warning: Source file not found: $SOURCE_FILE"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  if $VERBOSE; then
    echo "📄 Syncing: $doc_path"
  fi
  
  if ! $DRY_RUN; then
    # Create target directory
    mkdir -p "$(dirname "$TARGET_FILE")"
    
    # Copy file
    cp "$SOURCE_FILE" "$TARGET_FILE"
    
    # Add sync metadata as comment at the end
    SYNC_METADATA="---
# Synced from: $PROJECT ops repository
# Target: $TARGET
# Sync Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Source Path: $doc_path
"
    echo "$SYNC_METADATA" >> "$TARGET_FILE"
  fi
  
  SYNCED_COUNT=$((SYNCED_COUNT + 1))
done

echo ""
echo "✅ Documentation sync complete!"
echo "   Synced: $SYNCED_COUNT documents"
if [[ $SKIPPED_COUNT -gt 0 ]]; then
  echo "   Skipped: $SKIPPED_COUNT documents (missing source files)"
fi

if $DRY_RUN; then
  echo "   (Dry run - no files actually copied)"
fi

echo ""
echo "📋 Next steps:"
echo "   1. Review synced docs in: $TARGET_DOCS_DIR"
echo "   2. Commit changes in target repository"
echo "   3. Create PR if needed for client review"
echo ""
echo "🔍 To see sync details, run with --verbose flag"