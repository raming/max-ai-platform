# Agent Quick Commands (User Reference)

Purpose
Provide memorable shortcuts for common agent management tasks, especially session management.

**IMPORTANT**: The `@` symbol is reserved by VS Code for chat participants. Use natural language commands instead.

## Session Management Commands

### "/" Commands for Context Attachment (Token-Efficient)

**Attach Current Session:**
- "/session" - Attach current session file as context (creates if needed)
- "/session attach" - Same as above, explicit attachment
- "/session create" - Create/update session file and attach as context

### Natural Language Commands (Primary Method)

**Create Session from History:**
- "save session" - Save this conversation as a session file
- "save this conversation" - Save to session file
- "create session file" - Record conversation to session file
- "snapshot conversation" - Take a snapshot of history

**Load Previous Session:**
- "resume session" - Resume from yesterday's session
- "continue session" - Continue from last session
- "load yesterday" - Load yesterday's session and create today's
- "load previous session" - Resume from last session

**Status Check:**
- "show status" - Show current session info and role
- "who am i" - Display role, seat, and session file
- "what session" - Show current session context
- "session info" - Display session details

**Session History:**
- "list sessions" - List all session files for this project
- "show history" - Show recent session files
- "session history" - Display all sessions

### Alternative Short Phrases

Users can use these shorter variations:
- "save" or "save it"
- "resume" or "continue"
- "status" or "info"
- "whoami"
- "history" or "sessions"

## Agent Startup Banner

When an agent loads via `/{Role}` command, it MUST display:

```
╔════════════════════════════════════════════════════════╗
║ 🤖 {Role} Agent | Seat: {role}.{name}                  ║
╔════════════════════════════════════════════════════════╗

Quick Commands:
  "/session"             - Create/update and attach session as context
  "save session"          - Save conversation to session file
  "resume session"        - Load yesterday's session
  "show status"        - Show current session info
  "who am i"        - Display role and seat
  
Session Status:
  📁 Current: {session-file} or [None - use "save session" to create]
  📅 Date: {current-date}
  
Ready to work! 🚀
```

## Implementation in Role Prompts

Each role prompt (`prompts/roles/{role}/base.md`) should include in the **Startup Behavior** section:

```markdown
## Startup Display (MANDATORY)

Upon loading via "/{Role}" command, immediately display:

1. **Agent Banner** with role, seat, quick commands
2. **Session Status** showing current or last session file
3. **Quick Command Reference** ("/session" for context attachment, natural language: "save session", "resume session", "show status", "who am i")
4. **Ready State** confirmation

This ensures users always know:
- Who they're talking to (role/seat)
- What session is active
- What commands are available

**Banner Format:**
```
╔════════════════════════════════════════════════════════╗
║ 🤖 {Role} Agent | Seat: {role}.{name}                  ║
╚════════════════════════════════════════════════════════╝

Quick Commands:
  "/session"         - Create/update and attach session as context
  "save session"     - Save conversation to session file
  "resume session"   - Load yesterday's session
  "show status"      - Show current session info
  "who am i"         - Display role and seat
  
Session Status:
  📁 Current: {session-file} or [None - say "save session" to create]
  📅 Date: {current-date}
  
Ready to work! 🚀
```
```

## Command Processing Logic

When agent receives a command:

1. **"/session"** or **"/session attach"** or **"/session create"**:
   - Create/update session file in `.copilot/sessions/YYYY-MM-DD-{role}-{topic}.md`
   - Extract key information from conversation history (task, decisions, progress, blockers)
   - Instruct user: "Session file created/updated. Use '/session' again to attach as context for token-efficient reference."
   - Display file path and summary

2. **"save session"** or **"save this conversation"** or **"create session file"**:
   - Read full conversation history
   - Extract key information (task, decisions, progress, blockers)
   - Create `.copilot/sessions/{date}-{role}-{task-slug}.md`
   - Create `.copilot/user-inputs/` files if user requirements found
   - Display confirmation with file paths

2. **"resume session"** or **"continue session"** or **"load yesterday"**:
   - Load yesterday's session file from `.copilot/sessions/`
   - Create new session file for today with reference to previous
   - Display summary: "Loaded from {yesterday-file}, created {today-file}"

3. **"show status"** or **"status"** or **"session info"**:
   - Display agent banner with role, seat, session file
   - Show current task status
   - List recent decisions/progress

4. **"who am i"** or **"whoami"** or **"what session"**:
   - Read and display current session file contents
   - Show related user inputs
   - Display recent decisions

5. **"list sessions"** or **"session history"** or **"show history"**:
   - List all session files in `.copilot/sessions/` for this role
   - Sort by date (newest first)
   - Show status of each session

## VS Code Integration (Future Enhancement)

**Note**: VS Code Copilot Chat does NOT currently support custom buttons/widgets in chat. However, we can:

1. **Use Chat Participants**: Create custom `@agent` participant (requires extension)
2. **Use Slash Commands**: Register custom `/save-session`, `/load-session` commands (requires extension)
3. **Use Quick Picks**: Agent can trigger VS Code quick pick menus (limited)

**Current Best Practice**: Use `@command` syntax in chat, which agents can recognize and process.

## User Documentation

Create a quick reference card for users:

```markdown
┌─────────────────────────────────────────┐
│ Agent Session Commands Cheat Sheet     │
├─────────────────────────────────────────┤
│ "save session"          Save conversation        │
│ "resume session"        Load yesterday's session │
│ "show status"        Show session info        │
│ "who am i"        Show role & seat         │
│ "list sessions"       List all sessions        │
└─────────────────────────────────────────┘

Full commands also work:
  "Create session file from history"
  "Load yesterday's session"
```

## Migration from Long Commands

**Old (still works):**
```
User: "Create session file from this conversation"
User: "Load yesterday's session from .copilot/sessions/2025-10-15-architect-api.md and create today's session file"
```

**New (easier):**
```
User: ""save session""
User: ""resume session""
```

Both syntaxes are supported. The `@command` syntax is just a shortcut.

## Error Handling

If agent doesn't recognize `@command`:
- Agent should respond: "Did you mean: "save session", "resume session", "show status", or "who am i"?"
- Provide quick reference of available commands
- Fall back to natural language interpretation

## Accessibility

- Commands are case-insensitive: `"save session"` = `@Save` = `@SAVE`
- Partial matches work: `@sav` → suggests `"save session"`
- Natural language always works as fallback
- Agent banner always visible on startup (no hidden commands)

## Training Protocol

All agents must:
1. ✅ Display startup banner with commands when loaded
2. ✅ Recognize `@command` syntax
3. ✅ Process session management commands
4. ✅ Provide helpful errors if command not recognized
5. ✅ Support both `@command` and natural language

This makes session management discoverable and easy to use! 🎯
