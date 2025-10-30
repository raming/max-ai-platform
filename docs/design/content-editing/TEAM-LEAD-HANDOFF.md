# DEV-UI-08 Content Editing Integration — Team Lead Handoff

**Date**: Oct 30, 2025  
**From**: Architect (architect.morgan-lee)  
**To**: Team Lead (team_lead.casey-brooks)  
**Status**: ✅ Architecture Approved & Ready for Task Breakdown  
**Related Issue**: DEV-UI-08  

---

## 🎯 Handoff Summary

**Architectural specification for Content Editing Integration is complete and ready for team implementation planning.**

### What's Been Delivered

| Deliverable | Location | Status |
|-------------|----------|--------|
| **Specification** | `/docs/design/content-editing/DEV-UI-08-specification.md` | ✅ Complete (1,176 lines) |
| **Index/Overview** | `/docs/design/content-editing/README.md` | ✅ Complete |
| **Commit** | `4289cb20` | ✅ Committed to `work/dev/DEV-UI-08-content-editing-integration` |

### Documentation Policy Compliance ✅

**Validated Against**: `.github/prompts/Architect.prompt.md` - Documentation Best Practices

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **One-file–one-topic** | ✅ | Spec focused on DEV-UI-08 architecture only |
| **Layering** | ✅ | Separate sections for frontend, backend, data, business logic, integration |
| **Anti-bloat** | ✅ | 1,176 lines (~3-4 pages), single concern |
| **Indexes** | ✅ | README.md provides index and quick links |
| **Traceability** | ✅ | Links to Portal UI, IAM, includes issue ID (DEV-UI-08) |
| **Acceptance Criteria** | ✅ | 4 detailed user stories with AC, 16-item DoDchecklist |
| **Canonical Sources** | ✅ | JSON Schemas referenced, not copied inline |
| **File Structure** | ✅ | Located in `/docs/design/content-editing/` per policy |

**Result**: ✅ **DOCUMENTATION COMPLIANT** — Ready for QA validation and implementation

---

## 📋 Your Task: Create Development Tasks

You need to **break down the specification into 7 focused development tasks** for the Dev team.

### Task Breakdown Template

Each task should:

1. **Use the AI Story Template**:
   - Clear title: `DEV-UI-08-0X: {Component} — {Action}`
   - Type: `type:code`
   - Seat label: `seat:dev.<seat>`
   - Area labels: `area:frontend` or `area:backend` or `area:integration`

2. **Include Mandatory Sections**:
   - **Inputs/Outputs**: What does this task take and produce?
   - **Ports/Adapters**: What ports does this use/implement?
   - **Error Handling**: Specific error scenarios and responses
   - **Observability**: Debug logging, metrics, audit trail requirements
   - **Feature Flags**: Any flags needed for safe rollout?
   - **Test Plan**: Unit/integration/contract/E2E coverage targets
   - **Architectural Constraints**: Non-negotiables from spec

3. **Link to Specification**:
   - Reference `/docs/design/content-editing/DEV-UI-08-specification.md`
   - Specific section for context
   - DoDchecklist items that apply

4. **Acceptance Criteria**:
   - Directly from spec's requirements
   - Measurable (coverage %, response time, etc.)
   - No ambiguity

### 7 Tasks to Create

**Phase 1: Core Implementation** (6 days)

#### **DEV-UI-08-01: Frontend — Content Editor UI Component & State**

**Scope**: Build Quill.js editor component with client state management

