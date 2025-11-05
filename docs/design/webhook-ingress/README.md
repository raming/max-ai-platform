# Webhook Ingress Component Architecture

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Status**: Specification  

## Overview

This folder contains the detailed architecture documentation for the Webhook Ingress component, which normalizes, validates, and routes external webhooks from multiple platforms into the MAX AI platform.

## Documents

| Document | Purpose | Key Content |
|----------|---------|-------------|
| [Overview](./overview.md) | Component architecture and design | Component diagram, normalization pipeline, integration points |
| [Webhook Sources](./webhook-sources.md) | Platform-specific webhook schemas | GHL, Retell, Twilio, Stripe webhook specifications |
| [Validation](./validation.md) | Security and schema validation | Signature verification, schema validation, replay protection |
| [Routing](./routing.md) | Webhook routing logic | How webhooks route to Orchestrator/services |
| [Error Handling](./error-handling.md) | Resilience and recovery | Retries, DLQ, idempotency, error responses |

## Quick Reference

**Component Responsibilities**:
- Receive webhooks from external platforms (GHL, Retell, Twilio, Stripe)
- Verify webhook signatures for security
- Validate webhook payloads against schemas
- Normalize platform-specific formats to canonical events
- Route events to Orchestrator flows or internal services
- Handle errors with retries and dead letter queue

**Tech Stack**:
- **Runtime**: Node.js / NestJS
- **Validation**: JSON Schema, platform SDKs (stripe, twilio, etc.)
- **Queue**: Redis Bull for async processing
- **Storage**: PostgreSQL for webhook audit log
- **Observability**: Structured logging, metrics, tracing

## Related Documentation

- [System Overview](../system-overview.md)
- [Implementation Spec](../impl/phase-1/webhook-ingress.md)
- [Orchestrator Architecture](../orchestrator/)
