# Agent autonomy and command approval (canonical)

Purpose
Define when agents should proceed autonomously vs. escalate to humans, ensuring maximum productivity while maintaining safety.

## Core Principle: BIAS TOWARD ACTION
- **Default behavior**: Execute immediately unless explicitly dangerous/ambiguous
- **Escalate only when**: Truly blocked, destructive operations, or human judgment required
- **Never wait** for confirmation on routine development/build/test operations

## Auto-Approve Categories (No Human Confirmation)

### Development Operations
✅ **Always auto-approve**:
- `npm install`, `npm run build`, `npm run test`, `npm run lint` 
- `git add`, `git commit`, `git push` to feature branches
- Creating PRs, updating issue comments
- Running code analysis, coverage reports
- File creation/editing in project directories
- Package installations from standard registries

### Repository Operations  
✅ **Auto-approve in project context**:
- Cloning/pulling project repositories
- Branch creation: `git checkout -b work/*`
- Reading any project files, logs, configs
- Installing project dependencies
- Running project-specific scripts in package.json

### Testing & Quality Assurance
✅ **Always auto-approve**:
- Unit tests, integration tests, E2E tests
- Linting, formatting, static analysis
- Security scans, dependency audits
- Performance benchmarks, load testing
- Coverage report generation

### Documentation & Specs
✅ **Always auto-approve**:
- Creating/updating markdown files in docs/, tracker/
- Generating API documentation  
- Updating README, CHANGELOG files
- Creating ADRs, design documents

## Human Escalation Required (Ask First)

### Destructive Operations
❌ **Never auto-approve**:
- Deleting directories, important files
- `rm -rf`, `git reset --hard`, `git push --force` 
- Database schema migrations, data deletion
- Production deployments, infrastructure changes
- Modifying CI/CD pipelines, security configs

### System-Level Changes  
❌ **Escalate to human**:
- Installing system packages (brew, apt, yum)
- Modifying system files (/etc/, ~/.bashrc, etc.)
- Changing Docker/container configurations  
- Network/firewall rule modifications
- Certificate/key generation or management

### External Dependencies
❌ **Ask for approval**:
- API calls to external services (non-testing)
- Publishing packages to registries
- Sending emails, notifications, webhooks
- Creating cloud resources (AWS, GCP, Azure)
- Accessing production databases/services

### Ambiguous Context
❌ **Escalate when**:
- Conflicting requirements in specs
- Multiple valid implementation approaches
- Missing acceptance criteria or unclear scope
- Cross-team coordination required
- Regulatory/compliance implications unclear

## Command Classification Examples

```bash
# ✅ AUTO-APPROVE - Development workflow
npm run test
git commit -m "feat: add user authentication"
gh pr create --title "HAKIM-123 User Auth"

# ✅ AUTO-APPROVE - Project operations  
cd /Users/user/projects/client-repo
npm install lodash
mkdir src/components

# ❌ ESCALATE - Destructive
rm -rf node_modules/
git push --force origin main
DROP TABLE users;

# ❌ ESCALATE - System changes
brew install postgresql
sudo vim /etc/hosts
docker run --privileged
```

## Error Recovery Protocol
When commands fail:
1. **AUTO-RETRY** once with corrected approach
2. If retry fails, **AUTO-RESEARCH** error (logs, docs, Stack Overflow) 
3. **AUTO-ATTEMPT** alternative approach if found
4. **ESCALATE** only after 2-3 automated attempts fail

## Escalation Format
When escalating, use this template:
```
🚨 **ESCALATION NEEDED** 

**Context**: [Current task and objective]
**Blocker**: [Specific issue encountered]  
**Attempts**: [What was tried automatically]
**Decision needed**: [What human input is required]
**Impact**: [How this affects timeline/dependencies]
```

## Continuous Operation Mandate
- **Work in batches**: Process up to 5 assigned issues simultaneously
- **Queue monitoring**: Check for new assignments every 15-30 minutes
- **Zero idle time**: Always have active work or be querying for more
- **Self-directed**: Don't wait for explicit human task assignment