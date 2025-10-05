# Escalation Decision Matrix (Canonical)

Purpose
Define clear boundaries between implementation autonomy and architectural escalation to prevent over-escalation while maintaining architectural integrity.

## Core Principle: **Smart Escalation**
Agents should be **autonomous implementers** within architectural boundaries, escalating only when facing **true architectural decisions** or **spec violations**.

## 🟢 **PROCEED AUTONOMOUSLY** (No Escalation Needed)

### Implementation Details
- **Variable/function/class naming**: Use descriptive names following language conventions
- **Code organization**: Organize files/folders logically within project structure  
- **Error messages**: Write clear, helpful error messages for users
- **Logging details**: Add appropriate debug/info logs beyond required structured logging
- **Test structure**: Organize unit/integration tests logically
- **Performance optimizations**: Standard optimizations (caching, algorithms) within spec constraints

### Technology Choices Within Constraints
- **Utility libraries**: Add well-established utility libs (lodash, moment) if helpful
- **Testing libraries**: Choose appropriate testing frameworks (Jest, Mocha, etc.)
- **Build tools**: Configure webpack, babel, etc. per project standards
- **Code formatting**: Prettier, ESLint configuration within project standards
- **Documentation**: Add inline comments, README sections, API docs

### Implementation Approaches
- **Algorithm choice**: Select efficient algorithms meeting performance requirements
- **Data structures**: Choose appropriate collections, data organization
- **Validation approaches**: How to implement JSON Schema validation (libraries, custom)
- **Caching implementation**: How to implement the required caching strategy
- **Error handling details**: Specific try/catch patterns, error transformation

### Examples - Proceed Autonomously
```typescript
// ✅ OK: Choosing how to implement caching
class FeatureConfigCache {
  private cache = new Map<string, CachedConfig>();
  private lru = new LRUCache({ max: 1000 }); // Agent chooses LRU library
}

// ✅ OK: Error message details
throw new FeatureGateError(
  'Feature configuration invalid', 
  { featureKey, validation: errors, correlationId }
);

// ✅ OK: Logging implementation details  
logger.info('Feature check completed', {
  featureKey, userId, enabled, duration_ms, correlationId
});
```

## 🟡 **RESEARCH FIRST, THEN DECIDE** (Try Before Escalating)

### Spec Interpretation Questions
- **Research approach**: Check spec examples, ADRs, similar patterns in codebase
- **Documentation**: Look for clarification in linked docs, schemas, comments
- **Testing**: Write failing test to understand expected behavior
- **Prototyping**: Build small proof-of-concept to validate understanding

### When Research Resolves It
- Continue with implementation
- Document decision in code comments
- Add test cases covering the interpretation

### When Research Doesn't Resolve It
- Escalate with research findings and specific question
- Show what you tried and why it's still unclear

## 🔴 **MANDATORY ESCALATION** (Stop and Ask Architect)

### Architectural Violations
- **Interface changes**: Modifying port signatures, adding/removing methods
- **Pattern deviations**: Not following ports/adapters, adding inline SQL
- **Dependency additions**: Major framework additions, external service integrations
- **Performance violations**: Cannot meet spec requirements (<50ms p95)
- **Security concerns**: Data handling, authentication, authorization questions

### Spec Conflicts or Gaps
- **Contradictory requirements**: Spec says X in one place, Y in another
- **Missing critical details**: Core functionality not specified (what happens when...)
- **Impossible requirements**: Technical constraints make spec implementation impossible
- **Integration conflicts**: Spec conflicts with existing system architecture

### Business Logic Ambiguities
- **User group rule interpretation**: Complex edge cases in group membership
- **Feature rollout behavior**: Unclear percentage rollout edge cases  
- **Data model questions**: How to handle missing fields, validation edge cases
- **Error scenarios**: What to do in unspecified error conditions

### Examples - Must Escalate
```typescript
// ❌ ESCALATE: Interface change
interface FeatureGate {
  isEnabled(featureKey: string, userId?: string, context?: FeatureContext): Promise<boolean>;
  // Adding this method requires architect approval
  isEnabledSync(featureKey: string): boolean; 
}

// ❌ ESCALATE: Performance impossible
// "Spec requires <50ms but network calls take 200ms minimum"

// ❌ ESCALATE: Spec contradiction  
// "Spec says cache TTL is 5 minutes in section 4, but 10 minutes in section 6"
```

## 📋 **Escalation Quality Standards**

### Good Escalation Format
```
🚨 **ARCHITECTURAL ESCALATION**

**Issue**: [Specific problem - be precise]
**Context**: [What you were implementing when you hit this]
**Spec Reference**: [Exact section/line that's unclear]
**Research Done**: [What you tried to resolve it]
**Proposed Options**: [2-3 alternatives you considered]
**Impact**: [How this affects timeline/other features]
**Question**: [Specific decision needed from architect]
```

### Bad Escalation Examples
- ❌ "How should I name this variable?"
- ❌ "Should I use forEach or map?"  
- ❌ "What testing library should I use?"
- ❌ "Is this error message OK?"

### Good Escalation Examples
- ✅ "Spec requires <50ms p95 but external API takes 200ms minimum - need architectural guidance on caching strategy"
- ✅ "Section 4.2 says cache TTL is 5min but Section 6.1 says 10min - which is correct?"
- ✅ "FeatureGate.isEnabled() spec doesn't specify behavior when userId exists but user groups are empty - should it default to global rules?"

## 🎯 **Decision Criteria Summary**

**ASK YOURSELF**:
1. **Does this change the architect's design?** → Escalate
2. **Does this conflict with the spec?** → Escalate  
3. **Is this just how to implement the design?** → Proceed
4. **Could another developer make this same choice?** → Proceed
5. **Does this affect other system components?** → Escalate
6. **Is this a standard implementation detail?** → Proceed

**GOLDEN RULE**: 
If you're unsure whether to escalate, spend **15 minutes researching** first. If still unclear, escalate with your research findings.

## 🔄 **Feedback Loop**

### Architect Response Guidelines
- **Acknowledge autonomy**: "Good question, but you can decide this yourself because..."
- **Provide boundaries**: "You can choose any approach as long as it meets X, Y, Z requirements"
- **Clarify spec**: "Here's what I meant by that section..."
- **Redirect to research**: "Check ADR-003 for the pattern, then proceed"

### Learning Over Time
- Agents learn from escalation responses
- Architect provides general guidance to reduce future escalations
- Build institutional knowledge in ADRs and examples

---

**GOAL**: Agents work **confidently and autonomously** on implementation details while **protecting architectural integrity** through smart escalation of true architectural decisions.