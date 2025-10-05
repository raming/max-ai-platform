# ARCH-02 — Billing/Usage Collectors and Cost Attribution

Summary
Design and validate multi-source usage/cost collection attributed per client and client-agent across Retell, Twilio, OpenRouter (and others), with a scheduler plan and canonical schemas.

Scope
- Sources: Retell AI (per agent usage), Twilio (numbers/SMS/calls), OpenRouter (LLM tokens)
- Canonical schemas: UsageEvent, CycleAggregate; vendor unit cost captured at event-time
- Scheduling: Phase 1 via n8n cron → Phase 2 BullMQ with DLQ and retries
- Dashboards: admin usage rollups; client-facing summaries (opt-in)

Outputs
- JSON Schemas: UsageEvent, CycleAggregate
- ERD: usage_events, cycle_aggregates, mappings, sources
- Collector design notes: rate limits, pagination, idempotency
- PoC plan for one source (Retell or Twilio)

Acceptance criteria
- A1: Schemas committed in libs/contracts; validated in CI
- A2: ERD and collectors plan reviewed
- A3: PoC steps for one source documented and ready to run
- A4: Scheduler plan with retry/DLQ specified
- A5: Security/PII handling documented (no secrets in logs; redaction)

References
- docs/design/billing-model.md
- docs/adr/adr-0002-usage-aggregation.md
- docs/release/phase-1.md
