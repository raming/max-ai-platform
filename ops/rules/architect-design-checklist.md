# Architect Design Deliverables Checklist

## Purpose
Ensure Architect role produces complete, structured architectural designs that AI agents can implement without ambiguity. This checklist prevents the common problem of "claiming done without actually creating deliverables."

## Mandatory Pre-Work Phase

Before starting ANY design work, the Architect MUST:

### 1. Context Review
- [ ] Review all related user input files in `.copilot/user-inputs/`
- [ ] Check for existing specs/ADRs that relate to this work
- [ ] Identify dependencies on other features/components
- [ ] List all stakeholders who need to be consulted
- [ ] **Review folder structure**: Familiarize with `rules/folder-structure-best-practices.md` for canonical documentation and code organization

### 2. Scope Definition
- [ ] Create a master task list of all design deliverables needed
- [ ] Identify high-level components to design
- [ ] Break down into sub-components
- [ ] Estimate which deliverables will be multi-page (need sub-docs)
- [ ] **Plan folder structure**: Determine where each deliverable will be placed per folder structure standards

### 3. Planning Announcement
Before writing any specs, announce to user:
```
📋 ARCHITECTURE PLANNING PHASE

Scope: [brief description]
Components to design: [list]
Deliverables planned:
  - [ ] Component overview document
  - [ ] API specification
  - [ ] Data model specification
  - [ ] [other deliverables]

Starting with: [first deliverable]
```

## Design Phase Workflow

### Step 1: High-Level Component Overview
Create: `docs/architecture/components/[component-name]-overview.md`

**Must include:**
- [ ] Component purpose and responsibilities
- [ ] Context diagram showing this component and its neighbors
- [ ] High-level architecture patterns being used
- [ ] Technology stack decisions with rationale
- [ ] Links to detailed sub-component specs
- [ ] Non-functional requirements (performance, scalability, security)

### Step 2: Sub-Component Breakdown
For each major sub-component, create: `docs/architecture/components/[component-name]/[sub-component].md`

**Must include:**
- [ ] Sub-component responsibilities
- [ ] Dependencies on other sub-components
- [ ] Internal structure/architecture
- [ ] Link to API contracts (if applicable)
- [ ] Link to data model (if applicable)

### Step 3: Detailed Technical Specifications

#### Backend/API Layer Checklist
**File**: `docs/architecture/backend/[feature-name]-api.md`

- [ ] **API Endpoints Defined**
  - [ ] HTTP method, path, route parameters
  - [ ] Authentication/authorization requirements
  - [ ] Rate limiting/throttling specifications
  
- [ ] **Request Specifications**
  - [ ] Request headers required
  - [ ] Request body schema (with TypeScript/JSON Schema)
  - [ ] Query parameters with validation rules
  - [ ] Example requests

- [ ] **Response Specifications**
  - [ ] Success response schemas (200, 201, 204)
  - [ ] Error response schemas (4xx, 5xx)
  - [ ] Response headers
  - [ ] Example responses

- [ ] **DTO Definitions** (Data Transfer Objects)
  - [ ] Input DTOs with validation rules
  - [ ] Output DTOs with field descriptions
  - [ ] Transformation rules from domain models
  - [ ] File: `docs/architecture/contracts/[feature]-dtos.ts`

- [ ] **API Contracts**
  - [ ] OpenAPI/Swagger specification
  - [ ] Contract test scenarios
  - [ ] Versioning strategy
  - [ ] File: `docs/architecture/contracts/[feature]-api-contract.yaml`

#### Data Model Layer Checklist
**File**: `docs/architecture/backend/[feature-name]-data-model.md`

- [ ] **Entity Definitions**
  - [ ] All entities with fields and types
  - [ ] Primary keys and indexes
  - [ ] Constraints (unique, not null, check)
  - [ ] Default values

- [ ] **Relationships**
  - [ ] Foreign keys and referential integrity
  - [ ] One-to-many, many-to-many relationships
  - [ ] Cascade behaviors (delete, update)

- [ ] **Database Schema**
  - [ ] CREATE TABLE statements (or ORM models)
  - [ ] Migration strategy
  - [ ] Index definitions for performance
  - [ ] File: `docs/architecture/database/[feature]-schema.sql`

- [ ] **Queries**
  - [ ] Common query patterns
  - [ ] Performance considerations
  - [ ] Caching strategy

#### Business Logic Layer Checklist
**File**: `docs/architecture/backend/[feature-name]-business-logic.md`

- [ ] **Service Definitions**
  - [ ] Service interfaces/contracts
  - [ ] Method signatures with parameters
  - [ ] Return types and error handling
  - [ ] File: `docs/architecture/contracts/[feature]-service-interface.ts`

- [ ] **Business Rules**
  - [ ] Validation logic specifications
  - [ ] Business rule implementations
  - [ ] State machine diagrams (if applicable)
  - [ ] Edge case handling

