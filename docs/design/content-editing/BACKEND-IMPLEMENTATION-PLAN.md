# DEV-UI-08-02: Backend REST API Implementation Plan

**Issue**: #159  
**Status**: READY TO START  
**Date**: Oct 31, 2025  
**Estimated Duration**: 3-4 days  
**Dependencies**: ✅ DEV-UI-08-03 (Database schema complete)

---

## Execution Strategy

### Phase 1: Foundation (2-3 hours)
1. Create repository pattern interface and implementation
2. Create service layer interfaces and base classes
3. Create validation schemas (Zod)
4. Create adapter ports (sanitizer, exporter)

### Phase 2: Core Implementation (6-8 hours)
1. Implement ContentService with CRUD logic
2. Implement ContentRepository with database access
3. Implement HTML sanitizer adapter
4. Implement multi-format exporter adapter

### Phase 3: API Endpoints (4-6 hours)
1. POST /api/content (create)
2. GET /api/content/:id (get by ID)
3. PUT /api/content/:id (update with versioning)
4. DELETE /api/content/:id (soft delete)
5. GET /api/content (list with pagination)
6. POST /api/content/:id/export (multi-format export)
7. GET /api/content/:id/versions (version history)

### Phase 4: Testing (6-8 hours)
1. Unit tests for service layer (95%+ coverage)
2. Integration tests for repository and endpoints
3. Contract tests for request/response validation
4. Security tests for OWASP XSS payloads

### Phase 5: Polish & Documentation (2-3 hours)
1. Error handling and edge cases
2. Observability (logging, metrics, audit trail)
3. API documentation
4. Code quality review

---

## Architecture

### Ports & Adapters Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Layer                           │
│  (Express/Fastify routes, middleware, error handling)  │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│              Request Validation Layer                   │
│  (Zod schemas, authorization middleware)               │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer (Service)             │
│  IContentService:                                       │
│  - createContent()      - listContent()                 │
│  - getContent()         - exportContent()               │
│  - updateContent()      - getVersions()                 │
│  - deleteContent()                                      │
└─────────────────────────────────────────────────────────┘
        ▲                 ▲                       ▲
        │                 │                       │
   Sanitizer         Repository             Exporter
   (ISanitizer)  (IContentRepository)  (IExporter)
        │                 │                       │
        ▼                 ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  DOMPurify   │  │  PostgreSQL DB   │  │Format Conv.  │
│  Adapter     │  │  Adapter         │  │ Adapter      │
└──────────────┘  └──────────────────┘  └──────────────┘
```

### File Structure

```
client/api/src/
├── database/
│   └── migrations/
│       └── 001_create_content_tables.sql ✅ (done)
├── types/
│   └── content.ts ✅ (done - DTOs, schemas)
├── content/
│   ├── entities/
│   │   └── content.entity.ts (mappers)
│   ├── ports/
│   │   ├── content.repository.interface.ts
│   │   ├── content.service.interface.ts
│   │   ├── sanitizer.interface.ts
│   │   └── exporter.interface.ts
│   ├── validators/
│   │   └── content.validator.ts
│   ├── services/
│   │   ├── content.service.ts
│   │   ├── sanitizer.adapter.ts
│   │   └── exporter.adapter.ts
│   ├── repositories/
│   │   └── postgres.content.repository.ts
│   └── routes/
│       └── content.routes.ts
├── middleware/
│   ├── auth.middleware.ts (JWT verification)
│   ├── error-handler.middleware.ts
│   └── request-logger.middleware.ts
└── schemas/
    └── content.schemas.ts (Zod validation)
