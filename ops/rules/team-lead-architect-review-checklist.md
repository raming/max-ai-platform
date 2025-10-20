# Team Lead Review Checklist for Architect Deliverables

## Purpose
Ensure Team Lead validates all Architect deliverables meet standards before creating implementation tasks. This prevents incomplete or vague specifications from reaching developers.

## Review Workflow

When Architect claims design is complete, Team Lead MUST:

### Phase 1: Document Discovery
- [ ] List all documents the Architect claims to have created
- [ ] Verify each document actually exists in the repository
- [ ] Check that no placeholder files or stubs remain

### Phase 2: Structural Review

#### Documentation Standards Compliance
- [ ] Each document follows one-file-one-topic principle
- [ ] No mega-documents (each doc under 3-5 pages)
- [ ] Proper cross-linking between related documents
- [ ] All documents indexed in docs/README.md or equivalent
- [ ] File naming follows conventions
- [ ] No orphaned or unreferenced documents

#### Completeness Check
- [ ] Component overview document exists and is complete
- [ ] All sub-components have detailed specs
- [ ] Master overview links to all detailed specs
- [ ] Table of contents accurate and complete

### Phase 3: Technical Depth Review

Review each architectural layer against the Architect Design Checklist:

#### API Layer Verification
**File**: `docs/architecture/backend/[feature-name]-api.md`

- [ ] ✅ All API endpoints specified with:
  - [ ] HTTP method and path clearly defined
  - [ ] Authentication requirements specified
  - [ ] Rate limiting mentioned
  
- [ ] ✅ Request specifications complete:
  - [ ] Request headers documented
  - [ ] Request body schema provided (TypeScript or JSON Schema)
  - [ ] Query parameters with validation rules
  - [ ] Actual example requests included

- [ ] ✅ Response specifications complete:
  - [ ] Success responses (200, 201, etc.) with schemas
  - [ ] Error responses (4xx, 5xx) with schemas
  - [ ] Example responses provided

- [ ] ✅ DTOs fully defined:
  - [ ] Separate file for DTOs exists
  - [ ] TypeScript interfaces provided (not just prose)
  - [ ] Validation rules specified
  - [ ] Transformation logic documented

- [ ] ✅ API contracts exist:
  - [ ] OpenAPI/Swagger file or equivalent
  - [ ] Contract test scenarios outlined
  - [ ] Versioning strategy defined

**If ANY item is ❌**: Request Architect to complete before proceeding.

#### Data Model Layer Verification
**File**: `docs/architecture/backend/[feature-name]-data-model.md`

- [ ] ✅ Entity definitions complete:
  - [ ] All fields listed with types
  - [ ] Primary keys identified
  - [ ] Indexes defined
  - [ ] Constraints specified

- [ ] ✅ Relationships documented:
  - [ ] Foreign keys defined
  - [ ] Cardinality specified (one-to-many, etc.)
  - [ ] Cascade behaviors documented

- [ ] ✅ Schema provided:
  - [ ] Actual SQL CREATE statements OR
  - [ ] Complete ORM model definitions
  - [ ] Migration strategy outlined

**If ANY item is ❌**: Request Architect to complete before proceeding.

#### Business Logic Layer Verification
**File**: `docs/architecture/backend/[feature-name]-business-logic.md`

- [ ] ✅ Service interfaces defined:
  - [ ] TypeScript interface file exists
  - [ ] All method signatures specified
  - [ ] Parameter types and return types documented
  - [ ] Error cases specified

- [ ] ✅ Business rules documented:
  - [ ] Validation logic clearly specified
  - [ ] State transitions documented (if applicable)
  - [ ] Edge cases identified and handled

- [ ] ✅ Error handling specified:
  - [ ] Error types defined
  - [ ] Error messages/codes listed
  - [ ] Retry/fallback strategies outlined

**If ANY item is ❌**: Request Architect to complete before proceeding.

#### Frontend Layer Verification
**File**: `docs/architecture/frontend/[feature-name]-components.md`

- [ ] ✅ Component hierarchy documented:
  - [ ] Component tree diagram provided
  - [ ] Container vs presentational components identified
  - [ ] Reusable components identified

- [ ] ✅ Component specs exist:
  - [ ] Props interfaces defined (TypeScript)
  - [ ] State management approach specified
  - [ ] Individual component spec files for major components

- [ ] ✅ Data flow documented:
  - [ ] API integration points specified
  - [ ] State management pattern defined
  - [ ] Client-side DTOs defined

- [ ] ✅ UI interactions specified:
  - [ ] User workflows documented
  - [ ] Form validation rules specified
  - [ ] Loading/error states defined
  - [ ] Accessibility requirements (WCAG level)

**If ANY item is ❌**: Request Architect to complete before proceeding.

#### Integration Layer Verification
**File**: `docs/architecture/integration/[feature-name]-integration.md`

- [ ] ✅ Layer communication documented:
  - [ ] UI → API contracts specified
  - [ ] API → Business Logic contracts specified  
  - [ ] Business Logic → Data Layer contracts specified
  - [ ] Sequence diagrams for key flows

- [ ] ✅ End-to-end data flow:
  - [ ] Complete flow from UI to database documented
  - [ ] Data transformations at each layer specified
  - [ ] Validation at each layer documented

