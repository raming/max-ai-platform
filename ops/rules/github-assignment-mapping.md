# GitHub Assignment Mapping (Canonical)

Purpose
Define how agents correctly assign GitHub issues and PRs using actual GitHub usernames instead of seat names.

## The Problem

Agents are configured with **seat names** (e.g., `architect.morgan-lee`, `dev.avery-kim`) but GitHub requires **actual usernames** (e.g., `@rayg`, `@username`).

**What doesn't work:**
```bash
# This FAILS - seat name is not a GitHub user
gh issue create --assignee architect.morgan-lee
```

**What works:**
```bash
# This SUCCEEDS - real GitHub username
gh issue create --assignee rayg
```

## The Solution: Seat-to-Username Mapping

Every project maintains a mapping in `.agents/rules/agents.yaml`:

```yaml
seats:
  architect.morgan-lee:
    name: "Morgan Lee (AI)"
    github: "rayg"              # ← REAL GitHub username
    role: architect
  dev.avery-kim:
    name: "Avery Kim (AI)"
    github: "rayg"              # ← REAL GitHub username
    role: dev
  qa.mina-li:
    name: "Mina Li (AI)"
    github: "rayg"              # ← REAL GitHub username
    role: qa
```

## Agent Workflow: Issue Assignment

### Step 1: Determine Target Seat
When creating or assigning an issue, determine which seat should handle it:
- Spec/design work → `architect.morgan-lee`
- Implementation work → `dev.avery-kim`
- Testing work → `qa.mina-li`

### Step 2: Look Up GitHub Username
Read `.agents/rules/agents.yaml` to get the GitHub username:

```bash
# Example using yq
SEAT="architect.morgan-lee"
GITHUB_USER=$(yq -r ".seats[\"$SEAT\"].github" .agents/rules/agents.yaml)
echo "$GITHUB_USER"  # Output: rayg
```

### Step 3: Assign to GitHub Username
Use the GitHub username (not seat name) for assignment:

```bash
gh issue create \
  --title "Design user authentication flow" \
  --body "Spec needed for auth implementation" \
  --label "type:spec" \
  --label "seat:architect.morgan-lee" \
  --assignee "$GITHUB_USER"
```

### Step 4: Add Seat Label for Tracking
Include seat as a label (not assignee) for agent tracking:
- Label: `seat:architect.morgan-lee`
- Assignee: `rayg` (actual GitHub user)

This allows:
- GitHub to properly assign the issue (to real user)
- Agents to filter issues by their seat (using label)

## Issue Filtering by Seat

Agents filter their assigned work using **labels**, not assignees:

```bash
# Correct: Filter by seat label
gh issue list --label "seat:architect.morgan-lee" --state open

# Not reliable: Filter by assignee (might be shared across seats)
gh issue list --assignee rayg --state open  # ← Too broad if one person operates multiple seats
```

## Commands Reference

### Create Issue with Proper Assignment
```bash
SEAT="dev.avery-kim"
GITHUB_USER=$(yq -r ".seats[\"$SEAT\"].github" .agents/rules/agents.yaml)

gh issue create \
  --title "Implement user login API" \
  --body "See spec in #123" \
  --label "type:code" \
  --label "seat:$SEAT" \
  --assignee "$GITHUB_USER"
```

### Reassign Issue to Different Seat
```bash
ISSUE_NUMBER=45
NEW_SEAT="qa.mina-li"
GITHUB_USER=$(yq -r ".seats[\"$NEW_SEAT\"].github" .agents/rules/agents.yaml)

# Remove old seat label, add new
gh issue edit $ISSUE_NUMBER \
  --remove-label "seat:dev.avery-kim" \
  --add-label "seat:$NEW_SEAT" \
  --add-assignee "$GITHUB_USER"
```

### List My Seat's Issues
```bash
MY_SEAT="architect.morgan-lee"
gh issue list --label "seat:$MY_SEAT" --state open
```

## Agent Startup Checklist Integration

