#!/usr/bin/env bash
set -euo pipefail

TARGET_REPO="${1:-}"
if [[ -z "$TARGET_REPO" ]]; then
  echo "Usage: $0 /path/to/client/repo" >&2; exit 1
fi

HOOKS_DIR="$TARGET_REPO/.git/hooks"
EXCLUDE_FILE="$TARGET_REPO/.git/info/exclude"

mkdir -p "$HOOKS_DIR" "$(dirname "$EXCLUDE_FILE")"

# Install pre-commit
cat > "$HOOKS_DIR/pre-commit" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if git diff --cached --name-only | grep -E '^(\.ops/|\.contractor/|_private/)' >/dev/null; then
  echo "Blocked: Attempt to commit files under .ops/ or .contractor/ or _private/." >&2
  echo "Remove from index: git restore --staged <paths>" >&2
  exit 1
fi
EOF
chmod +x "$HOOKS_DIR/pre-commit"

# Install pre-push
cat > "$HOOKS_DIR/pre-push" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BASE_REF=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
if git diff --name-only "origin/${BASE_REF:-HEAD}"...HEAD | grep -E '^(\.ops/|\.contractor/|_private/)' >/dev/null; then
  echo "Blocked: Attempt to push changes touching .ops/ or .contractor/ or _private/." >&2
  exit 1
fi
EOF
chmod +x "$HOOKS_DIR/pre-push"

# Add local excludes
{
  echo ".ops/";
  echo ".contractor/";
  echo "_private/";
} >> "$EXCLUDE_FILE"

echo "Installed hooks and excludes into $TARGET_REPO"
