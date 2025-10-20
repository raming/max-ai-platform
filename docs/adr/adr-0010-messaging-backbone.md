# ADR-0010: Messaging Backbone and Asynchronous Work

Status: Proposed

Context
We need reliable asynchronous processing for events, retries, and DLQs. n8n is excellent for visual workflows, but it is not a general-purpose message broker.

Decision
- Use BullMQ (Redis) as the initial internal job queue for orchestrator and services (ingress → queue → workers) with retries, backoff, and DLQs
- Keep n8n for complex/branchy workflows and human-in-the-loop; invoke n8n via adapter when flows call for it
- Evaluate RabbitMQ (or Kafka) in Phase 2/3 if we need higher throughput, stronger ordering semantics, or cross-service fanout beyond Redis comfort

Consequences
- Clear separation: n8n = workflow engine; BullMQ/Redis = job queue; optional RabbitMQ/Kafka later
- Slight operational overhead to run Redis; later migration path if scale demands

References
- docs/adr/adr-0002-usage-aggregation.md (scheduling via n8n → BullMQ)
- docs/design/architecture-overview.md