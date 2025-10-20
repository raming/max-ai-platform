# Kilo Integration for Ops-Template

This document describes how to integrate your sophisticated ops-template multi-agent system with Kilo agents.

## Overview

The Kilo integration allows you to use your existing ops-template infrastructure (roles, prompts, GitHub issue tracking) with Kilo's agent system. This gives you the best of both worlds: your battle-tested multi-agent workflow with Kilo's capabilities.

## Architecture

### Directory Structure
```
kilo/
├── prompts/              # Kilo-specific prompts
│   ├── roles/           # Role-based prompt templates
│   ├── merged/          # Generated merged prompts
│   └── triggers/        # Quick-trigger files
├── agents.yaml          # Kilo agent configuration
└── registry/           # Kilo project registry
```

### Registry System
Similar to `registry/projects.yaml`, we use `registry/kilo-projects.yaml` to manage Kilo projects:

```yaml
kilo_projects:
  - name: hakim-platform-kilo
    path: "$HOME/repos/hakim/hakim-platform"
    use_kilo_prompts: true
    is_primary: true
```

## Scripts

### 1. sync-kilo-prompts.sh
Generates Kilo-compatible prompts from your ops-template system:

```bash
#!/usr/bin/env bash
# scripts/sync-kilo-prompts.sh
# Generate Kilo prompts using ops-template infrastructure

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KILO_REGISTRY="$ROOT_DIR/registry/kilo-projects.yaml"

PROJECT_NAME=${PROJECT_NAME:-}
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-}

# Find project configuration
if [[ -z "$PROJECT_OPS_DIR" && -n "$PROJECT_NAME" ]]; then
  if ! command -v yq >/dev/null 2>&1; then
    echo "ERROR: yq required for registry lookup" >&2
    exit 1
  fi

  # Find project in registry
  PROJECT_OPS_DIR=$(yq -r ".kilo_projects[] | select(.name == \"$PROJECT_NAME\") | .path" "$KILO_REGISTRY" 2>/dev/null)
  USE_KILO_PROMPTS=$(yq -r ".kilo_projects[] | select(.name == \"$PROJECT_NAME\") | .use_kilo_prompts // \"false\"" "$KILO_REGISTRY" 2>/dev/null)

  if [[ "$USE_KILO_PROMPTS" != "true" ]]; then
    echo "Project $PROJECT_NAME not configured for Kilo prompts" >&2
    exit 1
  fi
fi

# Create Kilo directories
KILO_DIR="$PROJECT_OPS_DIR/kilo/prompts"
MERGED_DIR="$KILO_DIR/merged"
TRIGGERS_DIR="$KILO_DIR/triggers"
mkdir -p "$MERGED_DIR" "$TRIGGERS_DIR"

# Role mapping for Kilo
declare -A KILO_ROLES=(
  ["architect"]="Architect"
  ["dev"]="Dev"
  ["qa"]="QA"
  ["team_lead"]="TeamLead"
  ["release_manager"]="ReleaseManager"
  ["sre"]="SRE"
)

# Generate prompts for each role
for role in "${!KILO_ROLES[@]}"; do
  kilo_name="${KILO_ROLES[$role]}"
  output_file="$MERGED_DIR/${kilo_name}.kilo.md"

  echo "Generating Kilo prompt: $role → $kilo_name"

  # Use existing merge script with Kilo adaptations
  ROLE="$role" SEAT="$role.default" PROJECT_OPS_DIR="$PROJECT_OPS_DIR" \
    "$ROOT_DIR/scripts/merge-role-prompt.sh" > "$output_file"

  # Adapt for Kilo (modify trigger commands, paths, etc.)
  sed -i.bak 's|/{Role}|/$role|g' "$output_file"
  sed -i.bak 's|work/{role}|kilo/work/$role|g' "$output_file"
  sed -i.bak 's|\.copilot/|.kilo/|g' "$output_file"

  # Create trigger file
  echo "# $kilo_name Agent - Load with: /$role" > "$TRIGGERS_DIR/${role}.md"
  cat "$output_file" >> "$TRIGGERS_DIR/${role}.md"
done

echo "Kilo prompts generated in: $KILO_DIR"
```

### 2. sync-all-kilo-projects.sh
Syncs all projects in the Kilo registry (similar to sync-all-projects.sh):

