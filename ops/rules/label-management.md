# Label Management and Governance (Canonical)

Purpose
Define canonical label structure, governance workflow, and ensure consistency across project repositories.

## The Problem

**Current Issues:**
1. Agents invent labels that don't exist (e.g., "database" instead of "area:data")
2. No central source of truth for project-specific labels
3. Labels defined in `config/labels.yaml` but not synced to GitHub
4. Inconsistent labeling across issues

**Example of What Goes Wrong:**
```bash
# Architect tries to use non-existent label
gh issue create --label "database"  # ← Label doesn't exist!
# GitHub silently ignores it or tries to create it inconsistently
```

## The Solution: Three-Tier Label System

### Tier 1: Ops Infrastructure Labels (Canonical)
Defined in `ops-template/config/labels.yaml`, synced to all projects.

**Categories:**
- `type:*` - Issue type (spec, code, test, bug, doc, infra)
- `seat:*` - Seat assignment (architect.*, dev.*, qa.*, etc.)
- `priority:*` - Priority level (P0-P3)
- `status:*` - Workflow status (needs-review, blocked, wip)
- `role:*` - Role-specific context (architect, dev, qa, sre)

**Example:**
```yaml
- name: "type:spec"
  color: "0052CC"
  description: "Specification or design document"
- name: "seat:architect.morgan-lee"
  color: "D4C5F9"
  description: "Assigned to architect seat"
```

### Tier 2: Project-Specific Labels
Defined in project's `config/labels-project.yaml`, maintained by architect.

**Categories:**
- `area:*` - Functional areas (area:auth, area:data, area:ui)
- `component:*` - Technical components (component:api, component:database)
- `feature:*` - Feature flags or groups (feature:payments, feature:notifications)
- Custom categories as needed

**Example for airmeez-ui:**
```yaml
- name: "area:data"
  color: "FBCA04"
  description: "Data management and processing"
- name: "area:auth"
  color: "FBCA04"
  description: "Authentication and authorization"
- name: "component:api"
  color: "1D76DB"
  description: "Backend API components"
```

### Tier 3: Composite Labels (GitHub)
Final labels in GitHub = Tier 1 (ops) + Tier 2 (project-specific).

## Architect Responsibilities

### 1. Project Label Definition (Once per Project)
As part of project setup or architectural planning:

**Action:** Create or review `config/labels-project.yaml`

```markdown
## Architect Workflow: Define Project Labels

1. **Review project scope** - What are the major functional areas?
2. **Identify components** - What technical systems exist?
3. **Define label categories:**
   - `area:*` for functional areas (user-facing concerns)
   - `component:*` for technical components (backend systems)
   - `feature:*` for feature groupings (optional)
4. **Document in `config/labels-project.yaml`**
5. **Run label sync script** to create in GitHub
6. **Update role prompts** with project label reference
```

**Template:**
```yaml
# config/labels-project.yaml
# Project: airmeez-ui
# Maintained by: Architect
# Last updated: 2025-10-16

project_labels:
  # Functional Areas
  - name: "area:auth"
    color: "FBCA04"
    description: "Authentication, authorization, user management"
  
  - name: "area:data"
    color: "FBCA04"
    description: "Data processing, ETL, data models"
  
  - name: "area:ui"
    color: "FBCA04"
    description: "User interface, UX, frontend components"
  
  # Technical Components
  - name: "component:api"
    color: "1D76DB"
    description: "Backend API services"
  
  - name: "component:database"
    color: "1D76DB"
    description: "Database schemas, migrations, queries"
  
  - name: "component:frontend"
    color: "1D76DB"
    description: "React components, state management"
  
  # Feature Groupings (optional)
  - name: "feature:payments"
    color: "0E8A16"
    description: "Payment processing features"
```

### 2. Label Sync (On Label Changes)
After defining or updating labels:

```bash
# Sync canonical ops labels + project labels to GitHub
cd $PROJECT_OPS_DIR
../scripts/sync-labels.sh
```

This script:
- Reads `config/labels.yaml` (ops canonical)
- Reads `config/labels-project.yaml` (project-specific)
- Creates or updates labels in GitHub repository
- Reports any existing labels not in definition files

### 3. Label Reference in Prompts
Update project-specific context to include label reference.

**Add to `.agents/rules/context.md`:**
```markdown
## Project Labels

This project uses the following label structure:

### Functional Areas (area:*)
- `area:auth` - Authentication and authorization
- `area:data` - Data processing and management
- `area:ui` - User interface and frontend

### Components (component:*)
- `component:api` - Backend API services
- `component:database` - Database layer
- `component:frontend` - React frontend

**IMPORTANT**: Only use labels defined above. Do not invent new labels.
If you need a new label, escalate to architect for approval.
```

## Agent Workflow: Using Labels

### Step 1: Review Available Labels
Before creating issues, check project context for valid labels:

```bash
# Read project labels from context
cat .agents/rules/context.md | grep -A 20 "## Project Labels"

# Or read directly from label file
yq '.project_labels[] | .name' config/labels-project.yaml
```

### Step 2: Apply Appropriate Labels
When creating issues, use defined labels:

```bash
gh issue create \
  --title "Implement OAuth2 login" \
  --label "type:code" \
  --label "area:auth" \
  --label "component:api" \
  --label "seat:dev.avery-kim" \
  --label "priority:P1"
```

### Step 3: Never Invent Labels
If you think you need a label that doesn't exist:

**❌ DON'T DO THIS:**
```bash
gh issue create --label "database"  # ← Invented, not defined!
```

