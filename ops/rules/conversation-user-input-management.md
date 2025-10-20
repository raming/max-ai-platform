# Conversation and User Input Management (canonical)

Purpose
Address GitHub Copilot's memory limitations and token constraints by implementing systematic conversation tracking, user input capture, and context preservation across long-running agent sessions.

## Problem Statement

### Copilot Memory Limitations
- **Context Loss**: Copilot forgets earlier conversation history, especially critical user inputs
- **Token Limits**: Growing prompts + conversation history can exceed token limits
- **Scattered Summaries**: Copilot creates summary files in random directories, polluting codebase
- **User Input Loss**: Critical user requirements and decisions get lost in conversation history

### Impact on AI Agents
- **Architect Sessions**: Users discuss multiple topics, then request design work based on earlier discussion - architect has forgotten context
- **Decision Tracking**: Important architectural decisions made in conversation are lost
- **Requirements Capture**: User requirements scattered across conversation history without formal capture
- **Session Recovery**: Cannot recover context after tab closure or session restart

## Solution Architecture

### Token Efficiency Strategy

**Session Tracking: MANUAL ONLY**
- **DISABLED**: Automatic session updates every 15-30 minutes
- **ENABLED**: User-triggered session creation via commands
- **ATTACHMENT-BASED**: Sessions added as context via "/" commands for token efficiency

**Prompt Handling:**
- **GitHub Prompts (Recommended)**: Use `.github/prompts/{Role}.prompt.md` files invoked via "/" commands
  - Token-efficient: Treated as attachments, not conversation history
  - User-controlled: User triggers prompt refresh when agent loses context
  - Trade-off: Requires manual intervention, but preserves token budget
  
- **Inline Prompts (Not Recommended)**: Embedding prompts in every message
  - High token cost: Counts against conversation history
  - Quickly exhausts token limit
  - Causes premature context loss

**Session File Strategy:**
- Keep session files **compact and focused** (target: <2KB per file)
- Reference external files via links, don't duplicate content
- Use structured sections for easy parsing
- Attachments to session files are token-efficient

### 1. Structured Conversation Tracking

**Directory Structure:**
```
<project-root>/.copilot/
├── sessions/                    # Per-session conversation tracking (compact)
│   ├── 2025-10-16-architect-user-portal.md
│   ├── 2025-10-16-dev-api-integration.md
│   └── 2025-10-15-teamlead-sprint-planning.md
├── user-inputs/                 # Formal user input capture
│   ├── 2025-10-16-user-portal-requirements.md
│   ├── 2025-10-15-api-integration-constraints.md
│   └── index.yaml              # Searchable index of inputs
├── decisions/                   # Architectural decisions from sessions
│   ├── 2025-10-16-auth-strategy.md
│   └── 2025-10-15-database-choice.md
├── context/                     # Lightweight context reminders
│   └── current-role-context.md # Quick role reminder (ultra-compact)
└── .gitignore                  # Exclude from repository
```

**Gitignore Configuration:**
```gitignore
# Copilot conversation tracking (local only)
.copilot/sessions/
.copilot/user-inputs/
.copilot/decisions/

# Keep structure documentation
!.copilot/README.md
!.copilot/.gitkeep
```

### 2. Session Tracking Template

**File: `.copilot/sessions/YYYY-MM-DD-{role}-{topic}.md`**

```markdown
# Session: {Role} - {Topic}
Date: YYYY-MM-DD HH:MM
Role: architect|dev|team_lead|qa|sre
Status: active|completed|paused

## Session Context
- **Task**: [Task ID and description]
- **Goal**: [What we're trying to achieve]
- **Related Issues**: [Links to GitHub issues]

## User Inputs (Critical - Must Preserve)
1. [Timestamp] User requested: {detailed user input}
2. [Timestamp] User clarified: {clarification}
3. [Timestamp] User decided: {decision}

## Discussion Summary
### Key Topics Discussed
- Topic 1: Brief summary
- Topic 2: Brief summary

### Technical Decisions Made
- Decision 1: Choice and rationale
- Decision 2: Choice and rationale

### Action Items
- [ ] Action 1
- [ ] Action 2

## Artifacts Created
- [Link to spec/ADR/design]
- [Link to PR/issue]

## Next Steps
- What needs to happen next
- Open questions requiring user input

## Session History
- [10:00] Started discussion about {topic}
- [10:15] User provided requirements for {feature}
- [10:30] Created draft specification
- [10:45] User approved approach
```

