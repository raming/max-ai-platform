# Integration Adapters Architecture

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Overview

This directory contains the architecture documentation for the Integration Adapters component of the MAX AI Platform. The Integration Adapters implement the **Ports & Adapters (Hexagonal Architecture)** pattern to provide vendor-agnostic integration with external services while maintaining swappability, testability, and vendor independence.

## Documentation Structure

### Core Architecture
- **[overview.md](./overview.md)** - Ports & adapters pattern, design philosophy, adapter selection flow, NFRs

### Port Specifications
- **[crm-port.md](./crm-port.md)** - ICRMPort interface, GHL adapter, contact/opportunity/task management
- **[calendar-port.md](./calendar-port.md)** - ICalendarPort interface, Google/Microsoft adapters, event scheduling
- **[voice-port.md](./voice-port.md)** - IVoicePort interface, Retell adapter, call management and real-time events
- **[messaging-port.md](./messaging-port.md)** - IMessagePort interface, Twilio adapter, SMS/MMS delivery
- **[llm-port.md](./llm-port.md)** - ILlmPort interface, OpenRouter adapter, LLM completions and streaming

## Quick Reference

### Supported Integrations

| Port | Current Adapter(s) | Purpose | Authentication |
|------|-------------------|---------|----------------|
| **ICRMPort** | GoHighLevel (GHL) | Contact/opportunity management, task sync | OAuth 2.0 |
| **ICalendarPort** | Google Calendar, Microsoft Calendar | Event scheduling, availability checking | OAuth 2.0, MS Graph API |
| **IVoicePort** | Retell | Voice call initiation, recording retrieval | API Key |
| **IMessagePort** | Twilio | SMS/MMS messaging, delivery tracking | Account SID + Auth Token |
| **ILlmPort** | OpenRouter | LLM chat completions, streaming responses | API Key |

### Design Principles

1. **Vendor Independence**: All business logic depends on port interfaces, never concrete adapters
2. **Swappability**: Adapters can be replaced without changing business logic
3. **Testability**: Ports enable mock adapters for testing without external dependencies
4. **Observability**: All adapters instrument operations with structured logging, metrics, and distributed tracing
5. **Resilience**: Adapters implement retry logic, circuit breakers, and graceful degradation

### Common Patterns

- **Configuration**: Adapters configured via environment variables or config service
- **Error Handling**: Adapter-specific errors mapped to domain errors at port boundary
- **Rate Limiting**: Adapters implement rate limit awareness and backoff strategies
- **Webhooks**: Inbound webhooks processed by Webhook Ingress, routed to appropriate adapters
- **Usage Tracking**: Billable operations reported to Billing-Usage component

## Related Documentation

- **System Architecture**: [docs/design/system-architecture.md](../system-architecture.md) (Issue #148)
- **Orchestrator Component**: [docs/design/orchestrator/](../orchestrator/) (Issue #152)
- **Webhook Ingress Component**: [docs/design/webhook-ingress/](../webhook-ingress/) (Issue #153)
- **Billing-Usage Component**: [docs/design/billing-usage/](../billing-usage/) (Issue #154)
- **IAM Component**: [docs/design/iam/](../iam/) (Issue #149)

## Technology Stack

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20.x LTS
- **HTTP Client**: axios with interceptors
- **WebSocket**: Socket.IO client (for Retell real-time events)
- **Validation**: Zod for runtime schema validation
- **Testing**: Jest, Supertest, Nock (HTTP mocking)
- **Observability**: Winston (logging), Prometheus metrics, OpenTelemetry tracing

## Implementation Notes

- All port interfaces defined in `@platform/integration-ports` package
- Adapters implemented in separate packages (e.g., `@platform/ghl-adapter`, `@platform/twilio-adapter`)
- Adapter selection resolved at runtime via dependency injection (InversifyJS)
- Configuration managed via `@platform/config` with validation
- Secrets stored in GCP Secret Manager, never in code or environment variables directly

---

**Next Steps**: Start with [overview.md](./overview.md) for detailed architecture and design philosophy.