- [ ] **Error Handling**
  - [ ] Error types/classes
  - [ ] Error codes and messages
  - [ ] Retry/fallback strategies
  - [ ] Logging requirements

- [ ] **Integration Points**
  - [ ] External service dependencies
  - [ ] Internal service dependencies
  - [ ] Messaging/event patterns

#### Frontend/Client Layer Checklist
**File**: `docs/architecture/frontend/[feature-name]-components.md`

- [ ] **Component Hierarchy**
  - [ ] Component tree diagram
  - [ ] Container vs presentational components
  - [ ] Shared/reusable components identified

- [ ] **Component Specifications**
  For each major component:
  - [ ] Component name and purpose
  - [ ] Props interface (TypeScript)
  - [ ] State management approach
  - [ ] File: `docs/architecture/frontend/components/[ComponentName].md`

- [ ] **Data Flow**
  - [ ] API calls from components
  - [ ] State management (Redux/Context/etc.)
  - [ ] Data transformation layer
  - [ ] Client-side DTOs

- [ ] **Client-Side DTOs**
  - [ ] Frontend data models
  - [ ] Mapping from API DTOs
  - [ ] Validation logic
  - [ ] File: `docs/architecture/frontend/[feature]-client-dtos.ts`

- [ ] **UI Interactions**
  - [ ] User workflows/scenarios
  - [ ] Form validation rules
  - [ ] Loading/error states
  - [ ] Accessibility requirements (WCAG level)

- [ ] **Routing**
  - [ ] Route definitions
  - [ ] Route guards/protection
  - [ ] Navigation patterns

#### Full-Stack Integration Checklist
**File**: `docs/architecture/integration/[feature-name]-integration.md`

- [ ] **Layer Communication**
  - [ ] UI → API integration points
  - [ ] API → Business Logic contracts
  - [ ] Business Logic → Data Layer contracts
  - [ ] Sequence diagrams for key flows

- [ ] **Data Flow Diagram**
  - [ ] End-to-end data flow from UI to database
  - [ ] Data transformation at each layer
  - [ ] Validation at each layer

- [ ] **Error Propagation**
  - [ ] How errors flow from backend to frontend
  - [ ] User-facing error messages
  - [ ] Logging and monitoring points

#### Security & Compliance Checklist
**File**: `docs/architecture/security/[feature-name]-security.md`

- [ ] **Authentication**
  - [ ] Authentication method specified (JWT, OAuth, etc.)
  - [ ] Token storage and management
  - [ ] Session management strategy
  - [ ] Password requirements (if applicable)
  - [ ] Multi-factor authentication (if required)

- [ ] **Authorization**
  - [ ] Role-based access control (RBAC) model defined
  - [ ] Permission matrix documented
  - [ ] Resource-level permissions specified
  - [ ] API endpoint access controls
  - [ ] UI component authorization rules

- [ ] **Data Encryption**
  - [ ] Data at rest encryption requirements
  - [ ] Data in transit encryption (TLS/SSL)
  - [ ] Encryption key management strategy
  - [ ] Database encryption specifications
  - [ ] File storage encryption (if applicable)

- [ ] **Data Privacy & Compliance**
  - [ ] HIPAA compliance requirements (if applicable)
  - [ ] GDPR compliance requirements (if applicable)
  - [ ] SOC2 requirements (if applicable)
  - [ ] PII (Personally Identifiable Information) handling
  - [ ] Data retention policies
  - [ ] Data anonymization/masking requirements
  - [ ] Consent management (if applicable)

- [ ] **Input Validation & Sanitization**
  - [ ] SQL injection prevention strategy
  - [ ] XSS (Cross-Site Scripting) prevention
  - [ ] CSRF (Cross-Site Request Forgery) protection
  - [ ] Input validation rules for all user inputs
  - [ ] File upload restrictions and scanning
  - [ ] API rate limiting specifications

- [ ] **Secret Management**
  - [ ] API key storage strategy
  - [ ] Credential management approach
  - [ ] Environment variable usage
  - [ ] Secret rotation policy
  - [ ] No hardcoded secrets requirement

- [ ] **Audit Logging**
  - [ ] Security event logging requirements
  - [ ] User action tracking
  - [ ] Access log specifications
  - [ ] Log retention policy
  - [ ] SIEM integration requirements (if applicable)

- [ ] **Security Headers**
  - [ ] Content Security Policy (CSP)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security
  - [ ] Other security headers

- [ ] **Vulnerability Protection**
  - [ ] Dependency scanning requirements
  - [ ] Known vulnerability mitigation
  - [ ] Security patch policy
  - [ ] Penetration testing requirements (if applicable)

## Completion Checklist

Before claiming "DONE", the Architect MUST verify:

### Folder Structure Compliance
**CRITICAL**: Follow `rules/folder-structure-best-practices.md`

