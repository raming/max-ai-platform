# ARCH-13 — Messaging Backbone Selection and Implementation

Summary
Decide and implement the initial asynchronous processing backbone (BullMQ/Redis), with guidance on when to introduce RabbitMQ or Kafka, and how to keep n8n for visual workflows.

Scope
- Configure BullMQ queues and DLQs for orchestrator and ingress-driven jobs
- Define idempotency keys, retry/backoff policies, and queue naming conventions
- Document criteria for introducing RabbitMQ/Kafka (throughput, ordering, fanout)

Outputs
- ADR for messaging backbone
- Queue configuration reference and code snippets

Acceptance criteria
- M1: BullMQ configured with DLQ and metrics
- M2: Idempotency and retry policies documented and implemented
- M3: Criteria to escalate to RabbitMQ/Kafka documented

References
- docs/adr/adr-0010-messaging-backbone.md
- docs/design/architecture-overview.md
- docs/release/phase-1.md