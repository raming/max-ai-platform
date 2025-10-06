# Agent State Management & Persistence (Canonical)

Purpose
Provide systematic state preservation and recovery for agents to prevent lost work during interruptions, tab losses, or context switches.

## Core Problem
**Agent work context is lost** when tabs close, agents are interrupted, or context switches occur, leading to duplicate work and lost progress.

## 🔄 **Agent State Persistence Strategy**

### Approach: Hybrid Comment + File Cache System

**Why Hybrid**:
- **Issue Comments**: Persistent, visible, trackable, survives tab loss
- **File Cache**: Fast access, structured data, automatic cleanup
- **Best of Both**: Durability + Performance + Visibility

## 📋 **State Persistence Locations**

### Option 1: Issue Comment State (Recommended)
**Location**: GitHub issue comments with special formatting
**Advantages**: 
- ✅ Survives tab/session loss
- ✅ Visible to other agents and humans
- ✅ Automatic timestamp tracking
- ✅ No cleanup required (part of issue history)
- ✅ Works across all environments

### Option 2: Agent Workspace Cache (Supplementary)
**Location**: `.agents/workspaces/{seat}/current-state.json`
**Advantages**:
- ✅ Fast access for complex state
- ✅ Structured data storage
- ✅ Can store large context
**Disadvantages**:
- ❌ Requires cleanup
- ❌ Lost if filesystem issues

## 🎯 **State Persistence Workflow**

### Automatic State Saving Triggers
**SAVE STATE when**:
1. **Starting work** on a new task
2. **Every 15 minutes** during active work
3. **Before human interruption** processing
4. **Before escalation** to architect/team lead
5. **Before switching** to different task
6. **After completing** major milestones

### State Restoration Triggers  
**RESTORE STATE when**:
1. **Agent startup** - check for unfinished work
2. **Returning from interruption** - resume previous context
3. **New session** - recover lost tab work
4. **Manual request** - human asks "what were you working on?"

## 📝 **Agent State Comment Format**

### Work-in-Progress State Comment
```markdown
🔄 **AGENT STATE CHECKPOINT** - {seat} - {timestamp}

**Task**: [Current GitHub issue #]
**Progress**: [Brief description of current progress]
**Current Focus**: [Specific thing being worked on right now]

### Work Completed
- [x] [Completed item 1] 
- [x] [Completed item 2]

### Work In Progress  
- [ ] [Current item being worked on] - **IN PROGRESS**
  - ✅ [Completed sub-task]
  - 🔄 [Currently working on sub-task]  
  - ⏳ [Next sub-task]

### Next Steps
- [ ] [Next planned item]
- [ ] [Following item]

### Context & Notes
**Technical Context**: [Important technical decisions, patterns used]
**Blockers**: [Current blockers or questions]
**Dependencies**: [Waiting on other agents/humans]
**Files Modified**: [List of files changed]
**Branch**: [Git branch being used]

### Human Inputs Pending
- [ ] [Human input #1 received but not yet processed]
- [ ] [Human input #2 queued for after current task]

**Last Updated**: {timestamp}
**Resume Command**: `Continue work on {specific-item} from checkpoint above`
```

### Task Completion State Comment
```markdown
✅ **AGENT STATE CLEARED** - {seat} - {timestamp}

**Task**: [Completed GitHub issue #]
**Status**: COMPLETED
**Final Actions**:
- [x] [All work items completed]
- [x] State cleared and ready for next assignment

**Handoff**: [If handed off to another role, note details]
**Next**: Ready for new assignment from GitHub Issues queue
```

## 🗂️ **Agent Workspace Cache Format**

### File: `.agents/workspaces/{seat}/current-state.json`
```json
{
  "agent_seat": "dev.avery-kim",
  "task_issue_number": 25,
  "task_title": "HAKIM-0020 — Implement Feature Gate SDK",
  "status": "in_progress", 
  "started_at": "2025-01-27T10:30:00Z",
  "last_updated": "2025-01-27T14:45:00Z",
  "current_focus": "Implementing FileFeatureConfigAdapter with caching",
  
  "progress": {
    "completed_items": [
      "Created core interface definitions",
      "Set up project structure and dependencies"
    ],
    "current_item": "FileFeatureConfigAdapter implementation",
    "current_item_progress": "Working on ETag caching logic",
    "next_items": [
      "Add JSON Schema validation",
      "Implement GroupFileAdapter",
      "Write unit tests"
    ]
  },
  
  "technical_context": {
    "branch_name": "work/dev/HAKIM-0020-feature-gate-sdk",
    "files_modified": [
      "src/ports/FeatureGate.ts",
      "src/adapters/FileFeatureConfigAdapter.ts"
    ],
    "dependencies_added": [
      "ajv",
      "node-cache"
    ],
    "architectural_decisions": [
      "Using AJV for JSON Schema validation",
      "Node-cache for in-memory L1 cache"
    ]
  },
  
  "blockers": [],
  "human_inputs_pending": [
    {
      "input": "Should we support YAML config format too?",
      "received_at": "2025-01-27T13:20:00Z",
      "classification": "task-worthy",
      "status": "queued_for_after_current_task"
    }
  ],
  
  "interruption_context": {
    "interrupted_by": "human_input",
    "interrupted_at": "2025-01-27T14:45:00Z",
    "resume_point": "Continue implementing ETag validation in FileFeatureConfigAdapter.refreshConfig() method"
  }
}
```

## 🚦 **Agent Behavior Rules**

### State Saving Rules

**✅ MANDATORY STATE SAVES**:
```markdown
🔄 **AUTO-SAVE TRIGGERED**: {trigger-reason}
**Current Work**: [Brief description]
**Progress**: [X of Y items complete]
**State**: Saved to issue comment and workspace cache
```

