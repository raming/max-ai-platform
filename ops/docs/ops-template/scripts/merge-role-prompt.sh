#!/usr/bin/env bash
set -euo pipefail

# merge-role-prompt.sh
# Build a role-specific merged prompt for Warp personal prompts.
# Usage:
#   ROLE=architect PROJECT_OPS_DIR=$HOME/projects/hakim/hakim-platform-ops ./merge-role-prompt.sh > /tmp/warp-merged-architect.txt
# Roles: architect | team_lead | dev | sre

ROLE=${ROLE:-}
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
SEAT=${SEAT:-}
GH_USER=${GH_USER:-}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$ROLE" ]]; then
  echo "Set ROLE to one of: architect, team_lead, dev, sre" >&2
  exit 1
fi

role_path="$ROOT_DIR/prompts/roles/$ROLE/base.md"
if [[ ! -f "$role_path" ]]; then
  echo "Unknown role: $ROLE (missing $role_path)" >&2
  exit 1
fi

# Resolve GitHub username from project mapping if not provided and SEAT is set
if [[ -z "$GH_USER" && -n "$PROJECT_OPS_DIR" && -n "$SEAT" && -f "$PROJECT_OPS_DIR/.agents/rules/agents.yaml" ]]; then
  if command -v yq >/dev/null 2>&1; then
    GH_USER=$(yq -r ".seats[\"$SEAT\"].github // \"\"" "$PROJECT_OPS_DIR/.agents/rules/agents.yaml") || GH_USER=""
  fi
fi

# Session identity header (appears first to anchor identity and behavior)
printf '=== Session Identity Header ===\n'
echo "ROLE=$ROLE"
echo "SEAT=${SEAT:-<unset>}"
printf '\nAt session start, always announce: "I am the %s agent (%s)."\n' "$ROLE" "${SEAT:-unset}"
printf 'If the user asks "who are you?", reply with your role and seat exactly.\n'
printf 'Do NOT change role or seat unless an explicit SWITCH_SEAT instruction is provided.\n'
printf '%s\n' "---"

# Canonical role header
cat "$role_path"
echo

# Identity block (if available)
if [[ -n "$SEAT" || -n "$GH_USER" ]]; then
  printf '\n=== Identity (Session) ===\n'
  echo "Seat: ${SEAT:-<unset>}"
  echo "GitHub user: ${GH_USER:-<unset>}"
  echo "Identity discipline: self-announce at start; respond to who-are-you; never switch seats implicitly."
fi

# Team coordination information
if [[ -n "$PROJECT_OPS_DIR" && -f "$PROJECT_OPS_DIR/.agents/rules/agents.yaml" ]]; then
  printf '\n=== Team Coordination ===\n'
  echo "Available team members for task assignment and coordination:"
  if command -v yq >/dev/null 2>&1; then
    # List all seats except current one
    yq -r '.seats | keys[]' "$PROJECT_OPS_DIR/.agents/rules/agents.yaml" 2>/dev/null | grep -v "${SEAT:-}" | while read -r seat; do
      name=$(yq -r ".seats[\"$seat\"].name" "$PROJECT_OPS_DIR/.agents/rules/agents.yaml" 2>/dev/null)
      github=$(yq -r ".seats[\"$seat\"].github" "$PROJECT_OPS_DIR/.agents/rules/agents.yaml" 2>/dev/null)
      role=$(echo "$seat" | cut -d. -f1)
      echo "- $seat: $name (@$github) - Role: $role"
    done
  else
    echo "  (Install yq to see team member details)"
  fi
  echo ""
  echo "Use these seat names when:"
  echo "- Assigning issues: @seat.name"
  echo "- Creating handoffs: TO_SEAT=seat.name"
  echo "- Mentioning in PRs/issues: @github-username"
fi

# Canonical common rules
printf '\n=== Documentation Best Practices (Canonical) ===\n'
cat "$ROOT_DIR/rules/documentation.md"

printf '\n=== AI-Agent Conventions (Canonical) ===\n'
cat "$ROOT_DIR/rules/ai-agents.md"

printf '\n=== Agent Identity (Canonical) ===\n'
cat "$ROOT_DIR/rules/agents-identity.md"

printf '\n=== Tasks & Concurrency (Canonical) ===\n'
cat "$ROOT_DIR/rules/tasks-and-concurrency.md"

printf '\n=== Agent Startup (Canonical) ===\n'
cat "$ROOT_DIR/rules/agent-startup.md"

printf '\n=== Operational Commands ===\n'
printf 'ROLE=%s SEAT=%s PROJECT_OPS_DIR=<ops> $HOME/repos/ops-template/scripts/reload-seat.sh\n' "$ROLE" "${SEAT:-<seat>}"
printf 'PROJECT_OPS_DIR=<ops> SEAT=%s $HOME/repos/ops-template/scripts/agent-whoami.sh\n' "${SEAT:-<seat>}"
printf 'PROJECT_OPS_DIR=<ops> SEAT=%s $HOME/repos/ops-template/scripts/list-issues.sh\n' "${SEAT:-<seat>}"
printf 'PROJECT_OPS_DIR=<ops> SEAT=%s $HOME/repos/ops-template/scripts/auto-next.sh\n' "${SEAT:-<seat>}"
printf 'FROM_SEAT=%s TO_SEAT=<to.seat> ISSUE=<id> PROJECT_OPS_DIR=<ops> $HOME/repos/ops-template/scripts/agent-handoff.sh\n' "${SEAT:-<seat>}"
printf 'SEAT=%s ISSUE=<id> PROJECT_OPS_DIR=<ops> $HOME/repos/ops-template/scripts/resume-from-handoff.sh\n' "${SEAT:-<seat>}"
printf 'git fetch origin && git rebase origin/main   # sync work branch with latest main\n'

printf '\n=== Branching & Release Policy (Canonical) ===\n'
cat "$ROOT_DIR/rules/branching-release.md"

printf '\n=== Agent Autonomy (Canonical) ===\n'
cat "$ROOT_DIR/rules/agent-autonomy.md"

printf '\n=== Multi-Agent Code Review (Canonical) ===\n'
cat "$ROOT_DIR/rules/agent-code-review.md"

printf '\n=== Shell Command Safety (Canonical) ===\n'
cat "$ROOT_DIR/rules/shell-command-safety.md"

# Project overlays (optional)
if [[ -n "$PROJECT_OPS_DIR" ]]; then
  if [[ -f "$PROJECT_OPS_DIR/.agents/rules/context.md" ]]; then
    printf '\n=== Project Context (Overlay) ===\n'
    cat "$PROJECT_OPS_DIR/.agents/rules/context.md"
  fi
  if [[ -f "$PROJECT_OPS_DIR/.agents/rules/$ROLE.md" ]]; then
    printf '\n=== Project Role Rules (Overlay) ===\n'
    cat "$PROJECT_OPS_DIR/.agents/rules/$ROLE.md"
  fi
fi