```bash
#!/usr/bin/env bash
# scripts/sync-all-kilo-projects.sh
# Sync Kilo prompts to all registered projects

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KILO_REGISTRY="$ROOT_DIR/registry/kilo-projects.yaml"

DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}

if ! command -v yq >/dev/null 2>&1; then
  echo "ERROR: yq required for registry processing" >&2
  exit 1
fi

# Get all Kilo projects
projects=$(yq -r '.kilo_projects[] | select(.use_kilo_prompts == true) | .name' "$KILO_REGISTRY")

for project in $projects; do
  echo "==> Processing Kilo project: $project"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  DRY RUN: Would sync Kilo prompts for $project"
  else
    PROJECT_NAME="$project" "$ROOT_DIR/scripts/sync-kilo-prompts.sh"
    echo "  ✓ Generated Kilo prompts for $project"
  fi
done

if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY RUN complete - use without --dry-run to actually sync"
else
  echo "All Kilo projects synced successfully"
fi
```

### 3. Kilo Agent Management Scripts

#### load-kilo-agent.sh
Load specific agent in Kilo:

```bash
#!/usr/bin/env bash
# scripts/load-kilo-agent.sh
# Load a specific Kilo agent with ops-template prompts

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-$ROOT_DIR}

ROLE=${1:-}
if [[ -z "$ROLE" ]]; then
  echo "Usage: $0 <role>" >&2
  echo "Roles: architect, dev, qa, team_lead, release_manager, sre" >&2
  exit 1
fi

KILO_PROMPTS_DIR="$PROJECT_OPS_DIR/kilo/prompts/merged"
PROMPT_FILE="$KILO_PROMPTS_DIR/$(echo "$ROLE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}').kilo.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Kilo prompt not found: $PROMPT_FILE" >&2
  echo "Run sync-kilo-prompts.sh first" >&2
  exit 1
fi

echo "Loading $ROLE agent in Kilo..."
echo "Prompt file: $PROMPT_FILE"
echo "Trigger command: /$ROLE"

# Output the prompt for Kilo to load
cat "$PROMPT_FILE"
```

#### kilo-context-update.sh
Update Kilo with latest project context:

```bash
#!/usr/bin/env bash
# scripts/kilo-context-update.sh
# Update Kilo agents with latest project context

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-$(pwd)}
CONTEXT_FILE="$PROJECT_OPS_DIR/.agents/rules/context.md"

if [[ ! -f "$CONTEXT_FILE" ]]; then
  echo "No context file found: $CONTEXT_FILE" >&2
  exit 1
fi

echo "=== Latest Project Context for Kilo Agents ==="
echo ""
cat "$CONTEXT_FILE"
echo ""
echo "=== End Context ==="
```

## Usage Workflow

### Initial Setup
1. **Configure Kilo registry** in `registry/kilo-projects.yaml`
2. **Generate initial prompts** for all projects:
   ```bash
   ./scripts/sync-all-kilo-projects.sh
   ```

### Daily Usage
3. **Load agents in Kilo** using trigger commands:
   ```bash
   /architect    # Load architect agent
   /dev         # Load developer agent
   /qa          # Load QA agent
   ```

4. **Sync after rule changes**:
   ```bash
   # After updating ops-template rules
   ./scripts/sync-all-kilo-projects.sh

   # Or for specific project
   PROJECT_NAME=hakim-platform-kilo ./scripts/sync-kilo-prompts.sh
   ```

### Integration with Existing Workflow
5. **Your existing scripts still work**:
   ```bash
   scripts/list-issues.sh     # List GitHub issues
   scripts/auto-next.sh       # Get next task
   scripts/agent-handoff.sh   # Handoff between agents
   ```

6. **Kilo-specific helpers**:
   ```bash
   scripts/load-kilo-agent.sh architect    # Load architect in Kilo
   scripts/kilo-context-update.sh          # Update Kilo with latest context
   ```

## Kilo-Specific Adaptations

### Trigger Commands
- **GitHub**: `/{Role}` (e.g., `/Architect`)
- **Kilo**: `/$role` (e.g., `/architect`)

### Session Management
- **GitHub**: `.copilot/sessions/`
- **Kilo**: `.kilo/sessions/`

### Work Branches
- **GitHub**: `work/{role}/{task-id}-{slug}`
- **Kilo**: `kilo/work/{role}/{task-id}-{slug}`

## Benefits

1. **Unified System**: Single ops-template manages both GitHub and Kilo agents
2. **Consistent Workflows**: Same sophisticated multi-agent coordination for both platforms
3. **Easy Migration**: Gradual transition from GitHub Copilot to Kilo
4. **Best of Both**: Leverage your investment in ops-template with Kilo's capabilities
5. **Future-Proof**: Easy to add new AI platforms using same infrastructure

## Next Steps

1. **Create the actual script files** (switch to code mode for .sh files)
2. **Test with a single project** (e.g., ops-template-kilo)
3. **Expand to all registered projects**
4. **Integrate with your existing automation** (CI/CD, handoff workflows)
5. **Add Kilo-specific enhancements** (platform-specific features)

This integration gives you a powerful, scalable system for managing AI agents across multiple platforms while maintaining your sophisticated operational workflows.