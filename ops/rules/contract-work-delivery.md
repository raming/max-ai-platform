# Contract work delivery workflow (canonical)

Purpose
Define a structured process for contract/consulting engagements using private mirror repositories to keep internal AI agent tooling completely separate from client repositories, especially when clients use different git platforms (GitBucket, etc.).

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
│   ├── main               # Mirrors client main/master
│   ├── work/dev/AIRMEEZ-123-feature-a  # Internal AI agent branches
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
- **Sync Direction**: Private → Client (one-way code sync, exclude ops content)

### Regular Maintenance
Both repositories should regularly sync with their respective upstream branches:

**Private Mirror Repo** (your-org/airmeez-mirror):
```bash
# Sync internal main with client master
git checkout main
git remote add client-mirror <client-repo-url>
git fetch client-mirror
git merge client-mirror/master --no-ff -m "sync: merge client updates"
```

**Client Repo** (client-org/airmeez):
```bash
# Sync feature branches with master
git checkout feature/AIRMEEZ-123-user-auth
git merge master
```

### Branch Hierarchy
```
client-repo/
├── main (client's protected branch)
├── contract/metazone-airmeez (our private workspace)
│   ├── work/dev/AIRMEEZ-123-feature-a
│   ├── work/dev/AIRMEEZ-124-feature-b
│   └── work/qa/AIRMEEZ-125-testing
```

## Daily Workflow

### Agent Development Process (Private Mirror Repo)
1. **Branch Creation**: Create feature branches from main in private mirror
   ```bash
   cd /path/to/your/airmeez-mirror
   git checkout main
   git pull origin main
   git checkout -b work/dev/AIRMEEZ-123-user-auth
   ```

2. **Development**: Follow standard ops workflow on feature branches
   - Implement changes with full ops tooling (.agents/, ops/, internal labels)
   - Create PRs to merge feature branches → main in private repo
   - Internal team reviews and merges

3. **Main Branch Updates**: All approved work accumulates on private main

### Client Sync Process (daily/weekly)
```bash
# Keep private mirror updated with client changes
cd /path/to/your/airmeez-mirror
git checkout main
git fetch client-mirror  # remote pointing to client repo
git merge client-mirror/master --no-ff -m "sync: merge client updates $(date)"

# Resolve conflicts if any, prioritizing client changes
# Push updated main branch
git push origin main
```

## Delivery Process

### Pre-Delivery Checklist
- [ ] All planned features implemented and tested in private mirror
- [ ] Cross-repository dependencies resolved (frontend + backend)
- [ ] Integration testing completed
- [ ] Documentation updated
- [ ] Client notified of upcoming delivery

### Delivery Execution
1. **Run Sync Script**: Sync completed work to client repo
   ```bash
   ./scripts/sync-to-client-repo.sh \
     --private-repo "/path/to/your/airmeez-mirror" \
     --client-repo "/path/to/client/airmeez" \
     --task-id "AIRMEEZ-123" \
     --feature-name "user-auth"
   ```

2. **Create Client PR**: From feature branch → master in client GitBucket
3. **Client Review**: Airmeez manager reviews clean PR (no internal tooling)
4. **Merge**: Client merges when approved

2. **Create Delivery PR**: From contract branch → client main
   ```bash
   git checkout contract/metazone-airmeez
   git push origin contract/metazone-airmeez  # ensure latest
   # Create PR via GitHub UI or CLI
   ```

3. **PR Content**:
   - Title: `Contract Delivery: [Milestone/Sprint Name]`
   - Body: Comprehensive summary of all changes
   - Links to ops repo issues/specs
   - Testing evidence and acceptance criteria

4. **Client Review**: Allow time for client feedback and iterations

5. **Merge**: Client merges when satisfied

### Post-Delivery
- Tag the delivery in all repositories
- Update ops tracker with completion status
- Plan next delivery cycle
- Archive completed feature branches

## Multi-Repository Coordination

### Repository Dependencies
- **Ops Repo**: Leads coordination, maintains specs
- **Frontend Repo**: Implements UI changes per ops specs
- **Backend Repo**: Implements API changes per ops specs

### Release Coordination
1. Ops repo: Merge spec updates first
2. Backend repo: Deploy API changes
3. Frontend repo: Deploy UI changes
4. Integration testing across all repos

### Conflict Resolution
- Client changes take precedence in contract branches
- Contract work adapts to client direction
- Escalate architectural conflicts to contract lead

## Quality Gates

### Internal Quality (before delivery)
- All ops workflow completed (dev → qa → approval)
- Cross-repo integration tested
- Performance and security validated
- Documentation complete

### Client Quality (delivery PR)
- Clear change summary and rationale
- Evidence of testing and validation
- Migration/rollback plans if needed
- Contact information for questions

## Risk Management

### Client Change Conflicts
- Regular syncs minimize divergence
- Rebase/merge conflicts resolved favoring client direction
- Contract work may need adaptation

### Delivery Delays
- Maintain separate contract branches
- Continue development while client reviews
- Batch changes for efficiency

### Scope Creep
- Use ops tracker to manage scope
- Clear boundaries on what constitutes "done"
- Separate contracts for additional work