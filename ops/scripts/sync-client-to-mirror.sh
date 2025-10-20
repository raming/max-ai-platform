#!/usr/bin/env bash
set -euo pipefail

# sync-client-to-mirror.sh
# Sync latest changes from client repositories to mirror repository
# This updates the mirror repo's client/ and backend/ directories with latest client code

# Usage:
# ./sync-client-to-mirror.sh --mirror-repo /path/to/mirror/repo [--frontend-repo /path/to/frontend] [--backend-repo /path/to/backend]

# Default values
MIRROR_REPO=""
FRONTEND_REPO="$HOME/projects/Airmeez/airmeez_ui"
BACKEND_REPO="$HOME/projects/Airmeez/api/airmeez_platform_backend"
DRY_RUN=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mirror-repo)
      MIRROR_REPO="$2"
      shift 2
      ;;
    --frontend-repo)
      FRONTEND_REPO="$2"
      shift 2
      ;;
    --backend-repo)
      BACKEND_REPO="$2"
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
      echo "Usage: $0 --mirror-repo <path> [--frontend-repo <path>] [--backend-repo <path>] [--dry-run] [--verbose]"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$MIRROR_REPO" ]]; then
  echo "Error: --mirror-repo is required"
  exit 1
fi

# Validate directories exist
if [[ ! -d "$MIRROR_REPO" ]]; then
  echo "Error: Mirror repository directory does not exist: $MIRROR_REPO"
  exit 1
fi

if [[ ! -d "$FRONTEND_REPO" ]]; then
  echo "Warning: Frontend repository directory does not exist: $FRONTEND_REPO"
  echo "Skipping frontend sync"
  FRONTEND_REPO=""
fi

if [[ ! -d "$BACKEND_REPO" ]]; then
  echo "Warning: Backend repository directory does not exist: $BACKEND_REPO"
  echo "Skipping backend sync"
  BACKEND_REPO=""
fi

if [[ -z "$FRONTEND_REPO" && -z "$BACKEND_REPO" ]]; then
  echo "Error: No valid client repositories found"
  exit 1
fi

echo "🔄 Syncing client repositories to mirror"
echo "   Mirror: $MIRROR_REPO"
if [[ -n "$FRONTEND_REPO" ]]; then
  echo "   Frontend: $FRONTEND_REPO"
fi
if [[ -n "$BACKEND_REPO" ]]; then
  echo "   Backend: $BACKEND_REPO"
fi
echo ""

# Function to sync a client repo to mirror subdir
sync_client_to_mirror() {
  local client_repo="$1"
  local mirror_subdir="$2"
  local repo_name="$3"

  echo "📥 Syncing $repo_name..."

  # Check if client repo has uncommitted changes
  if [[ -n "$(cd "$client_repo" && git status --porcelain)" ]]; then
    echo "⚠️  Warning: $repo_name has uncommitted changes"
    if ! $DRY_RUN; then
      read -p "Continue anyway? (y/N): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping $repo_name sync"
        return 1
      fi
    fi
  fi

  # Pull latest changes in client repo
  if ! $DRY_RUN; then
    echo "   Pulling latest changes in $repo_name..."
    (cd "$client_repo" && git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "Could not pull - continuing with local changes")
  fi

  # Copy to mirror (excluding .git and ignored files)
  local mirror_path="$MIRROR_REPO/$mirror_subdir"

  if $VERBOSE; then
    echo "   Copying from $client_repo/ to $mirror_path/"
  fi

  if ! $DRY_RUN; then
    # Create mirror directory if it doesn't exist
    mkdir -p "$mirror_path"

    # Use rsync to copy, excluding .git and common build artifacts
    rsync -a --delete \
      --exclude='.git/' \
      --exclude='node_modules/' \
      --exclude='dist/' \
      --exclude='build/' \
      --exclude='bin/' \
      --exclude='*.log' \
      --exclude='.env*' \
      "$client_repo/" "$mirror_path/"

    echo "✅ $repo_name synced successfully"
  else
    echo "   (dry run) Would copy from $client_repo/ to $mirror_path/"
  fi

  return 0
}

# Sync frontend if available
if [[ -n "$FRONTEND_REPO" ]]; then
  sync_client_to_mirror "$FRONTEND_REPO" "client" "frontend"
fi

# Sync backend if available
if [[ -n "$BACKEND_REPO" ]]; then
  sync_client_to_mirror "$BACKEND_REPO" "backend" "backend"
fi

echo ""
echo "🔍 Checking mirror repository status..."

if ! $DRY_RUN; then
  # Check git status in mirror repo
  (cd "$MIRROR_REPO" && echo "Git status in mirror repo:" && git status --porcelain | head -10)

  echo ""
  echo "📋 Next steps:"
  echo "   1. Review changes in mirror repo: cd $MIRROR_REPO && git diff"
  echo "   2. Commit changes if needed: git add client/ backend/ && git commit -m 'sync: update client/backend code'"
  echo "   3. Push to remote if ready: git push origin main"
else
  echo "   (dry run) No actual changes made"
fi

echo ""
echo "✅ Client to mirror sync complete!"