### 3. User Input Capture Template

**File: `.copilot/user-inputs/YYYY-MM-DD-{topic}.md`**

```markdown
# User Input: {Topic}
Date: YYYY-MM-DD HH:MM
Captured By: {Role}-{Seat}
Priority: P0|P1|P2
Status: draft|reviewed|approved|implemented

## Original User Input
> [Exact quote or paraphrase of user's words]

## Interpreted Requirements
1. Requirement 1: {functional requirement}
2. Requirement 2: {non-functional requirement}
3. Constraint 1: {constraint}

## Clarifications Needed
- [ ] Question 1
- [ ] Question 2

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Related Sessions
- Session: [Link to session file]
- Issues: [GitHub issue links]
- Decisions: [Link to decision files]

## Implementation Tracking
- Spec Created: [Link]
- Tasks Created: [Links]
- Status: [Current status]
```

### 4. Copilot Instructions Integration

**File: `.github/.copilot-instructions.md`** (or use GitHub Copilot Instructions feature)

```markdown
### 4. Copilot Instructions Integration

**File: `.github/.copilot-instructions.md`**

This file provides workspace-level instructions that GitHub Copilot reads when loading.
It serves two purposes:

1. **Session Management**: Instructions for session tracking and user input capture
2. **Banner Enforcement**: Critical startup behavior (display banner immediately)

The file is synced to all projects via `registry/projects.yaml` to ensure consistent
workspace-level instructions across all repos.

**Purpose of Workspace-Level Instructions:**
- Provides backup enforcement when prompt files are ignored by Copilot
- Read at workspace level, potentially more reliable than role prompt instructions
- Part of four-level banner enforcement strategy (plain text + header + rules + workspace)

```markdown
## Session Management Rules

### Manual Session Tracking (On-Demand)
1. Session tracking is MANUAL - agents do NOT automatically create or update session files
2. Use "/session" command to manually create/update and attach session as context
3. Session files are created only when user explicitly requests via "/session" command
4. No automatic updates every 15-30 minutes - this was causing performance issues

### User Input Capture Protocol
When user provides ANY of these, capture to `.copilot/user-inputs/` ONLY when using "/session":
- Requirements or feature requests
- Design preferences or constraints
- Technical decisions or approvals
- Questions that need answers
- Priorities or timeline changes

```

### Context Preservation
Before making ANY architectural decision or starting implementation:
1. If no current session, ask user to use "/session" to create one
2. Review current session file for user inputs (if exists)
3. Check related user input files (if any)
4. Verify no conflicting prior decisions
5. If context is unclear, ASK USER rather than assume

### Session File Updates
Update session file ONLY when user uses "/session" command:
- User explicitly requests session creation/update
- Extract key information from conversation history
- Attach as context for token-efficient reference
- No automatic background updates
```

## Agent Workflow Integration

### Architect Session Workflow
```
1. Session Start:
   - Ask user to use "/session" if they want to create/load session context
   - If session exists, user can attach it via "/session" command
   - Announce: "Use '/session' to create or attach session context for token-efficient tracking"

2. During Conversation:
   - NO automatic session updates - this was causing performance issues
   - If user wants to save progress, they use "/session" command
   - Create user input files only when user explicitly requests via "/session"

3. Before Design Work:
   - If no session context, ask user to use "/session" to establish context
   - Review session file if attached via "/session"
   - Confirm understanding with user
   - Create formal spec referencing captured inputs

4. Session End/Pause:
   - If user wants to save, use "/session" command
   - Summarize decisions made
   - List next steps
   - Session files created only on-demand
```

### Team Lead Session Workflow
```
1. Planning Session:
   - Use "/session" to create session context for planning activity
   - Capture user priorities and timeline inputs when "/session" is used
   - Track decision rationale in session file (on-demand only)

2. User Input Review:
   - Before creating tasks, ask user to use "/session" to attach context
   - Verify requirements are correctly interpreted
   - Flag any missing clarifications
```

### Dev Session Workflow
```
1. Implementation Start:
   - Ask user to use "/session" to attach relevant context
   - Check for any user-specified constraints in attached session
   - Note any user preferences in implementation

2. Questions/Blockers:
   - Check attached session history for prior answers
   - Review session context before escalating
```

## Implementation Checklist

### Project Setup
- [ ] Create `.copilot/` directory structure
- [ ] Add `.copilot/.gitignore` to exclude sessions but keep structure
- [ ] Create `.copilot/README.md` explaining purpose
- [ ] Add session/user-input templates to `.copilot/templates/`