Update agent startup to always use seat labels for filtering:

```markdown
7) **IMMEDIATELY** query GitHub Issues list for this project and filter:
   - label: seat:<your-seat-name>  ← Use seat label, NOT assignee
   - state: open
   - sort: recently updated
```

## Validation Script

Create `scripts/validate-assignments.sh` to check for incorrect assignments:

```bash
#!/usr/bin/env bash
# Check for issues assigned to seat names instead of GitHub users

gh issue list --json number,assignees,labels --state all | \
  jq -r '.[] | select(.assignees[].login | test("\\.")?) | 
  "Issue #\(.number): Invalid assignee \(.assignees[].login)"'
```

## Migration Path

For existing projects with incorrect assignments:

1. **Audit current assignments:**
   ```bash
   gh issue list --json number,assignees --assignee "architect.morgan-lee"
   ```

2. **Get correct GitHub username:**
   ```bash
   GITHUB_USER=$(yq -r '.seats["architect.morgan-lee"].github' .agents/rules/agents.yaml)
   ```

3. **Reassign all issues:**
   ```bash
   gh issue list --assignee "architect.morgan-lee" --json number -q '.[].number' | \
   while read issue; do
     gh issue edit $issue --add-assignee "$GITHUB_USER"
   done
   ```

## Role-Specific Guidance

### Architect
- When creating spec/design issues for yourself: lookup your GitHub username
- When creating dev tasks: lookup dev seat's GitHub username
- Always include `seat:` label for tracking

### Team Lead
- When breaking down epics into stories: lookup appropriate seat's GitHub username
- Include seat label on every issue created
- Verify assignee is valid GitHub user, not seat name

### Dev
- When creating handoff issues for QA: lookup QA seat's GitHub username
- When commenting on issues, use seat names for clarity (e.g., "@architect.morgan-lee please review")
- GitHub will not notify on fake @mentions, but it's for human readability

### QA
- When creating bug reports: assign to appropriate dev seat's GitHub username
- Include seat label for routing

## Common Mistakes

### ❌ Mistake 1: Assigning to Seat Name
```bash
gh issue create --assignee architect.morgan-lee  # FAILS
```

### ✅ Correct: Assign to GitHub Username
```bash
GITHUB_USER=$(yq -r '.seats["architect.morgan-lee"].github' .agents/rules/agents.yaml)
gh issue create --assignee "$GITHUB_USER" --label "seat:architect.morgan-lee"
```

### ❌ Mistake 2: Filtering by Assignee Only
```bash
gh issue list --assignee rayg  # Too broad, includes all seats
```

### ✅ Correct: Filter by Seat Label
```bash
gh issue list --label "seat:architect.morgan-lee"
```

### ❌ Mistake 3: Hardcoding GitHub Username
```bash
gh issue create --assignee rayg  # Brittle, breaks if username changes
```

### ✅ Correct: Lookup from agents.yaml
```bash
GITHUB_USER=$(yq -r '.seats["architect.morgan-lee"].github' .agents/rules/agents.yaml)
gh issue create --assignee "$GITHUB_USER"
```

## Testing

Verify correct assignment:
```bash
# Create test issue
SEAT="architect.morgan-lee"
GITHUB_USER=$(yq -r ".seats[\"$SEAT\"].github" .agents/rules/agents.yaml)

gh issue create \
  --title "Test assignment" \
  --label "seat:$SEAT" \
  --assignee "$GITHUB_USER"

# Verify it appears in GitHub UI with correct assignee
gh issue list --label "seat:$SEAT"
```

## Summary

✅ **DO:**
- Store seat-to-GitHub mappings in `agents.yaml`
- Lookup GitHub username before assignment
- Use seat labels for issue filtering
- Include seat label on every issue

❌ **DON'T:**
- Assign to seat names directly
- Hardcode GitHub usernames
- Filter by assignee when you mean to filter by seat
- Forget to add seat label

This ensures GitHub assignments work correctly while maintaining seat-based workflow tracking! 🎯
