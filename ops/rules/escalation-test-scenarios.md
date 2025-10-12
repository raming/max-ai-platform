# Escalation Test Scenarios

Purpose
Validate that the balanced escalation rules allow appropriate autonomy while protecting architectural integrity.

## ✅ **Good Autonomous Decisions** (Should NOT escalate)

### Scenario 1: Developer implementing FeatureGate caching
**Context**: Implementing the caching layer specified in PROJ-0020
**Decision**: Choose between Map vs LRU Cache vs Redis adapter
**Expected**: Proceed autonomously - this is implementation detail within constraints
```typescript
// ✅ Agent should choose independently
class FeatureConfigCache {
  private cache = new LRUCache<string, CachedConfig>({ max: 1000 });
  // or private cache = new Map<string, CachedConfig>();
  // or private redisClient = new Redis(config);
}
```

### Scenario 2: QA testing feature gate error messages
**Context**: Testing error handling per spec
**Issue Found**: Error messages are generic "Invalid configuration"
**Expected**: QA can provide feedback on error message quality without escalating
**Reasoning**: Error message content is implementation detail, not architectural

### Scenario 3: Developer organizing test files
**Context**: Writing unit tests for feature gate adapters
**Decision**: Structure tests by adapter vs by functionality vs by use case
**Expected**: Proceed autonomously - test organization is implementation detail
```
tests/
  adapters/
    file-adapter.test.ts
    http-adapter.test.ts
  # vs
tests/
  feature-gate/
    caching.test.ts
    validation.test.ts
```

## ⚠️ **Research First Scenarios** (Try 15min, then maybe escalate)

### Scenario 4: Developer unclear on user group rules
**Context**: Implementing GroupOverridesProvider.getUserGroups()
**Question**: "When user matches multiple rules, which takes precedence?"
**Expected**: 
1. Check spec examples and ADRs (15min research)
2. If still unclear, escalate with research findings
3. If examples clarify it, proceed autonomously

### Scenario 5: QA testing percentage rollout edge cases
**Context**: Testing 15% rollout for feature gate
**Question**: "What happens with userId hash collision edge case?"
**Expected**:
1. Check spec for percentage rollout algorithm
2. Look for test cases or examples in codebase
3. If unclear, escalate with specific edge case question

## 🚨 **Mandatory Escalation** (Must ask architect)

### Scenario 6: Developer hits performance constraint
**Context**: Implementing file-based adapter per spec
**Issue**: "File reads take 150ms but spec requires <50ms p95"
**Expected**: ESCALATE - Cannot meet architectural requirement
**Good escalation**: Shows performance measurements, proposes alternatives

### Scenario 7: QA finds spec contradiction
**Context**: Testing cache TTL behavior
**Issue**: "Section 4.2 says 5min TTL, Section 6.1 says 10min TTL"
**Expected**: ESCALATE - Spec conflict needs architect clarification
**Good escalation**: Shows exact sections, impact on testing

### Scenario 8: Developer wants to change interface
**Context**: Implementing FeatureGate.isEnabled()
**Request**: "Can I add isEnabledSync() method for better performance?"
**Expected**: ESCALATE - Interface changes are architectural decisions
**Good escalation**: Shows performance issue, proposes specific solution

### Scenario 9: Developer needs major dependency
**Context**: Implementing HTTP adapter for Phase 2
**Request**: "Need to add Apollo GraphQL client for feature config API"
**Expected**: ESCALATE - Major framework additions are architectural
**Good escalation**: Shows why existing HTTP client insufficient

## 📊 **Success Metrics for Balanced Rules**

### Autonomous Work Indicators (Good)
- Developer makes 20+ autonomous decisions per day
- QA provides implementation feedback without escalating
- Code reviews discuss implementation approaches, not architectural permissions
- Most questions resolved through research and documentation

### Smart Escalation Indicators (Good)  
- Escalations are specific, well-researched, architectural in nature
- Architect responses provide lasting guidance (not one-off answers)
- Escalation volume decreases over time as agents learn boundaries
- Zero unauthorized architectural changes slip through

### Over-Escalation Warning Signs (Bad)
- Developer escalates variable naming, file organization
- QA escalates test assertion wording, documentation typos
- Architect spends >50% time answering implementation questions
- Development velocity slows due to excessive escalation delays

### Under-Escalation Warning Signs (Bad)
- Interface changes made without architect approval
- Performance requirements ignored or modified
- New dependencies added without architectural review
- Patterns deviate from ports/adapters without discussion

## 🎯 **Validation Checklist**

After applying balanced rules, verify:
- [ ] Developers work confidently on implementation details
- [ ] QA focuses on architectural compliance, not cosmetic issues  
- [ ] Escalations are thoughtful and well-researched
- [ ] Architect time spent on true architectural decisions
- [ ] Development velocity maintained while protecting integrity
- [ ] Agents learn over time and require fewer escalations

## 📝 **Feedback Refinement**

As agents use these rules, collect feedback on:
- Which scenarios cause confusion about escalation decisions
- Examples of good/bad escalations to add to documentation
- Boundary cases that need clearer guidance
- Ways to improve autonomous decision-making within constraints

**Goal**: Agents are confident, productive implementers who escalate thoughtfully when facing true architectural decisions.