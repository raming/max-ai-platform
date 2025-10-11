# Contract work delivery workflow (canonical)

Purpose
Define a structured process for contract/consulting engagements where work is delivered to client repositories in batched, reviewable increments while maintaining isolation and quality control.

## Contract Branch Setup

### Initial Setup (per client repository)
```bash
# For each client repo (frontend, backend, etc.)
git checkout -b contract/metazone-airmeez
git push -u origin contract/metazone-airmeez

# Set up upstream tracking for client main
git remote add upstream <client-repo-url>
git fetch upstream
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

### Agent Development Process
1. **Branch Creation**: Create feature branches from contract branch
   ```bash
   git checkout contract/metazone-airmeez
   git pull origin contract/metazone-airmeez
   git checkout -b work/dev/AIRMEEZ-123-user-auth
   ```

2. **Development**: Follow standard ops workflow on feature branches
   - Implement changes with proper testing
   - Create PRs to merge feature branches → contract branch
   - Internal team reviews and merges

3. **Contract Branch Updates**: All approved work accumulates on contract branch

### Client Sync Process (daily/weekly)
```bash
# Keep contract branch updated with client changes
git checkout contract/metazone-airmeez
git fetch upstream  # client's main
git merge upstream/main --no-ff -m "sync: merge client updates $(date)"

# Resolve conflicts if any, prioritizing client changes
# Push updated contract branch
git push origin contract/metazone-airmeez
```

## Delivery Process

### Pre-Delivery Checklist
- [ ] All planned features implemented and tested on contract branch
- [ ] Cross-repository dependencies resolved (ops + frontend + backend)
- [ ] Integration testing completed across all repos
- [ ] Documentation updated
- [ ] Client notified of upcoming delivery

### Delivery Execution
1. **Final Sync**: Ensure contract branch has latest client changes
   ```bash
   git checkout contract/metazone-airmeez
   git fetch upstream
   git rebase upstream/main  # or merge if conflicts expected
   ```

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