```

---

## Detailed Implementation Checklist

### ✅ DONE (Foundation)
- [x] TypeScript types and DTOs (`client/api/src/types/content.ts`)
- [x] Database schema and migrations
- [x] Schema constraints exported as constants

### 📋 TODO (Phase 1: Foundation Layers)
- [ ] Create ports/interfaces:
  - [ ] `IContentRepository` interface
  - [ ] `IContentService` interface
  - [ ] `ISanitizer` interface
  - [ ] `IExporter` interface
- [ ] Create Zod validation schemas
- [ ] Create entity mappers (Row → DTO)

### 📋 TODO (Phase 2: Core Adapters)
- [ ] Implement `PostgresContentRepository`
- [ ] Implement `ContentService`
- [ ] Implement `DOMPurifyAdapter` (sanitizer)
- [ ] Implement multi-format `Exporter` adapter

### 📋 TODO (Phase 3: REST Endpoints)
- [ ] POST /api/content (create)
- [ ] GET /api/content/:id (retrieve)
- [ ] PUT /api/content/:id (update with versioning)
- [ ] DELETE /api/content/:id (soft delete)
- [ ] GET /api/content (list with pagination)
- [ ] POST /api/content/:id/export (export)
- [ ] GET /api/content/:id/versions (history)

### 📋 TODO (Phase 4: Testing)
- [ ] Service layer tests (95%+ coverage)
- [ ] Repository tests (database access)
- [ ] Endpoint integration tests
- [ ] Contract tests (schemas)
- [ ] Security tests (XSS payloads)

### 📋 TODO (Phase 5: Polish)
- [ ] Error handling edge cases
- [ ] Logging and observability
- [ ] Metrics collection
- [ ] API documentation
- [ ] Code review preparation

---

## Key Technical Decisions

### 1. Repository Pattern
- **Why**: Abstraction over database; enables testing with mocks
- **Implementation**: Single `PostgresContentRepository` implementing `IContentRepository`
- **Methods**: save, load, delete, list, getVersions, paginatedList

### 2. Service Layer
- **Why**: Business logic isolated from HTTP and DB layers
- **Responsibilities**:
  - Permission checks (RBAC)
  - Content sanitization
  - Version management on updates
  - Soft delete enforcement

### 3. Adapter Pattern (for Sanitizer & Exporter)
- **Why**: Swappable implementations (e.g., different HTML sanitizers)
- **Ports**:
  - `ISanitizer`: sanitize(html) → string
  - `IExporter`: export(content, format) → Buffer

### 4. Request Validation
- **Library**: Zod (type-safe runtime validation)
- **Schemas**:
  - CreateContentSchema
  - UpdateContentSchema
  - ExportContentSchema
  - ListContentSchema (pagination)

### 5. Error Handling
- **Strategy**: Custom error classes for domain errors
- **HTTP Mapping**:
  - ValidationError → 400
  - UnauthorizedError → 401
  - ForbiddenError → 403
  - NotFoundError → 404
  - PayloadTooLargeError → 413

---

## Critical Success Factors

1. **Permission Enforcement**: Every endpoint must verify user owns the content
2. **Version Management**: Every PUT must create a new version record
3. **Sanitization**: All HTML must be sanitized with DOMPurify before storage
4. **Soft Delete**: DELETE sets `deleted_at`, doesn't remove rows
5. **Pagination**: GET /api/content defaults to limit=50, max=100
6. **Error Messages**: No hardcoded strings; centralized error catalog
7. **Observability**: Debug logs at all major points; structured logging
8. **No Direct SQL**: All DB access through repository pattern

---

## Testing Strategy

### Unit Tests (Service Layer)
- Test each service method independently
- Mock repository and adapters
- Coverage: ≥95%
- Include: CRUD, RBAC, sanitization, versioning, exports

### Integration Tests (End-to-End)
- Create content → Read → Update → Delete workflow
- Permission enforcement (cross-user access denied)
- Soft delete behavior
- Version history creation
- Export format correctness
- Pagination

### Contract Tests
- Request/response schema validation
- Error response format conformance
- HTTP status code correctness

### Security Tests
- OWASP XSS payload vectors (script tags, event handlers, etc.)
- Permission bypass attempts
- Input boundary tests (empty, >1MB)

---

## Dependencies & Tooling

### Already Installed
- ✅ TypeScript
- ✅ Express/Fastify (framework - TBD)
- ✅ PostgreSQL driver (TBD - pg or TypeORM)
- ✅ Jest (testing)
- ✅ DOMPurify (sanitization in frontend; need backend equiv)

### To Install (if not present)
- `zod` - Runtime validation
- `pg` or `typeorm` - PostgreSQL access
- `marked` or `turndown` - Markdown conversion

---

## Next: Start Phase 1

**First Deliverable**: Create all port/adapter interfaces and validation schemas.
**Time**: ~2 hours
**Files**:
- `content.repository.interface.ts`
- `content.service.interface.ts`
- `sanitizer.interface.ts`
- `exporter.interface.ts`
- `content.validator.ts`
- `content.entity.ts` (mappers)

---

**Ready to Begin Phase 1**: ✅ YES
**Blocker**: ❌ NONE
**Next Command**: Create port interfaces and validators
