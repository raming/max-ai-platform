# Development Task Template (Architect-Governed)

**Tracker ID**: HAKIM-XXXX  
**Architecture Spec**: [Link to tracker/specs/HAKIM-XXXX.md]  
**ADRs Referenced**: [List relevant ADRs]  
**Architect**: [architect.morgan-lee]  

## Story Description

[Brief description of what needs to be implemented]

## 🏗️ **ARCHITECTURAL CONSTRAINTS (MANDATORY)**

### Required Reading
- [ ] **MUST READ**: [Architecture Specification](../tracker/specs/HAKIM-XXXX.md)
- [ ] **MUST READ**: [Related ADRs] 
- [ ] **MUST UNDERSTAND**: Ports/adapters pattern requirements
- [ ] **MUST VALIDATE**: JSON Schema contracts

### Design Boundaries 
**✅ ALLOWED**:
- Implement the exact ports/adapters defined in spec
- Use the specified JSON schemas for validation
- Follow the defined error handling patterns
- Add structured logging per observability requirements

**❌ FORBIDDEN**:
- Make ANY design decisions not covered in the spec
- Change interface signatures or contracts
- Add new dependencies without architect approval
- Modify existing architectural patterns

### Escalation Requirements
**MANDATORY ESCALATION to architect.morgan-lee**:
- [ ] Spec is unclear, incomplete, or contains contradictions
- [ ] Technical constraints prevent implementing the spec as written  
- [ ] Dependency issues or integration conflicts discovered
- [ ] Performance requirements cannot be met with current design
- [ ] Security concerns with proposed implementation

**Escalation Process**:
1. STOP implementation work immediately
2. Comment on this issue with @architect.morgan-lee mention
3. Describe specific problem with context and proposed alternatives
4. Wait for architect approval before proceeding

## 📋 **Implementation Requirements**

### Inputs
```typescript
// Exact interfaces from architecture spec
[Copy relevant interfaces from spec]
```

### Outputs  
```typescript
// Expected outputs per spec
[Copy expected outputs from spec]
```

### Ports (Interfaces)
```typescript
// Ports that MUST be implemented exactly as specified
[List required ports from spec]
```

### Adapters
```typescript  
// Adapters that MUST be created
[List required adapters from spec]
```

### Error Handling
- [ ] Implement error types specified in architecture spec
- [ ] Use circuit breaker pattern where specified
- [ ] Provide graceful degradation per fallback strategy
- [ ] Include correlation IDs in all error contexts

### Observability/Audit Requirements
- [ ] Add structured logging per spec (correlation IDs, user context)
- [ ] Implement metrics collection per defined schema
- [ ] Add distributed tracing headers  
- [ ] Audit sensitive operations per compliance requirements

### Validation & Contracts
- [ ] Validate all inputs against JSON Schema [link to schema]
- [ ] Validate all outputs against JSON Schema [link to schema]  
- [ ] Implement contract tests per adapter specification
- [ ] Run JSON Schema validation in CI pipeline

## Seat routing (required)

- Next seat: <role.seat>
- Add labels in tracker: `seat:<role.seat>`, `status:ready`
- When handing off from Team Lead to Dev, replace `seat:team_lead.<seat>` with `seat:dev.<seat>` and keep `status:ready` if appropriate

## 🧪 **Testing Strategy**

### Unit Tests (≥95% Coverage)
- [ ] All ports/adapters with mocked dependencies
- [ ] Error handling and edge cases
- [ ] JSON Schema validation scenarios
- [ ] Business logic with various input combinations

### Integration Tests
- [ ] End-to-end flow per architecture spec
- [ ] Database/external service integrations
- [ ] Cache behavior and fallback mechanisms  
- [ ] Performance under specified load requirements

### Contract Tests
- [ ] All adapter I/O validated against schemas
- [ ] API contract tests for external dependencies
- [ ] Backward compatibility validation

## ✅ **Definition of Done**

### Functional Requirements
- [ ] Feature works exactly as specified in architecture doc
- [ ] All acceptance criteria met per spec
- [ ] JSON Schema validation working correctly
- [ ] Error handling behaves per specification

### Quality Gates
- [ ] Unit test coverage ≥95% for changed packages
- [ ] Integration tests pass
- [ ] Contract tests validate all I/O
- [ ] Performance requirements met per spec
- [ ] Security review if handling sensitive data

### Code Quality
- [ ] ESLint clean (0 warnings - warnings treated as errors)
- [ ] Code follows ports/adapters pattern exactly
- [ ] No inline SQL (repository adapters only)
- [ ] Structured logging with correlation IDs
- [ ] All dependencies approved and documented

### Architectural Compliance
- [ ] Implementation matches architecture specification exactly
- [ ] Ports/adapters pattern followed correctly  
- [ ] JSON contracts validated and working
- [ ] Observability requirements implemented
- [ ] No architectural deviations without architect approval

## 🚨 **Pre-Implementation Checklist**

Before writing ANY code, developer MUST:
- [ ] Read and understand complete architecture specification
- [ ] Review all referenced ADRs for context
- [ ] Understand the ports/adapters pattern requirements
- [ ] Confirm JSON Schema requirements and validation approach
- [ ] Identify any spec ambiguities and escalate to architect
- [ ] Plan implementation approach within architectural constraints

## 📝 **Implementation Notes**

[Space for developer to add implementation notes, questions, and progress updates]

### Questions for Architect
[List any questions that arise during implementation - these MUST be answered by architect before proceeding]

### Approved Deviations  
[Any architect-approved deviations from spec - must include approval comment link]

---

**⚠️ CRITICAL**: This task cannot be completed without strict adherence to the architecture specification. Any deviations, questions, or concerns MUST be escalated to the architect before proceeding. Making unauthorized design decisions will result in implementation rejection.