**NOTE**: Applicability depends on project type:
- **New projects**: Full compliance REQUIRED
- **Existing codebases** (e.g., Airmeez): Documentation standards RECOMMENDED, code structure RESPECT EXISTING unless creating completely new module
- See "Applicability" section in folder structure guide for decision framework

- [ ] ✅ **Contracts in canonical location**: All contracts in `docs/contracts/` (NOT scattered)
  - [ ] API contracts: `docs/contracts/api/schemas/`
  - [ ] API examples: `docs/contracts/api/examples/`
  - [ ] Event contracts: `docs/contracts/events/` (if applicable)
  - [ ] Database contracts: `docs/contracts/database/` (if applicable)
  - [ ] **Exception**: Existing projects may keep current docs structure if documented in ADR

- [ ] ✅ **Architecture organized by layer**:
  - [ ] API layer: `docs/architecture/api/`
  - [ ] Backend: `docs/architecture/backend/`
  - [ ] Frontend: `docs/architecture/frontend/`
  - [ ] Database: `docs/architecture/database/`
  - [ ] Integration: `docs/architecture/integration/`
  - [ ] Security: `docs/architecture/security/`
  - [ ] Deployment: `docs/architecture/deployment/`

- [ ] ✅ **Code structure specified**: Defined folder structure for implementation
  - [ ] Frontend: Component libraries (`libs/`), features, services separation specified
  - [ ] Backend: API/Domain/Infrastructure layer separation specified
  - [ ] Clear separation of presentation/business/data layers documented
  - [ ] **For existing codebases**: Document whether new standards apply or existing structure maintained (create ADR if deviating)

- [ ] ✅ **No mixed concerns**: Each folder contains only one architectural concern
- [ ] ✅ **Documentation index updated**: `docs/README.md` links to all new documents

### Documentation Completeness
- [ ] All planned documents created and saved to repository
- [ ] No TODO or PLACEHOLDER sections remaining
- [ ] All code samples are syntactically correct
- [ ] All diagrams are complete (not just described)

### Technical Completeness  
- [ ] ✅ Component overview document exists
- [ ] ✅ All API endpoints fully specified (method, path, request, response)
- [ ] ✅ All DTOs defined with TypeScript interfaces
- [ ] ✅ API contracts written (OpenAPI/Swagger or equivalent)
- [ ] ✅ Database schema defined (CREATE statements or ORM models)
- [ ] ✅ Business logic interfaces defined
- [ ] ✅ Error handling strategy documented
- [ ] ✅ Frontend component hierarchy documented
- [ ] ✅ Component props interfaces defined (TypeScript)
- [ ] ✅ Client-side DTOs defined
- [ ] ✅ Integration patterns documented (API/DTO/Business/UI layers)
- [ ] ✅ Security requirements documented (authentication, authorization, encryption)
- [ ] ✅ Compliance requirements identified and documented (HIPAA, GDPR, etc. if applicable)
- [ ] ✅ Data privacy requirements specified (PII handling, data masking)
- [ ] ✅ Security controls defined (input validation, secret management, audit logging)

### Traceability
- [ ] All specs linked from master overview document
- [ ] All specs have index entries in docs/README.md
- [ ] All specs reference the originating issue/requirement
- [ ] ADRs created for significant decisions

### Validation Markers
- [ ] Acceptance criteria defined for each component
- [ ] Test strategy outlined (unit/integration/e2e mapping)
- [ ] NFRs (performance, security, scalability) specified
- [ ] Migration/deployment considerations documented

## Final Announcement

When all checklist items are ✅, announce:

```
✅ ARCHITECTURE DESIGN COMPLETE

Deliverables created:
📄 [list all document files created with paths]

Verification:
✅ All API endpoints specified
✅ All DTOs defined  
✅ All contracts written
✅ Database schema defined
✅ Business logic interfaces defined
✅ Frontend components specified
✅ Integration patterns documented

Ready for Team Lead review.
```

## Anti-Patterns to Avoid

❌ **DO NOT**:
- Claim work is complete without creating actual files
- Write vague "to be determined" sections
- Skip any layer of the architecture
- Create mega-documents instead of focused single-topic docs
- Forget to link specs from the overview
- Assume implementation details instead of specifying them
- Skip error handling or edge cases
- Omit TypeScript interfaces for DTOs
- Leave out validation rules

✅ **DO**:
- Create all planned documents before claiming done
- Be extremely specific in all specifications
- Include code-ready TypeScript interfaces
- Document every layer (UI/API/Business/Data)
- Think through error cases and edge conditions
- Provide complete examples
- Cross-link all related documents
- Update the docs index

## Escalation

If ANY checklist item cannot be completed:
1. **Document why** in the current issue
2. **Escalate to human** for guidance
3. **Do NOT claim design is complete**
4. **Block Team Lead** from creating implementation tasks until resolved