**✅ DO THIS:**
```bash
# Use existing label that's closest
gh issue create --label "component:database"

# If no suitable label exists, escalate to architect
gh issue create \
  --title "Need new label for caching layer" \
  --label "type:question" \
  --label "seat:architect.morgan-lee" \
  --body "Should we add 'component:cache' label?"
```

## Label Sync Script

Create `scripts/sync-labels.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# sync-labels.sh
# Sync labels from config/labels.yaml and config/labels-project.yaml to GitHub

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-.}
cd "$PROJECT_OPS_DIR"

if [[ ! -f "config/labels.yaml" ]]; then
  echo "ERROR: config/labels.yaml not found" >&2
  exit 1
fi

# Get repository from git remote
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Syncing labels to $REPO"

# Function to create or update label
sync_label() {
  local name=$1
  local color=$2
  local description=$3
  
  if gh label list --json name -q ".[] | select(.name == \"$name\")" | grep -q "$name"; then
    echo "Updating: $name"
    gh label edit "$name" --color "$color" --description "$description" 2>/dev/null || true
  else
    echo "Creating: $name"
    gh label create "$name" --color "$color" --description "$description"
  fi
}

# Sync ops canonical labels
echo "==> Syncing canonical ops labels"
yq -r '.labels[] | [.name, .color, .description] | @tsv' config/labels.yaml | \
while IFS=$'\t' read -r name color description; do
  sync_label "$name" "$color" "$description"
done

# Sync project-specific labels if file exists
if [[ -f "config/labels-project.yaml" ]]; then
  echo "==> Syncing project-specific labels"
  yq -r '.project_labels[] | [.name, .color, .description] | @tsv' config/labels-project.yaml | \
  while IFS=$'\t' read -r name color description; do
    sync_label "$name" "$color" "$description"
  done
fi

echo "✅ Label sync complete"
```

## Label Validation Script

Create `scripts/validate-labels.sh` to check issue label usage:

```bash
#!/usr/bin/env bash
set -euo pipefail

# validate-labels.sh
# Check for issues using undefined labels

PROJECT_OPS_DIR=${PROJECT_OPS_DIR:-.}
cd "$PROJECT_OPS_DIR"

# Get all defined labels
DEFINED_LABELS=$(cat config/labels.yaml config/labels-project.yaml 2>/dev/null | \
  yq -r '.labels[]?.name, .project_labels[]?.name' | sort -u)

# Get all labels used in open issues
USED_LABELS=$(gh issue list --json labels --state open -L 1000 | \
  jq -r '.[].labels[].name' | sort -u)

# Find undefined labels
echo "==> Checking for undefined labels in use"
while read -r label; do
  if ! echo "$DEFINED_LABELS" | grep -qx "$label"; then
    echo "⚠️  Undefined label in use: $label"
    gh issue list --label "$label" --json number,title -q '.[] | "#\(.number): \(.title)"'
  fi
done <<< "$USED_LABELS"

echo "✅ Label validation complete"
```

## Integration with Agent Workflows

### Architect Startup Enhancement
Add to `prompts/roles/architect/base.md`:

```markdown
## Label Management (Architect Responsibility)

As architect, you are responsible for maintaining project label definitions:

1. **On project initialization:**
   - Review functional areas and components
   - Create `config/labels-project.yaml` with project-specific labels
   - Run `scripts/sync-labels.sh` to create labels in GitHub
   - Document labels in `.agents/rules/context.md`

2. **When new areas/components are added:**
   - Update `config/labels-project.yaml`
   - Run `scripts/sync-labels.sh`
   - Update context documentation
   - Announce new labels to team

3. **Periodic review:**
   - Run `scripts/validate-labels.sh` to find issues with undefined labels
   - Clean up or define missing labels
   - Remove unused labels from definition files
```

### All Agent Roles
Add to all role prompts:

```markdown
## Label Usage

- **ONLY use labels defined in project context** (`.agents/rules/context.md`)
- Common ops labels: `type:*`, `seat:*`, `priority:*`, `status:*`
- Project labels: `area:*`, `component:*`, `feature:*` (see context)
- **Never invent labels** - escalate to architect if new label needed
```

## Migration Path

For existing projects with inconsistent labels:

### Step 1: Audit Current Labels
```bash
gh label list --json name,description
```

### Step 2: Architect Creates Label Definitions
Create `config/labels-project.yaml` based on current usage.

### Step 3: Sync to GitHub
```bash
scripts/sync-labels.sh
```

### Step 4: Validate and Clean
```bash
scripts/validate-labels.sh
```

### Step 5: Fix Issues with Undefined Labels
For each undefined label found, either:
- Add to `config/labels-project.yaml` if it's valid
- Re-label issues with correct defined labels
- Remove if it was a mistake

## Common Label Patterns

### Issue Type Flow
```
type:spec → type:code → type:test → Done
```

### Priority System
- `priority:P0` - Critical, work now
- `priority:P1` - High, work this sprint
- `priority:P2` - Medium, work soon
- `priority:P3` - Low, backlog

### Status Tracking
- `status:needs-review` - Awaiting review
- `status:blocked` - Blocked on something
- `status:wip` - Work in progress
- `status:ready` - Ready for implementation

## Summary

✅ **DO:**
- Define all project labels in `config/labels-project.yaml`
- Sync labels to GitHub using `scripts/sync-labels.sh`
- Document labels in project context
- Only use defined labels on issues
- Validate labels periodically

❌ **DON'T:**
- Invent labels on the fly
- Use undefined labels
- Mix label naming conventions
- Skip label sync after changes

**Architect owns label definitions. All agents follow definitions.** 🎯