- [ ] ✅ Error propagation:
  - [ ] Error flow from backend to frontend
  - [ ] User-facing error messages defined
  - [ ] Logging/monitoring points specified

**If ANY item is ❌**: Request Architect to complete before proceeding.

### Phase 4: Quality Assessment

#### AI Agent Readability Test
Ask yourself: "Could a developer agent implement this without asking clarifying questions?"

- [ ] All TypeScript interfaces are syntactically correct
- [ ] No "TBD" or "TODO" sections remain
- [ ] All referenced external documents exist
- [ ] Examples are complete and realistic
- [ ] Edge cases are addressed
- [ ] Error scenarios are specified

#### Acceptance Criteria Validation
- [ ] Each component has measurable acceptance criteria
- [ ] Acceptance criteria map to test scenarios
- [ ] Success criteria are unambiguous
- [ ] Failure scenarios are defined

#### Non-Functional Requirements Check
- [ ] Performance requirements specified (latency, throughput)
- [ ] Scalability considerations documented
- [ ] Security requirements defined
- [ ] Monitoring/observability approach outlined

### Phase 5: Traceability Verification
- [ ] All specs reference the originating user requirement/issue
- [ ] ADRs exist for all significant architectural decisions
- [ ] Specs link to each other appropriately
- [ ] Master overview provides complete navigation

## Review Outcomes

### ✅ APPROVED - All Criteria Met
```
✅ ARCHITECT DELIVERABLES APPROVED

Reviewed documents:
📄 [list all reviewed documents]

Verification complete:
✅ All API endpoints fully specified
✅ All DTOs defined with TypeScript interfaces
✅ Database schema provided
✅ Business logic interfaces defined
✅ Frontend components specified
✅ Integration patterns documented
✅ Acceptance criteria defined
✅ No TODOs or placeholders remaining

Proceeding to create implementation tasks.
```

### ❌ REJECTED - Missing Items
```
❌ ARCHITECT DELIVERABLES INCOMPLETE

Missing or incomplete items:
❌ [specific checklist item]
❌ [specific checklist item]

Required actions:
1. [specific file/section to create/complete]
2. [specific file/section to create/complete]

@Architect: Please complete the above items before task creation can proceed.

Status: BLOCKED until deliverables complete
```

### ⚠️ PARTIALLY APPROVED - Proceed with Caution
Only use if human stakeholder explicitly approves proceeding with incomplete specs.

```
⚠️ ARCHITECT DELIVERABLES PARTIALLY APPROVED

Complete items: ✅ [list]
Incomplete items: ⚠️ [list]

Stakeholder approval: @[human] approved proceeding with noted gaps
Risks documented: [link to risk discussion]

Proceeding with implementation tasks, with architect consultation required for incomplete areas.
```

## Task Creation Guidelines

### Only After Approval
- **DO NOT create implementation tasks until Architect deliverables are approved**
- Each task must reference specific architectural documents
- Include links to relevant specs, DTOs, and contracts in task descriptions

### Task Structure
Each implementation task MUST include:
- [ ] Link to relevant architectural specification
- [ ] Link to API contract (if applicable)
- [ ] Link to DTO definitions
- [ ] Link to data model spec
- [ ] Specific acceptance criteria from spec
- [ ] Testing requirements (unit/integration/contract/e2e)
- [ ] Definition of Done checklist

### Task Decomposition
Break work along architectural boundaries:
- API endpoint implementation
- DTO and validation implementation
- Business logic service implementation
- Data layer repository implementation
- Frontend component implementation
- Integration and contract testing

Each task should be small enough to complete in 1-2 sessions but large enough to be independently testable.

## Escalation Path

### When to Escalate to Architect
- Missing specifications for any layer
- Ambiguous or incomplete DTOs
- Vague error handling
- No database schema
- Incomplete API contracts
- Missing TypeScript interfaces

### When to Escalate to Human
- Architect repeatedly delivers incomplete specs
- Fundamental architectural disagreement
- Specs violate project standards
- Scope significantly larger than estimated
- Critical NFRs missing

## Anti-Patterns to Reject

❌ **REJECT if Architect**:
- Claims work is done without files
- Provides only high-level descriptions
- Skips any architectural layer
- Omits TypeScript interfaces
- Doesn't define error handling
- Skips data model specification
- Provides incomplete API contracts
- Doesn't address edge cases

✅ **APPROVE if Architect**:
- Creates all promised files
- Provides code-ready TypeScript interfaces
- Documents all layers (UI/API/Business/Data)
- Specifies error cases thoroughly
- Includes complete examples
- Cross-links all documents
- Defines clear acceptance criteria
- Addresses NFRs and edge cases

## Review Checklist Summary

Before approving Architect deliverables, confirm:

1. **✅ All promised documents exist** (not stubs)
2. **✅ API layer complete** (endpoints, DTOs, contracts)
3. **✅ Data layer complete** (schema, entities, relationships)
4. **✅ Business logic complete** (interfaces, rules, errors)
5. **✅ Frontend layer complete** (components, props, data flow)
6. **✅ Integration documented** (layer communication, data flow)
7. **✅ Quality assured** (no TODOs, complete examples, AI-readable)
8. **✅ Acceptance criteria defined** (measurable, testable)
9. **✅ NFRs specified** (performance, security, scalability)
10. **✅ Traceability maintained** (links, references, ADRs)

**All 10 items must be ✅ before creating implementation tasks.**
