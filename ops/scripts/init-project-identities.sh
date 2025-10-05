#!/usr/bin/env bash
set -euo pipefail

# init-project-identities.sh
# Initialize per-project agent identity mapping (.agents/rules/agents.yaml).
# Usage:
#   PROJECT_OPS_DIR=$HOME/projects/myorg/my-ops-repo $HOME/opt-template/scripts/init-project-identities.sh
# Requires: bash. If yq is present and an existing file is found, it will be left unchanged.

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}
if [[ -z "$PROJECT_OPS_DIR" ]]; then
  echo "Set PROJECT_OPS_DIR to the ops repo path" >&2
  exit 1
fi

AGENTS_DIR="$PROJECT_OPS_DIR/.agents/rules"
AGENTS_FILE="$AGENTS_DIR/agents.yaml"
mkdir -p "$AGENTS_DIR"

if [[ -f "$AGENTS_FILE" ]]; then
  echo "Found existing $AGENTS_FILE — leaving as is."
  exit 0
fi

# Write template with default one-per-role seats (GH usernames as placeholders)
cat > "$AGENTS_FILE" <<'YAML'
# agents.yaml — per-project agent identity mapping (seats -> GitHub users)
# Fill in real GitHub usernames for each seat. You can add more seats later with add-seat.sh.
seats:
  architect.default:
    github: architect-gh
  team_lead.default:
    github: teamlead-gh
  dev.default:
    github: dev-gh
  qa.default:
    github: qa-gh
  release_manager.default:
    github: release-gh
  sre.default:
    github: sre-gh
YAML

echo "Initialized $AGENTS_FILE"