### Agent Rule Updates
- [ ] Update `agent-startup.md` to load session file at start
- [ ] Update role prompts to maintain session files
- [ ] Add user input capture to `human-input-management.md`
- [ ] Update `agent-state-management.md` to reference session files

### Copilot Instructions
- [ ] Add session management rules to `.github/.copilot-instructions.md`
- [ ] Configure Copilot workspace indexing to include `.copilot/` files
- [ ] Test session file persistence across tab closures

## Benefits

### Memory Preservation
- User inputs captured immediately, never lost
- Session context preserved across interruptions
- Decision history traceable
- Requirements formalized from conversation

### Token Efficiency
- Session files provide compact context summaries
- Avoid repeating full conversation history
- Reference external files rather than inline context
- Structured format reduces token overhead

### Workflow Improvement
- Formal user input capture ensures requirements aren't missed
- Session history enables quick context recovery
- Decision tracking creates audit trail
- Cross-agent coordination improved with shared context

### Codebase Hygiene
- All tracking files in dedicated `.copilot/` directory
- Git-ignored to prevent repo pollution
- Structured naming for easy navigation
- Clear separation from production documentation

## Migration Path

### Phase 1: Structure Setup
1. Create `.copilot/` directory structure in ops-template
2. Add templates for session/user-input files
3. Update `.gitignore` to exclude tracking files
4. Sync to all projects

### Phase 2: Agent Training
1. Update agent startup rules to use session files
2. Add session management to role prompts
3. Train architects on user input capture
4. Test with sample sessions

### Phase 3: Optimization
1. Monitor session file size and token usage
2. Refine templates based on usage patterns
3. Add automation for session file management
4. Create utilities for searching user inputs

## Success Metrics

- **User Input Capture Rate**: >95% of user inputs formally captured
- **Context Recovery**: Agents can resume work from session files without user re-explanation
- **Decision Traceability**: 100% of architectural decisions linked to user inputs
- **Token Efficiency**: Session files reduce token usage by 30-50% vs full history
- **Codebase Cleanliness**: Zero conversation summaries in production code directories

## Retroactive Session Creation (Recovery Commands)

For conversations that occurred **before** session tracking was implemented, users can explicitly request reconstruction:

### User Commands to Trigger Recovery
- "Create session file from history"
- "Reconstruct conversation session"
- "Document this conversation in .copilot/sessions/"
- "Save this conversation as a session file"
- "Generate session summary from our discussion"

### Agent Response Protocol
When user requests retroactive session creation:

1. **READ FULL CONVERSATION**: Review entire thread from beginning
2. **EXTRACT STRUCTURED DATA**:
   - Task/issue being worked on
   - Decisions made with rationale
   - Files created/modified
   - Blockers or questions
   - Current status
   - User requirements/preferences (for user-input file)
3. **CREATE SESSION FILE**: Use standard template in `.copilot/sessions/`
4. **CREATE USER INPUT FILE** (if applicable): Extract formal requirements to `.copilot/user-inputs/`
5. **ANNOUNCE COMPLETION**: Summarize what was captured and where

### Example Workflow
```
User: "Create session file from this conversation"

Agent: 
1. Reviews conversation history
2. Creates `.copilot/sessions/2025-10-16-architect-api-design.md` with:
   - Goal: Design RESTful API for user management
   - Progress: Created OpenAPI spec, defined 4 endpoints
   - Decisions: Use JWT auth (user requirement), pagination defaults to 50 items
   - Status: in-progress, waiting for user review of spec
3. Creates `.copilot/user-inputs/2025-10-16-api-auth-requirement.md` with:
   - User requirement: "Must use JWT tokens for authentication"
   - Context: Security requirement for mobile app integration
4. Responds:
   "Session file created at .copilot/sessions/2025-10-16-architect-api-design.md
   User input captured at .copilot/user-inputs/2025-10-16-api-auth-requirement.md
   Current status: in-progress, spec ready for review"
```

### Benefits of Retroactive Creation
- ✅ Transitions existing work into tracking system
- ✅ Captures decisions made before system existed
- ✅ Enables proper handoffs for in-progress work
- ✅ Creates audit trail for ongoing projects
- ✅ Prevents loss of context in long-running conversations

**Note**: This is a one-time recovery mechanism. New sessions should create tracking files proactively during agent startup.