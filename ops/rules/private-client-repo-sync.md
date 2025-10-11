# Private-to-client repo sync workflow (canonical)

Purpose
Define a clean separation between internal contract work (with AI agent tooling) and client deliveries for projects where the client uses different git platforms (GitBucket, etc.) and you want to keep internal labels/references private.

## Repository Architecture

### Private Mirror Repository
- **Location**: Your private org (GitHub)
- **Content**: Complete mirror of client repo + full ops integration
- **Purpose**: Internal development workspace with AI agents, custom labels, seat references
- **Structure**: Same as client repo but with ops/ content in root

### Client Repository  
- **Location**: Client's git platform (GitBucket, etc.)
- **Content**: Clean client code only (no ops tooling)
- **Purpose**: Official delivery point for client review
- **Access**: You have push access for deliveries

### Example Structure
```
your-org/ (GitHub - private)
├── airmeez-mirror/        # ← Private mirror repo
│   ├── main               # Mirrors client main
│   ├── work/dev/AIRMEEZ-123-feature-a  # Internal branches
│   ├── ops/               # Full ops content (private)
│   ├── client/            # Frontend code
│   ├── backend/           # Backend code
│   ├── .agents/           # Agent configs (private)
│   └── .github/           # Internal GitHub Actions

client-org/ (GitBucket - client)
├── airmeez/              # ← Client repo
│   ├── master            # Client's main branch
│   ├── feature/AIRMEEZ-123-user-auth  # Clean delivery branches
│   ├── client/           # Frontend code only
│   └── backend/          # Backend code only
```

## Branch Mapping Strategy

### Branch Synchronization
- **Private Repo**: `work/{role}/{task-id}-{slug}` (internal AI agent branches)
- **Client Repo**: `feature/{task-id}-{slug}` (clean delivery branches)
- **Sync Direction**: Private → Client (one-way code sync)

### Regular Maintenance
Both repositories should regularly sync with their respective upstream branches:

**Private Repo** (your-org/airmeez-mirror):
```bash
# Sync internal main with client master
git checkout main
git fetch client-mirror  # remote pointing to client repo
git merge client-mirror/master --no-ff -m "sync: merge client updates"
```

**Client Repo** (client-org/airmeez):
```bash
# Sync feature branches with master
git checkout feature/AIRMEEZ-123-user-auth
git merge master  # or development branch
```

## Sync Process

### Automated Sync Script
Use `sync-to-client-repo.sh` to sync completed work:

```bash
# Sync a completed feature from private → client
PRIVATE_REPO="/path/to/your/airmeez-mirror"
CLIENT_REPO="/path/to/client/airmeez"
TASK_ID="AIRMEEZ-123"
FEATURE_NAME="user-auth"

./scripts/sync-to-client-repo.sh \
  --private-repo "$PRIVATE_REPO" \
  --client-repo "$CLIENT_REPO" \
  --task-id "$TASK_ID" \
  --feature-name "$FEATURE_NAME"
```

### Manual Delivery Process
1. **Complete Internal Work**: Feature done in private repo
2. **Run Sync Script**: Push code changes to client repo
3. **Create Client PR**: From feature branch → master in client repo
4. **Client Review**: Airmeez manager reviews clean PR
5. **Merge**: Client merges when approved

## Quality Gates

### Pre-Sync Checklist
- [ ] Internal testing complete (lint, test, coverage ≥95%)
- [ ] AI agent work approved internally
- [ ] Ops references removed (no .agents/, ops/ content)
- [ ] Client-appropriate commit messages
- [ ] No internal labels/seat references in code

### Sync Script Responsibilities
- [ ] Extract code changes only (exclude ops/, .agents/, .github/)
- [ ] Clean commit history (squash internal commits)
- [ ] Update branch names (work/dev/... → feature/...)
- [ ] Verify no internal references leak through

## Risk Management

### Content Leakage Prevention
- Sync script must explicitly exclude private directories
- Manual review before client PR creation
- Separate git history (no internal commits in client repo)

### Branch Management
- Never push internal branches to client repo
- Keep client repo branches clean and minimal
- Archive internal branches after successful delivery

### Conflict Resolution
- Client changes take precedence
- Re-sync private repo with client updates regularly
- Handle merge conflicts in private repo first