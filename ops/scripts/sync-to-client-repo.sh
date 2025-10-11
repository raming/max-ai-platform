#!/usr/bin/env bash
set -euo pipefail

# sync-to-client-repo.sh
# Sync completed contract work from private mirror repo to client repo
# Maintains clean separation between internal AI agent work and client deliveries

# Usage:
# ./sync-to-client-repo.sh \
#   --private-repo /path/to/private/airmeez-mirror \
#   --client-repo /path/to/client/airmeez \
#   --task-id AIRMEEZ-123 \
#   --feature-name user-auth

# Default values
PRIVATE_REPO=""
CLIENT_REPO=""
TASK_ID=""
FEATURE_NAME=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --private-repo)
      PRIVATE_REPO="$2"
      shift 2
      ;;
    --client-repo)
      CLIENT_REPO="$2"
      shift 2
      ;;
    --task-id)
      TASK_ID="$2"
      shift 2
      ;;
    --feature-name)
      FEATURE_NAME="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --private-repo <path> --client-repo <path> --task-id <id> --feature-name <name> [--dry-run]"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$PRIVATE_REPO" || -z "$CLIENT_REPO" || -z "$TASK_ID" || -z "$FEATURE_NAME" ]]; then
  echo "Error: All parameters are required"
  echo "Usage: $0 --private-repo <path> --client-repo <path> --task-id <id> --feature-name <name> [--dry-run]"
  exit 1
fi

# Validate directories exist
if [[ ! -d "$PRIVATE_REPO" ]]; then
  echo "Error: Private repo directory does not exist: $PRIVATE_REPO"
  exit 1
fi

if [[ ! -d "$CLIENT_REPO" ]]; then
  echo "Error: Client repo directory does not exist: $CLIENT_REPO"
  exit 1
fi

# Branch names
PRIVATE_BRANCH="work/dev/${TASK_ID}-${FEATURE_NAME}"
CLIENT_BRANCH="feature/${TASK_ID}-${FEATURE_NAME}"

echo "🔄 Syncing contract work to client repo"
echo "   Private repo: $PRIVATE_REPO"
echo "   Client repo: $CLIENT_REPO"
echo "   Task: $TASK_ID"
echo "   Feature: $FEATURE_NAME"
echo "   From branch: $PRIVATE_BRANCH"
echo "   To branch: $CLIENT_BRANCH"
echo ""

# Check if private branch exists
cd "$PRIVATE_REPO"
if ! git show-ref --verify --quiet "refs/heads/$PRIVATE_BRANCH"; then
  echo "Error: Private branch does not exist: $PRIVATE_BRANCH"
  exit 1
fi

# Check if we're on a clean state
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Private repo has uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Switch to private branch and get the changes
echo "📋 Analyzing changes in private branch..."
git checkout "$PRIVATE_BRANCH"

# Get list of changed files (excluding internal ops content)
# This is a simplified approach - in practice you'd want more sophisticated filtering
CHANGED_FILES=$(git diff --name-only main...HEAD | grep -v -E "^(ops/|\.agents/|\.github/)" || true)

if [[ -z "$CHANGED_FILES" ]]; then
  echo "No client-visible changes found in this branch."
  echo "This might be ops-only work or the branch is empty."
  exit 0
fi

echo "📁 Files to sync:"
echo "$CHANGED_FILES" | sed 's/^/   /'
echo ""

# Switch to client repo
cd "$CLIENT_REPO"

# Ensure we're on master/main and clean
MAIN_BRANCH=$(git branch --show-current 2>/dev/null || git symbolic-ref --short HEAD 2>/dev/null || echo "master")
if [[ "$MAIN_BRANCH" != "main" && "$MAIN_BRANCH" != "master" ]]; then
  echo "Warning: Client repo not on main/master branch. Current: $MAIN_BRANCH"
  if ! $DRY_RUN; then
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Client repo has uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Create or checkout client feature branch
if git show-ref --verify --quiet "refs/heads/$CLIENT_BRANCH"; then
  echo "🔄 Updating existing client branch: $CLIENT_BRANCH"
  git checkout "$CLIENT_BRANCH"
  git merge "$MAIN_BRANCH" --no-ff -m "sync: merge latest from $MAIN_BRANCH" || true
else
  echo "🌱 Creating new client branch: $CLIENT_BRANCH"
  if ! $DRY_RUN; then
    git checkout -b "$CLIENT_BRANCH"
  fi
fi

# Copy changes from private repo (simplified - in production use git patches or more robust method)
echo "📋 Applying changes to client repo..."

if ! $DRY_RUN; then
  # This is a simplified approach. In production, you'd want to:
  # 1. Create patches from private repo
  # 2. Apply patches to client repo
  # 3. Handle conflicts properly
  # 4. Clean commit messages

  # For now, we'll use a basic rsync approach for changed files
  for file in $CHANGED_FILES; do
    if [[ -f "$PRIVATE_REPO/$file" ]]; then
      mkdir -p "$(dirname "$file")"
      cp "$PRIVATE_REPO/$file" "$file"
      git add "$file"
    fi
  done

  # Create clean commit
  COMMIT_MSG="feat: $FEATURE_NAME

Task: $TASK_ID
Source: Contract delivery from private development

Changes:
$(echo "$CHANGED_FILES" | sed 's/^/- /')"

  git commit -m "$COMMIT_MSG" || echo "No changes to commit"
fi

echo "✅ Sync complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes in client repo branch: $CLIENT_BRANCH"
echo "   2. Test the changes in client environment"
echo "   3. Create PR from $CLIENT_BRANCH → $MAIN_BRANCH in client GitBucket"
echo "   4. Send PR link to airmeez manager for review"
echo ""
echo "🔒 Remember: This sync only includes code changes."
echo "   Internal ops content (.agents/, ops/, .github/) is excluded."