**Triggers**:
- Every 15 minutes of active work
- Before processing human interruptions  
- Before escalating to architect
- Before switching tasks
- Before major implementation milestones

### State Restoration Rules

**🔄 RESUME FROM STATE**:
```markdown
🔄 **RESUMING FROM CHECKPOINT**: Found previous work on issue #{number}
**Last Checkpoint**: {timestamp}
**Previous Progress**: [Summary from state]
**Resuming**: [Specific point where work continues]
**Estimated Completion**: [Based on remaining work]
```

**Automatic Resume Scenarios**:
- Agent startup with unfinished work
- New tab after previous tab lost  
- Returning from human interruption
- Returning from escalation

### State Cleanup Rules

**✅ AUTOMATIC CLEANUP**:
```markdown
✅ **STATE CLEANED**: Task completion detected
**Workspace Cache**: Cleared
**Issue Comment**: Final completion state saved
**Ready**: For next task assignment
```

**Cleanup Triggers**:
- Task marked as completed
- Issue closed or transitioned to next role
- Manual state reset command
- Agent reassigned to different task

## 📊 **State Management Commands**

### Manual State Operations
```bash
# Save current state manually
🔄 **SAVE STATE**: "Manual checkpoint before testing new approach"

# Restore from last checkpoint  
🔄 **RESTORE STATE**: "Resuming from last checkpoint on issue #25"

# Clear state manually
✅ **CLEAR STATE**: "Task handed off to QA, clearing development state"

# Show current state
📋 **SHOW STATE**: Display current work progress and context
```

## 🔄 **Integration with Human Input Management**

### When Human Interruption Occurs
1. **Auto-save current state** to issue comment
2. **Process human input** per human-input-management.md
3. **If continuing current task**: Resume from checkpoint
4. **If switching tasks**: Complete state handoff

### Multi-Agent Coordination
```markdown
🔄 **AGENT HANDOFF WITH STATE**

**From**: dev.avery-kim  
**To**: qa.mina-li
**Task**: Issue #25 - Feature Gate SDK
**State Transfer**: 
- Development 90% complete
- Tests written and passing
- Ready for QA validation
**Resume Point**: "Begin QA testing with implemented FileFeatureConfigAdapter"
**Context**: [Link to last state comment]
```

## 📈 **State Persistence Examples**

### Example 1: Development Work Checkpoint
```markdown
🔄 **AGENT STATE CHECKPOINT** - dev.avery-kim - 2025-01-27T14:30:00Z

**Task**: #25 - HAKIM-0020 Feature Gate SDK Implementation
**Progress**: Day 2 of development, 60% complete
**Current Focus**: Implementing ETag caching in FileFeatureConfigAdapter

### Work Completed
- [x] Created FeatureGate, FeatureConfigProvider interfaces
- [x] Set up project structure with TypeScript
- [x] Added AJV for JSON Schema validation
- [x] Implemented basic file reading logic

### Work In Progress
- [ ] FileFeatureConfigAdapter caching - **IN PROGRESS** 
  - ✅ Basic file reading implemented
  - 🔄 ETag validation logic (current focus)
  - ⏳ Last Known Good fallback

### Next Steps  
- [ ] Implement GroupFileAdapter
- [ ] Add comprehensive unit tests
- [ ] Performance testing with concurrent loads

### Context & Notes
**Technical Context**: Using node-cache for L1, fs.stat() for ETag simulation
**Files Modified**: src/adapters/FileFeatureConfigAdapter.ts (220 lines)
**Branch**: work/dev/HAKIM-0020-feature-gate-sdk
**Blockers**: None currently

**Resume Command**: Continue implementing ETag validation in refreshConfig() method
```

### Example 2: Human Interruption Recovery
```markdown
🔄 **RESUMING AFTER INTERRUPTION** - dev.avery-kim - 2025-01-27T15:45:00Z

**Previous State**: Was implementing ETag caching (checkpoint at 14:30)
**Interruption**: Processed human input about YAML support (created issue #26)  
**Resuming**: ETag validation logic in FileFeatureConfigAdapter.refreshConfig()
**Time Lost**: 15 minutes (acceptable)
**Status**: Back on track with original task
```

## ⚠️ **Error Recovery**

### Lost Workspace Cache
```markdown
⚠️ **WORKSPACE CACHE LOST** - Recovering from issue comments
**Last Checkpoint**: Found in issue #25 comments at 14:30
**Recovery Status**: 95% context recovered from issue comment
**Missing Context**: Local file changes (will review git diff)
**Action**: Continuing from last known state
```

### Conflicting State
```markdown
🚨 **STATE CONFLICT DETECTED**
**Issue**: Multiple checkpoints found for same task
**Resolution**: Using most recent timestamp (15:45)
**Action**: Cleared conflicting older state
**Status**: Resolved and continuing
```

## 📋 **Implementation Checklist**

### For Agents Using This System
- [ ] **Save state** at all mandatory trigger points
- [ ] **Check for existing state** at startup
- [ ] **Update state comments** with meaningful progress
- [ ] **Clean up state** when tasks complete
- [ ] **Use resume commands** when returning to work

### For Project Setup
- [ ] Create `.agents/workspaces/` directory structure
- [ ] Set up automatic cleanup scripts
- [ ] Configure agent startup to check for unfinished work
- [ ] Document state comment format for the team

---

## Summary

This system ensures **no agent work is ever lost**, enables **seamless resumption** after interruptions, and provides **visible progress tracking** through GitHub issue comments combined with fast local workspace caching.

**Goal**: Transform fragile agent sessions into robust, resumable work contexts that survive any disruption.