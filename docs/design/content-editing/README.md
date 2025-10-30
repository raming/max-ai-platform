# Content Editing Feature (DEV-UI-08)

## Overview

Content Editing Integration enables users to create, edit, and manage rich text content within the MaxAI portal. Built on Quill.js with full backend persistence, versioning, and multi-format export capabilities.

## Primary Use Cases

- **User creates custom AI prompt templates** - Define custom instructions for AI agents
- **User edits response templates** - Refine automation rules and templates
- **User manages content workflows** - Track changes with version history
- **User exports content** - Download in HTML, Markdown, JSON, or plain text

## Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [DEV-UI-08 Specification](./DEV-UI-08-specification.md) | Complete architectural design (1,176 lines, 3-4 pages) | Architects, Team Leads, Developers |
| [Team Lead Handoff](./TEAM-LEAD-HANDOFF.md) | Task breakdown & creation instructions | Team Lead, Dev Lead |
| [Development Tasks](#development-tasks) | 7 GitHub issues (to be created by Team Lead) | Developers |
| [API Contracts](./contracts/) | OpenAPI/JSON Schema validation (TBD) | Developers, QA |

## Architecture Layers

### Frontend (Next.js / React)
- **Quill.js Editor** - Rich text editing with toolbar
- **State Management** - Zustand for client state, TanStack Query for server state
- **Components**: Editor, Toolbar, Preview, Export Modal, Version History

### Backend (Node.js / Express)
- **REST API** - CRUD endpoints for content management
- **Business Logic** - Validation, sanitization, permission enforcement
- **Data Persistence** - PostgreSQL with version tracking

### Data Model
- **Contents Table** - Main content storage (title, content, owner, timestamps)
- **Content Versions Table** - Version history for audit trail

## Key Features

✅ Rich text editing with formatting toolbar  
✅ Content persistence with ownership tracking  
✅ RBAC (Role-Based Access Control) enforcement  
✅ Content versioning with audit trail  
✅ Multi-format export (HTML, Markdown, JSON, text)  
✅ XSS protection via HTML sanitization  
✅ Preview mode for read-only display  
✅ Performance optimized (<200ms API p90)  
✅ ≥95% test coverage  
✅ Zero XSS vulnerabilities  

## Development Tasks

Development is broken down into focused tasks using the AI story template. Each task has explicit architectural constraints and acceptance criteria.

**Phase 1: Core Implementation**
- **DEV-UI-08-01**: Frontend - Content editor UI component and state management
- **DEV-UI-08-02**: Backend - REST API endpoints (CRUD operations)
- **DEV-UI-08-03**: Data Layer - Database schema and migrations

**Phase 2: Integration & Testing**
- **DEV-UI-08-04**: Integration tests and contract validation
- **DEV-UI-08-05**: Security testing (XSS prevention, RBAC)
- **DEV-UI-08-06**: Documentation and API reference

**Phase 3: Deployment**
- **DEV-UI-08-07**: Deployment, monitoring, and performance validation

See [DEV-UI-08 Specification](./DEV-UI-08-specification.md) for detailed requirements for each task.

## Technical Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript 5.x
- Quill.js (rich text editor)
- Zustand (state management)
- TanStack Query (server state)
- Tailwind CSS + shadcn/ui

**Backend**:
- Node.js + Express
- TypeScript
- PostgreSQL
- DOMPurify (HTML sanitization)
- Jest + Supertest (testing)

**Deployment**:
- Docker containerization
- Kubernetes orchestration
- GitHub CI/CD

## Non-Functional Requirements

| Requirement | Target | Measurement |
|------------|--------|-------------|
| API Performance | <200ms p90 | Response time monitoring |
| Test Coverage | ≥95% | Jest coverage reports |
| XSS Prevention | 100% | Security payload testing |
| Availability | 99.9% | Uptime tracking |
| Data Durability | 99.99% | PostgreSQL replication |

## Status

**Specification**: ⏳ Under Review  
**Implementation**: 🔄 Ready to Start  
**Testing**: ⏳ Pending  
**Deployment**: ⏳ Pending  

## Related Documentation

- [Portal UI Architecture](../portal-ui/README.md)
- [IAM & Authentication](../iam/README.md)
- [Database Portability](../db-portability-architecture-spec.md)
- [Ports & Adapters Pattern](../ports-and-adapters.md)

## Quick Links

- **Specification**: [Full Technical Spec](./DEV-UI-08-specification.md)
- **Frontend Demo**: `/client/web/src/app/content/page.tsx`
- **API Routes**: `/backend/routes/content.ts` (to be implemented)
- **Issue Tracker**: GitHub Issues #DEV-UI-08

---

**Next Steps**:
1. Review specification with team
2. Create individual development tasks
3. Assign to dev team
4. Begin Phase 1 implementation
