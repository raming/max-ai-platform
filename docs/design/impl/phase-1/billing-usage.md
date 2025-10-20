# Billing-Usage (MVP) — Detailed Spec

Purpose
Collect, normalize, and aggregate usage from external providers (Retell first), attribute to client/agent, and expose cycle aggregates for billing and analytics.

Collector API
- POST /billing/collect/retell?since=timestamp — authenticated; idempotent

Data model
- usage_events(id, source, metric_key, quantity, vendor_cost, currency, occurred_at, client_id, agent_id, idempotency_key)
- cycle_aggregates(id, period, client_id, metric_key, quantity, included_applied, overage_quantity, valuation_snapshot)

Contracts
- JSON Schemas: UsageEvent, CycleAggregate
- See: ../../contracts/usage-event.schema.json
- See: ../../contracts/cycle-aggregate.schema.json

Acceptance criteria
- Retell collector pulls usage safely with pagination and idempotency
- Daily rollups computed; anomalies flagged; coverage ≥95%