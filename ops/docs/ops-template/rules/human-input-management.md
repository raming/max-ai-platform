# Human Input Management & Triage (Canonical)

Purpose
Define systematic approach for capturing, evaluating, and processing human inputs during agent work to prevent lost requirements and maintain task continuity.

## Core Problem
**Human inputs often get lost in conversation**, disrupting agent focus without proper capture and triage into formal requirements or tasks.

## 🔄 **Human Input Workflow**

### Step 1: Capture & Acknowledge (Immediate)
When human provides input during agent work:

```
🎯 **HUMAN INPUT RECEIVED**

**Current Context**: [What agent was working on]
**Input Summary**: [Brief summary of human input] 
**Input Type**: [See classification below]
**Capture Status**: ✅ Documented for triage

**Next Steps**: 
- Continue current task unless instructed to switch
- Human input queued for formal triage
- Will process input per triage decision matrix
```

### Step 2: Input Classification (Within 5 minutes)

**🟢 QUICK CLARIFICATION** (Handle immediately)
- Simple yes/no questions about current work
- Minor spec clarifications 
- Implementation preference ("should I use X or Y library?")
- **Action**: Answer and continue current task

**🟡 TASK-WORTHY INPUT** (Create issue, continue current task)
- New feature requests
- Bug reports 
- Enhancement suggestions
- Process improvements
- **Action**: Create GitHub issue, assign to appropriate role, continue current task

**🔴 REQUIREMENT-WORTHY INPUT** (Document formally, may switch tasks)
- Major architectural decisions
- Business requirement changes
- Compliance/security requirements  
- Large feature additions/changes
- Strategic direction changes
- **Action**: Create formal requirement document, may reassign agent focus

### Step 3: Triage Decision Matrix

| Input Scope | Complexity | Impact | Action | Urgency |
|-------------|------------|--------|--------|---------|
| Single feature | Simple | Low-Medium | Create Issue | Normal |
| Multiple features | Medium | Medium-High | Create Requirement Doc | High |
| Cross-domain | Complex | High | Create Requirement Doc + ADR | Immediate |
| Strategic | Complex | Critical | Create Requirement Doc + Escalate | Immediate |

## 📋 **Input Processing Templates**

### Quick Task Creation Template
```markdown
# [INPUT-TYPE] — [Brief Description]

**Source**: Human input from [context/conversation]
**Date**: [timestamp]
**Priority**: [Low/Medium/High based on impact]

## Original Input
> [Exact quote or paraphrase of human input]

## Interpretation
[Agent's understanding of what's being requested]

## Scope
- [ ] [Specific deliverable 1]
- [ ] [Specific deliverable 2]

## Acceptance Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

**Estimated Effort**: [S/M/L/XL]
**Dependencies**: [List any dependencies]
**Assigned Role**: [architect/dev/qa/etc.]
```

### Formal Requirement Document Template
```markdown
# REQ-[YYYYMMDD]-[NN] — [Requirement Title]

**Source**: Human input from [context]
**Date**: [timestamp]
**Type**: [Feature/Change/Compliance/Strategic]
**Impact**: [Single Domain/Cross-Domain/System-Wide]

## Business Context
### Problem Statement
[What business problem does this solve?]

### Success Criteria  
[How will we measure success?]

### Stakeholder Impact
[Who is affected and how?]

## Technical Requirements

### Functional Requirements
1. [Specific functionality needed]
2. [User interactions required]
3. [Data processing needs]

### Non-Functional Requirements
- **Performance**: [Response time, throughput requirements]
- **Security**: [Authentication, authorization, data protection]
- **Compliance**: [Regulatory requirements]
- **Scalability**: [Growth expectations]

### Integration Requirements
[How this interacts with existing systems]

## Implementation Considerations

### Architecture Impact
[Changes to existing architecture]

### Data Impact  
[New data models, migrations needed]

### UI/UX Impact
[User interface changes]

### Testing Impact
[Testing strategy requirements]

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | [H/M/L] | [H/M/L] | [How to mitigate] |

## Dependencies & Constraints
- **Technical Dependencies**: [Other systems, infrastructure]
- **Resource Constraints**: [Team availability, budget]
- **Timeline Constraints**: [Business deadlines]

## Implementation Plan
### Phase 1: [Foundation]
- [ ] [Specific deliverable]
- [ ] [Specific deliverable]

### Phase 2: [Core Features]  
- [ ] [Specific deliverable]
- [ ] [Specific deliverable]

### Phase 3: [Integration & Polish]
- [ ] [Specific deliverable]
- [ ] [Specific deliverable]

## Approval & Handoff
- [ ] Architect review and approval
- [ ] Team Lead assignment and planning
- [ ] Developer task breakdown
- [ ] QA test planning

**Approval Date**: [When approved]
**Next Actions**: [What happens next]
```

