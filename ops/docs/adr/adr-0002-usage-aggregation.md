# ADR-0002: Usage Aggregation and Scheduling

Status: Proposed

Context
We need per-client/agent usage aggregation (Retell, Twilio, OpenRouter) for billing and analytics.

Decision
- Phase 1: schedule via n8n cron to call authenticated endpoints in billing-usage
- Phase 2: internal BullMQ jobs with retries and DLQs
- Canonical schemas: UsageEvent and CycleAggregate; vendor unit cost captured at event-time

Consequences
- Quick start via n8n; robust long-term scheduler in platform
- Clear attribution and reproducibility per cycle

References
- docs/design/billing-model.md
- docs/design/architecture-overview.md