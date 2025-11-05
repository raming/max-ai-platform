# IAM Component Documentation

Identity and Access Management (IAM) component provides multi-tenant identity, SSO, RBAC, and audit capabilities.

## Documents

- [**Overview**](./overview.md) - Component architecture, responsibilities, tech stack
- [**Data Model**](./data-model.md) - Entities, relationships, ERD, migrations
- [**API Contracts**](./api-contracts.md) - REST endpoints, DTOs, JSON schemas
- [**Authentication**](./authentication.md) - SSO flows, token management, session handling
- [**Authorization**](./authorization.md) - RBAC engine, policy checks, permission model
- [**Audit**](./audit.md) - Audit trails, observability, compliance tracking
- [**Security**](./security.md) - Threat model, security controls, mitigations

## Related Documentation

- [System Overview](../system-overview.md) - Platform-level architecture
- [Container Architecture](../container-architecture.md) - Service interactions
- [Phase 1 Implementation](../impl/phase-1/iam.md) - MVP implementation spec

## Quick Reference

**Service**: `iam` (NestJS)  
**Port**: 3001  
**Database**: PostgreSQL (tenant_id partitioning)  
**Cache**: Redis (policy decisions, session metadata)  
**Queue**: BullMQ (audit event processing)