## 🚦 **Agent Behavior Rules**

### During Human Input Processing

**✅ DO**:
- Acknowledge input immediately with capture confirmation
- Continue current task unless explicitly told to switch
- Create formal documentation for complex inputs
- Ask clarifying questions if input is ambiguous
- Provide estimated timeline for processing the input

**❌ DON'T**:
- Drop current work without proper handoff
- Let input disappear into conversation
- Make assumptions about input priority
- Implement changes without formal requirements
- Context switch without documenting current state

### Multi-Agent Coordination

**When Input Affects Multiple Agents**:
1. **Capturing Agent**: Documents input and creates central issue
2. **Affected Agents**: Tagged in the issue for awareness
3. **Architect**: Reviews cross-cutting concerns
4. **Team Lead**: Coordinates any work reassignment

**Communication Pattern**:
```
🔄 **CROSS-AGENT INPUT COORDINATION**

**Input**: [Summary of human input]
**Affected Agents**: @dev.avery-kim @qa.mina-li @architect.morgan-lee
**Coordination Needed**: [What needs to be coordinated]
**Next Steps**: [Who does what next]
```

## 📊 **Input Tracking & Metrics**

### Input Categories to Track
- **Volume**: Number of inputs per day/week
- **Type Distribution**: Quick/Task/Requirement breakdown  
- **Response Time**: Time from input to formal documentation
- **Implementation Rate**: % of inputs that become actual features
- **Lost Input Recovery**: Inputs rescued from conversations

### Success Metrics
- **Zero Lost Inputs**: All significant inputs captured and tracked
- **Quick Triage**: <5 minutes from input to classification
- **Formal Documentation**: <1 hour for requirement-worthy inputs
- **Agent Focus**: <10% disruption to current task completion

### Warning Signs
- **Repeated Similar Inputs**: May indicate missing process/documentation
- **Long Triage Times**: System not being followed consistently  
- **Agent Task Switching**: Too much context switching from inputs

## 🔄 **Integration with Existing Workflow**

### With Escalation Matrix
- Use existing escalation rules for complex inputs
- Architect approval required for requirement docs
- Team Lead coordinates multi-agent input processing

### With Task Completion
- Complete current task before processing non-urgent inputs
- Document handoff if switching to urgent input processing
- Resume previous task with proper context restoration

### With Quality Gates
- Requirement docs must meet same quality standards as specs
- Input-generated tasks follow same development workflow
- All inputs traced through to completion or closure

## 📝 **Common Input Scenarios**

### Scenario 1: Feature Enhancement During Development
**Human**: "Can we also add a notification when the user saves?"
**Agent Response**: 
```
🎯 **INPUT CAPTURED**: Notification enhancement request
**Current Task**: Continuing user save functionality implementation
**Action**: Created issue #123 for notification enhancement
**Timeline**: Will implement after current task complete
```

### Scenario 2: Major Requirement Change
**Human**: "We need to support multiple languages for the European market"
**Agent Response**:
```
🔴 **MAJOR REQUIREMENT DETECTED**: Multi-language support
**Current Task**: Pausing current work for formal documentation
**Action**: Creating REQ-20250127-01 requirement document
**Estimate**: 2-4 hours for full requirements analysis
**Next**: Will present formal requirements for architect approval
```

### Scenario 3: Cross-Domain Input
**Human**: "The inventory changes should also update the reporting dashboard"
**Agent Response**:
```
🔄 **CROSS-DOMAIN INPUT**: Inventory-Reporting integration
**Affected Systems**: Inventory service, Reporting dashboard, Data pipeline
**Action**: Creating integration requirement doc + notifying affected agents
**Coordination**: @architect.morgan-lee @dev.inventory @dev.reporting
```

---

## Summary
This system ensures **no human input is lost**, maintains **agent task continuity**, and provides **proper escalation** of significant requirements while enabling **quick handling** of simple requests.

**Goal**: Transform ad-hoc human inputs into systematic requirements capture and task management.