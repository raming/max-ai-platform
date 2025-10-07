# MaxAI Platform - GitHub Copilot Prompts

This directory contains specialized GitHub Copilot prompts for different agent roles in the MaxAI platform development workflow.

## Available Agent Prompts

### 🏗️ Architect (`@Architect`)
**File**: `.github/prompts/Architect.prompt.md`  
**Seat**: `architect.morgan-lee`  
**Purpose**: Architecture design, specifications, ADRs, and governance

### 👥 Team Lead (`@TeamLead`)
**File**: `.github/prompts/TeamLead.prompt.md`  
**Seat**: `team_lead.casey-brooks`  
**Purpose**: Project coordination, sprint planning, story creation, and stakeholder communication

### 💻 Developer (`@Developer`)
**File**: `.github/prompts/Developer.prompt.md`  
**Seat**: `dev.avery-kim`  
**Purpose**: Feature implementation, code development, unit/integration testing

### 🧪 QA (`@QA`)
**File**: `.github/prompts/QA.prompt.md`  
**Seat**: `qa.mina-li`  
**Purpose**: Quality assurance, end-to-end testing, contract validation, performance testing

### 🔧 SRE (`@SRE`)
**File**: `.github/prompts/SRE.prompt.md`  
**Seat**: `sre.devon-singh`  
**Purpose**: Infrastructure management, monitoring, deployment automation, incident response

### 🚀 Release Manager (`@ReleaseManager`)
**File**: `.github/prompts/ReleaseManager.prompt.md`  
**Seat**: `release_manager.rohan-patel`  
**Purpose**: Release planning, deployment coordination, quality gates, version management

## How to Use

### In GitHub Copilot Chat (VS Code)

1. **Open GitHub Copilot Chat**: Use `Cmd+Shift+I` or open the Copilot Chat panel
2. **Invoke Agent**: Use `@AgentName` to invoke a specific agent (e.g., `@Architect`)
3. **Ask Questions**: Each agent has specialized knowledge and will respond according to their role

### Example Usage

```
@Architect who are you?
@Developer what are my current issues?
@QA how should I test the new authentication feature?
@SRE what monitoring should we add for the new API?
@TeamLead create a story for user authentication
@ReleaseManager what's the status of the next release?
```

## Agent Features

### ✅ GitHub Issues Integration
- All agents use **real GitHub Issues** via ops-template scripts
- No hallucinated "local storage" or "internal database" 
- Proper seat-based issue filtering and assignment

### ✅ Role-Specific Behavior  
- Each agent has distinct responsibilities and workflows
- Proper escalation patterns between roles
- Architectural governance and approval authority

### ✅ Operational Commands
- Real ops-template script integration
- GitHub CLI-based issue management
- Proper seat identity and project context

## Project Context

- **Repository**: `/Users/rayg/repos/max-ai/platform/`
- **Client Code**: `client/` directory
- **Operations**: `ops/` directory
- **Agent Configuration**: `ops/.agents/rules/agents.yaml`
- **Prompt Templates**: `/Users/rayg/repos/ops-template/prompts/roles/`

## Related Tools

- **Continue Extension**: `.continue/agents/` (per-repo AI agents)
- **Warp Workflows**: Terminal-based agent prompt copying
- **GitHub CLI**: Issue management and GitHub API integration
- **ops-template**: Centralized agent workflow scripts
- **GitHub Copilot Prompts**: `.github/prompts/` (repository-specific prompts)

Each prompt provides the same agent experience as the Warp workflows and Continue agents, but integrated directly into GitHub Copilot Chat for seamless VS Code workflow.
