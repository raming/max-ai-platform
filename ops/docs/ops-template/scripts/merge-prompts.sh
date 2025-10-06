#!/usr/bin/env bash
set -euo pipefail

# merge-prompts.sh
# Concatenate canonical rules into a single prompt file for Warp personal prompts.
# Usage: ./merge-prompts.sh > merged-prompt.txt
# Optionally pass project paths to include project-specific rules.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cat <<'HDR'
=== Documentation Best Practices (Canonical) ===
HDR
cat "$ROOT_DIR/rules/documentation.md"

echo -e "\n=== AI-Agent Conventions (Canonical) ==="
cat "$ROOT_DIR/rules/ai-agents.md"

echo -e "\n=== Tasks & Concurrency (Canonical) ==="
cat "$ROOT_DIR/rules/tasks-and-concurrency.md"

echo -e "\n=== Shell Command Safety (Canonical) ==="
cat "$ROOT_DIR/rules/shell-command-safety.md"

# Project-specific additions (if provided as env vars)
if [[ -n "${PROJECT_OPS_DIR:-}" ]]; then
  if [[ -f "$PROJECT_OPS_DIR/docs/design/engineering/ai-agent-conventions.md" ]]; then
    echo -e "\n=== Project-Specific: AI Agent Conventions ==="
    cat "$PROJECT_OPS_DIR/docs/design/engineering/ai-agent-conventions.md"
  fi
  if [[ -f "$PROJECT_OPS_DIR/docs/design/adapter-contracts.md" ]]; then
    echo -e "\n=== Project-Specific: Adapter Contracts ==="
    cat "$PROJECT_OPS_DIR/docs/design/adapter-contracts.md"
  fi
fi
