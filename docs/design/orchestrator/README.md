# Orchestrator Component Architecture

**Version**: 1.0  
**Phase**: Phase 1  
**Status**: Specification  

## Overview

This directory contains the detailed architecture specification for the Orchestrator component, which manages declarative AI agent workflows.

## Documents

1. **[overview.md](./overview.md)** - Component architecture, declarative flow design philosophy
2. **[flow-schema.md](./flow-schema.md)** - Flow DSL specification, triggers, steps, conditions
3. **[execution-engine.md](./execution-engine.md)** - Runtime behavior, retries, error handling, state management
4. **[adapter-binding.md](./adapter-binding.md)** - How flows bind to ports and adapters
5. **[n8n-integration.md](./n8n-integration.md)** - When to delegate to n8n, hybrid workflow patterns

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Service Name** | `orchestrator` |
| **Port** | 3003 |
| **Database** | PostgreSQL (via TypeORM) |
| **Cache** | Redis |
| **Queue** | BullMQ |
| **Flow Storage** | PostgreSQL (JSONB) + Cloud Storage |

## Related Documentation

- [Implementation Spec](../impl/phase-1/orchestrator.md) - Phase 1 implementation details
- [System Overview](../system-overview.md) - Overall platform architecture
- [ADR-0005: Declarative Flows](../../adr/adr-0005-declarative-flows.md) - Decision rationale