**Specification Section**: [Section 4: Frontend Layer](./DEV-UI-08-specification.md#4-frontend-layer-specification)

**Key Requirements**:
- Implement `ContentEditor` component with Quill.js integration
- Implement Zustand store for client state (currentContent, isLoading, isSaving, unsavedChanges)
- Implement TanStack Query hooks (useContentQuery, useContentListQuery, useSaveContentMutation, etc.)
- Component hierarchy: header, editor, preview toggle, export modal, version sidebar
- TypeScript interfaces from spec (QuillEditorProps, QuillEditorRef, ContentDTO)
- User flows: create new, edit existing, export content
- Browser unsaved-changes warning when navigating away

**Inputs**:
- Quill.js v1.x or later
- React 18+, Next.js 14
- Zustand 4.x
- TanStack Query 5.x
- shadcn/ui components

**Outputs**:
- `/client/web/src/components/content/ContentEditor.tsx`
- `/client/web/src/components/content/PreviewPane.tsx`
- `/client/web/src/components/content/ExportModal.tsx`
- `/client/web/src/hooks/useContent.ts` (custom hook wrapping mutations)
- `/client/web/src/stores/contentStore.ts` (Zustand)

**Ports Used**:
- `IContentAPI` (not yet implemented, stub for API calls)

**Error Handling**:
- Handle network errors gracefully (retry UI, error messages)
- Validate content before sending (client-side)
- Show loading/error states in UI
- Clear errors on retry

**Observability**:
- `[DEBUG] Loaded content: ${contentId}, version: ${version}`
- `[DEBUG] User edited content: unsavedChanges: true`
- Metrics: content.editor.focus, content.editor.changes, content.export.click

**Test Plan**:
- Unit tests (95%+): Component rendering, state changes, user interactions
- Integration: None (depends on DEV-UI-08-02)
- E2E: Create/edit/export workflows in browser

**Architectural Constraints**:
- ❌ Must NOT make API calls directly (use hooks/mutations)
- ✅ Must use Zustand for client state
- ✅ Must use TanStack Query for server state
- ✅ Must show loading/error states
- ✅ Must prevent unsaved-changes loss

**Acceptance Criteria**:
- [ ] Editor renders with Quill toolbar visible
- [ ] User can type and format content (bold, italic, lists, etc.)
- [ ] Unsaved changes tracked and displayed
- [ ] Preview mode toggles between edit/view
- [ ] Export dialog appears with format options
- [ ] Sample content loads when clicked
- [ ] ≥95% component test coverage
- [ ] No TypeScript errors (strict mode)

**Estimate**: 3-4 days

---

#### **DEV-UI-08-02: Backend — REST API Endpoints & Content Service**

**Scope**: Implement 7 REST endpoints and content business logic

**Specification Section**: [Section 5: Backend Layer Specification](./DEV-UI-08-specification.md#5-backend-layer-specification)

**Key Endpoints**:
1. `POST /api/content` — Create new content
2. `GET /api/content/:id` — Get content by ID
3. `PUT /api/content/:id` — Update content (creates version)
4. `DELETE /api/content/:id` — Soft delete content
5. `GET /api/content` — List user's content (with pagination)
6. `POST /api/content/:id/export` — Export in multiple formats
7. `GET /api/content/:id/versions` — Get version history (P1)

**Specification Section**: [Section 5.1: API Endpoints](./DEV-UI-08-specification.md#51-api-endpoints)

**Inputs**:
- Node.js + Express
- PostgreSQL (schema from DEV-UI-08-03)
- JWT auth from portal IAM
- TypeScript

**Outputs**:
- `/backend/routes/content.ts` — Route handlers
- `/backend/services/content.service.ts` — Business logic
- `/backend/services/sanitizer.ts` — HTML sanitization
- `/backend/services/exporter.ts` — Multi-format export
- `/backend/repositories/content.repository.ts` — Data access

**Ports Implemented**:
- `IContentRepository` (save, load, delete, list, version management)
- `IContentService` (CRUD, validation, sanitization, export)
- `ISanitizer` (HTML sanitization)
- `IExporter` (format conversion)

**Error Handling**:
- 400: Invalid input (validation errors)
- 401: Unauthorized (missing JWT)
- 403: Forbidden (permission denied)
- 404: Not found
- 413: Payload too large (>1MB)
- 500: Server errors with correlation ID

**Observability**:
- `[DEBUG] POST /api/content: creating for userId=${userId}`
- `[DEBUG] Sanitizing HTML: length=${length}, before=${tagCount} tags`
- `[DEBUG] Exporting content: format=${format}, contentId=${id}`
- Metrics: content.create, content.update, content.delete, content.export
- Audit: Log all CRUD operations with userId, action, timestamp

**Test Plan**:
- Unit tests (95%+): Service logic, sanitization, validation, permissions
- Integration (80%+): Full CRUD workflows, permission enforcement, export formats
- Contract (100%): Endpoint schemas, error responses, parameter validation
- Security: XSS payload testing, permission bypass attempts

**Architectural Constraints**:
- ✅ Must enforce permission checks (only owner can access)
- ✅ Must use repository pattern (no direct SQL)
- ✅ Must create version on every update
- ✅ Must sanitize all HTML with DOMPurify or equivalent
- ✅ Must use soft delete (set `deleted_at`)
- ❌ No inline SQL queries
- ❌ No hardcoded error messages

**Acceptance Criteria**:
- [ ] All 7 endpoints implemented and tested
- [ ] Request/response schemas match spec exactly
- [ ] All error cases handled correctly
- [ ] Sanitization passes OWASP XSS payloads
- [ ] Version created on every update (version counter increments)
- [ ] Soft delete working (deleted_at set, content hidden from lists)
- [ ] Permission enforcement: users can only access own content
- [ ] API latency <200ms p90 (non-cached)
- [ ] ≥95% service layer coverage
- [ ] ≥80% integration test coverage
- [ ] Contract tests pass (100%)

**Estimate**: 3-4 days

---

#### **DEV-UI-08-03: Database — Schema, Migrations, Indexes**

**Scope**: Create PostgreSQL tables, relationships, migrations

**Specification Section**: [Section 5.2: Data Model](./DEV-UI-08-specification.md#52-data-model-postgresql)

**Key Tables**:
- `contents` (title, content, sanitized_content, user_id, version, deleted_at, timestamps)
- `content_versions` (content_id, version, content, change_message, created_by, created_at)

**Inputs**:
- PostgreSQL 13+
- Migration tool (e.g., Knex.js, TypeORM migrations)
- Node.js + TypeScript

**Outputs**:
- `/backend/migrations/00X_create_contents_table.ts`
- `/backend/migrations/00X_create_content_versions_table.ts`
- `/backend/seeders/sample-content.ts` (optional, for testing)

**Ports**:
- `IRepository` (persist, fetch, search operations)

**Constraints**:
- ✅ Soft delete with `deleted_at` column
- ✅ Indexes on user_id, created_at, updated_at for query performance
- ✅ Foreign keys to `users` table with ON DELETE CASCADE
- ✅ Unique constraint on (content_id, version)
- ✅ Check constraint: content length ≤ 1MB

**Acceptance Criteria**:
- [ ] Tables created with exact schema from spec
- [ ] Foreign keys and relationships correct
- [ ] Indexes created on user_id, created_at, updated_at
- [ ] Migrations are reversible (rollback works)
- [ ] Sample data can be inserted without errors
- [ ] Schema validates against spec

**Estimate**: 1 day

---

#### **DEV-UI-08-04: Testing — Integration Tests & Contract Validation**

**Scope**: Comprehensive testing of frontend-backend integration

**Specification Section**: [Section 8: Testing Strategy](./DEV-UI-08-specification.md#8-testing-strategy)

**Key Test Files**:
- `/tests/integration/content.integration.test.ts` — Full CRUD workflows
- `/tests/contract/content-api.contract.test.ts` — OpenAPI contract validation
- `/tests/contract/schemas.contract.test.ts` — JSON Schema validation

**Tests to Write**:
1. **CRUD Workflow**: Create → Read → Update → Export → Delete
2. **Versioning**: Multiple updates create versions, history retrievable
3. **Permissions**: User A cannot access User B's content
4. **Export Formats**: HTML, Markdown, JSON, text all format correctly
5. **Error Cases**: 
   - Invalid content (empty, >1MB)
   - Missing auth token
   - Non-existent content ID
   - Permission denied
6. **Contract Tests**: All endpoints match OpenAPI schemas
7. **Security**: XSS payloads sanitized

**Inputs**:
- Jest, Supertest (backend API testing)
- Playwright (E2E browser testing)
- JSON Schema validators

**Outputs**:
- Integration test suite (80%+ coverage)
- Contract test suite (100% endpoints)
- E2E smoke tests for user workflows

**Acceptance Criteria**:
- [ ] ≥80% integration test coverage
- [ ] 100% of endpoints have contract tests
- [ ] All CRUD workflows tested end-to-end
- [ ] Permission enforcement validated
- [ ] Export formats validated (content structure correct)
- [ ] XSS security tests pass (all OWASP payloads sanitized)
- [ ] E2E smoke tests pass (create, edit, export in real browser)
- [ ] All tests pass with no flakes

**Estimate**: 2 days

---

#### **DEV-UI-08-05: Security — XSS Testing, Penetration, RBAC Validation**

**Scope**: Dedicated security testing and validation

**Specification Section**: [Section 10: Risk Analysis](./DEV-UI-08-specification.md#10-risk-analysis--mitigations)

**Security Tests**:
1. **XSS Prevention**:
   - Test OWASP XSS payload vectors
   - Verify dangerous tags removed (<script>, <iframe>, event handlers)
   - Verify safe formatting preserved (<strong>, <em>, links)
   
2. **Permission Enforcement**:
   - User cannot read other users' content
   - User cannot update other users' content
   - User cannot delete other users' content
   - Admin role (if exists) properly tested

3. **Input Validation**:
   - Empty content rejected
   - Content >1MB rejected
   - Invalid content type rejected
   - Malformed JSON rejected

4. **Output Sanitization**:
   - API responses don't leak sensitive data
   - Error messages don't expose internals
   - Timestamps/IDs appropriate for client

**Inputs**:
- DOMPurify or OWASP sanitization library
- Security test payloads
- Penetration testing tools (optional)

**Outputs**:
- `/tests/security/xss-prevention.test.ts`
- `/tests/security/rbac-enforcement.test.ts`
- Security report with findings

**Acceptance Criteria**:
- [ ] 100% of XSS payloads blocked (0 bypasses)
- [ ] 100% of permission checks enforced
- [ ] No sensitive data in error responses
- [ ] Input validation comprehensive
- [ ] Security audit passed

**Estimate**: 1 day

---

**Phase 2: Documentation & Deployment** (1.5 days)

#### **DEV-UI-08-06: Documentation — API Reference, Component Docs, Setup Guide**

**Scope**: Complete documentation for developers and stakeholders

**Outputs**:
- OpenAPI spec for API (`/docs/api/content-api.openapi.yaml`)
- Component storybook/documentation
- Setup guide for development
- Deployment runbook

**Acceptance Criteria**:
- [ ] OpenAPI spec complete and validates
- [ ] All components documented with props
- [ ] Setup guide includes: install, run, test, deploy
- [ ] Deployment runbook covers: prerequisites, steps, verification

**Estimate**: 1 day

---

#### **DEV-UI-08-07: Deployment — Staging Validation, Performance Testing, Go-Live**

**Scope**: Deploy to staging, validate performance, prepare production

**Key Activities**:
- Deploy to staging environment
- Run load test: 1,000 concurrent users
- Verify API latency <200ms p90
- Run E2E smoke tests on staging
- Prepare rollback procedure
- Configure monitoring and alerts
- Final QA sign-off

**Acceptance Criteria**:
- [ ] Deployed to staging successfully
- [ ] Load test: 1,000 concurrent users, <5% error rate
- [ ] API latency <200ms p90
- [ ] E2E smoke tests pass on staging
- [ ] Monitoring and alerts configured
- [ ] Rollback procedure documented and tested
- [ ] QA sign-off obtained
- [ ] Ready for production deployment

**Estimate**: 0.5 days

---

## 📊 Summary Table

| Task ID | Title | Layer | Duration | Status |
|---------|-------|-------|----------|--------|
| DEV-UI-08-01 | Frontend UI & State | Frontend | 3-4 days | Ready |
| DEV-UI-08-02 | API Endpoints & Service | Backend | 3-4 days | Ready |
| DEV-UI-08-03 | Database Schema | Data | 1 day | Ready |
| DEV-UI-08-04 | Integration & Contract Tests | Testing | 2 days | Ready |
| DEV-UI-08-05 | Security Testing | Security | 1 day | Ready |
| DEV-UI-08-06 | Documentation | Docs | 1 day | Ready |
| DEV-UI-08-07 | Deployment & Validation | Ops | 0.5 days | Ready |
| | **TOTAL** | | **11-12 days** | **Ready** |

---

## ✅ Handoff Checklist

- ✅ Specification written and committed
- ✅ Documentation policy compliance validated
- ✅ Architecture approved (no blockers identified)
- ✅ Task breakdown template provided
- ✅ 7 tasks outlined with full detail
- ✅ Each task includes: scope, ports, error handling, observability, constraints, acceptance criteria
- ✅ Each task linked to specification sections
- ✅ Risk mitigations identified (XSS, performance, permissions)
- ✅ Testing strategy comprehensive (unit, integration, contract, security, E2E)
- ✅ NFRs specified (perf, coverage, availability)

---

## 🎬 Next Steps (Team Lead Responsibilities)

**Immediate**:
1. **Review** this handoff document
2. **Validate** specification against requirements
3. **Create** 7 GitHub issues in tracker, one per task
4. **Assign** tasks to Dev team members
5. **Estimate** actual effort (my 11-12 days is a guide)

**For Each Issue**:
1. Use AI story template
2. Copy mandatory sections from above
3. Link to specification sections
4. Add labels: `type:code`, `seat:dev.<seat>`, `area:{frontend|backend|integration}`
5. Set priority and sprint
6. Mark `status:ready` when ready for Dev pickup

**Communication**:
- Notify Dev team that tasks are ready
- Schedule kick-off meeting for questions/clarifications
- Confirm blockers resolved before Dev starts

**QA Validation** (before Dev implementation):
- QA lead reviews specification compliance
- QA validates testing strategy is comprehensive
- QA approves quality gates before Dev starts

---

## 📎 Attachments

- **Specification**: `/docs/design/content-editing/DEV-UI-08-specification.md`
- **Index**: `/docs/design/content-editing/README.md`
- **Commit**: `4289cb20` on branch `work/dev/DEV-UI-08-content-editing-integration`

---

**Questions?** Contact architect.morgan-lee for clarifications before creating issues.

**Timeline**: Ready to proceed. Awaiting Team Lead task creation.

