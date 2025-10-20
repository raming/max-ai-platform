# Prompt Persistence and Token Management Strategy

## The Core Problem

**GitHub Copilot Limitation**: No built-in mechanism for agents to automatically refresh their role prompts.

**Token Counting Reality**:
- **Message body (prompt + text)**: High token cost, stored in conversation history
- **File attachments**: Lower token impact, processed more efficiently
- **Result**: Attachments via "/" commands are significantly more token-efficient

**User's Current Workaround**: Using "/" commands to manually re-inject prompts when agent loses context.

## Recommended Strategy

### 1. User-Driven Prompt Refresh (Primary Method)

**How It Works:**
```
User Session Start:
1. User invokes "/{Role}" command (e.g., "/Architect", "/Dev")
2. This attaches .github/prompts/{Role}.prompt.md as efficient attachment
3. Agent loaded with full role context

During Long Conversations:
1. User monitors for role drift (e.g., architect starts writing code)
2. User re-invokes "/{Role}" command to refresh prompt
3. Agent acknowledges refresh and realigns behavior
```

**Advantages:**
- ✅ Most token-efficient approach
- ✅ Full prompt context restored
- ✅ Works within Copilot's current capabilities
- ✅ User has control over when refresh happens

**Disadvantages:**
- ❌ Requires user vigilance to notice drift
- ❌ Manual intervention needed
- ❌ No automatic recovery mechanism

### 2. Compact Context Reminders (Supplementary)

**Implementation:**

Create `.copilot/context/current-role-context.md` (< 500 tokens):

```markdown
# Role: {Role Name}
Seat: {role}.{name}

## Core Responsibilities (Top 3)
1. {Most critical responsibility}
2. {Second most critical}
3. {Third most critical}

## Key Constraints
- {Critical constraint 1}
- {Critical constraint 2}

## Escalation Triggers
- Escalate: {When to escalate}
- Never: {What agent should never do}

## Quick Links
- Full Prompt: .github/prompts/{Role}.prompt.md
- Session: .copilot/sessions/{current-session}.md
```

**Usage:**
- Agent references this file before major decisions
- User can say: "Check your role context" instead of full prompt reload
- Much lower token cost than full prompt

**Advantages:**
- ✅ Lower token cost than full prompt
- ✅ Quick context checks
- ✅ Reduces need for full prompt refreshes

**Disadvantages:**
- ❌ Not a complete prompt replacement
- ❌ Agent must remember to check it
- ❌ Can still drift without user intervention

### 3. Session File Role Reminders (Recommended Addition)

**Add to every session file:**

```markdown
# Session: {Role} - {Topic}

## Role Reminder
- I am: {Role} ({Seat})
- I DO: {3 core responsibilities}
- I DON'T: {3 key constraints}
- I ESCALATE: {When to escalate}

[... rest of session template ...]
```

**Workflow:**
1. Agent creates/updates session file with role reminder at top
2. Agent re-reads session file before major decisions
3. Role reminder keeps agent aligned without full prompt refresh

**Advantages:**
- ✅ Integrated into existing session workflow
- ✅ No additional files to manage
- ✅ Self-reinforcing during session updates

**Disadvantages:**
- ❌ Still requires agent discipline to check
- ❌ Not automatic

### 4. User Monitoring Checklist (Human-in-the-Loop)

**Signs Agent Has Forgotten Prompt:**
- ✋ Architect starts writing implementation code
- ✋ Dev makes architectural decisions without escalating
- ✋ Team Lead writes code instead of planning
- ✋ Agent violates documentation rules
- ✋ Agent ignores established quality gates

**User Response:**
1. Immediately invoke "/{Role}" command to refresh prompt
2. Say: "Review your role boundaries and current session context"
3. Agent reloads full prompt and corrects behavior

## Hybrid Workflow (Recommended)

### Session Start
```
1. User: "/{Role}"  (loads full prompt via attachment)
2. Agent: Creates session file with role reminder
3. Agent: Creates compact role-context.md if not exists
```

### During Work
```
Agent behavior:
- Before major decisions: Re-read session file role reminder
- Every 5-10 minutes: Check .copilot/context/{role}-role-context.md
- When uncertain: Ask user to confirm role boundaries

User behavior:
- Monitor for role drift
- Refresh prompt when drift detected: "/{Role}"
```

### Context Loss Recovery
```
Scenario: Agent forgets it's architect and starts coding

Option A (Full Reset):
1. User: "/{Role}"
2. Agent: Reloads full prompt
3. Agent: "I am the architect agent. I should not write code. Let me create a dev task instead."

Option B (Quick Reminder):
1. User: "Check your role context"
2. Agent: Reads .copilot/context/current-role-context.md
3. Agent: "You're right, architects don't code. Creating task for dev."
```

## Token Budget Management

### Keep Prompts Compact
- Main role prompts: Target < 3000 tokens
- Session files: Target < 2000 tokens
- Context reminders: Target < 500 tokens

### Use References, Not Duplication
```
❌ BAD (High Token Cost):
"As specified in coding-standards.md, you must ensure ≥95% coverage, 
run lint with --max-warnings 0, implement ports/adapters..."

✅ GOOD (Low Token Cost):
"Follow coding-standards.md requirements (coverage, linting, architecture)"
```

### Attachment Strategy
```
High Priority (attach frequently):
- Role prompt: .github/prompts/{Role}.prompt.md
- Current session: .copilot/sessions/{current}.md

Medium Priority (attach when needed):
- Specific rules: rules/documentation.md
- User inputs: .copilot/user-inputs/{relevant}.md

Low Priority (reference only):
- Full rule library
- Historical sessions
```

## Implementation Checklist

### Phase 1: Current State (Working)
- [x] GitHub prompts in `.github/prompts/`
- [x] User uses "/" commands for prompt loading
- [x] Manual monitoring for role drift

### Phase 2: Add Context Support
- [ ] Create `.copilot/context/` directory
- [ ] Add compact role-context.md for each role
- [ ] Update session template to include role reminder section
- [ ] Document when to use full prompt vs context reminder

### Phase 3: User Training
- [ ] Document signs of prompt loss
- [ ] Train users on "/" command refresh workflow
- [ ] Create quick reference for monitoring role drift

### Phase 4: Optimization
- [ ] Monitor which approach works best (full prompt vs context)
- [ ] Refine token budgets based on actual usage
- [ ] Adjust reminder frequency based on drift patterns

## Key Takeaway

**There is NO automatic solution for prompt persistence in GitHub Copilot.**

**Reality Check:**
- Copilot **cannot** automatically reload prompts every 5-10 minutes
- Copilot **cannot** self-trigger "/" commands
- Instructions to "check context every 5-10 minutes" are **guidance**, not enforcement
- If the agent forgets its role, it may also forget to check context files

The best approach is:
1. **User-driven prompt refresh** via "/" commands (most reliable) - **THIS IS THE ONLY GUARANTEED METHOD**
2. **Supplementary context reminders** for quick realignment (if agent remembers to check)
3. **Session file role reminders** for continuous reinforcement (if agent reads them)
4. **User vigilance** to catch drift and trigger refresh - **CRITICAL: USER IS THE SAFETY NET**

This is a **human-in-the-loop system by necessity**, not by choice. The user's current "/" command approach is correct and **must remain the primary mechanism**.