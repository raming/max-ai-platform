# Prompt Service Component Architecture

**Version**: 1.0  
**Phase**: Phase 1  
**Status**: Specification  

## Overview

This directory contains the detailed architecture specification for the Prompt Service component.

## Documents

1. **[overview.md](./overview.md)** - Component architecture, responsibilities, technology stack
2. **[data-model.md](./data-model.md)** - Entity relationships, schema design, migrations
3. **[api-contracts.md](./api-contracts.md)** - REST API endpoints, request/response schemas
4. **[versioning.md](./versioning.md)** - Template versioning strategy, rollout, diff management
5. **[adapter-publishing.md](./adapter-publishing.md)** - Delivery mechanisms to Retell, n8n, GHL
6. **[validation.md](./validation.md)** - Template validation rules, variable substitution

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Service Name** | `prompt-service` |
| **Port** | 3002 |
| **Database** | PostgreSQL (via TypeORM) |
| **Cache** | Redis |
| **Queue** | BullMQ |
| **Storage** | Cloud Storage (GCS/S3) for template artifacts |

## Related Documentation

- [Implementation Spec](../impl/phase-1/prompt-svc.md) - Phase 1 implementation details
- [System Overview](../system-overview.md) - Overall platform architecture
