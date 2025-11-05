# Billing-Usage Component Architecture

## Purpose

Collect, normalize, and aggregate billable usage from external providers (Retell, Twilio, OpenRouter), attribute to clients/agents, compute cycle aggregates, and provide usage reports for billing and analytics.

## Documentation Index

| Document | Purpose | Key Topics |
|----------|---------|------------|
| [Overview](./overview.md) | Component architecture & design philosophy | Collectors, aggregators, reporters, integration points |
| [Data Model](./data-model.md) | Database schema with ERD | usage_events, cycle_aggregates, collector_state |
| [Collectors](./collectors.md) | Platform-specific usage collection | Retell, Twilio, OpenRouter API integration |
| [Aggregation](./aggregation.md) | Daily rollups & attribution | Cycle boundaries, anomaly detection, backfill |
| [Reporting](./reporting.md) | Usage reports & analytics | API contracts, dashboards, exports |

## Quick Reference

**Core Responsibilities:**
- Collect usage events from provider APIs (polling + webhooks)
- Normalize vendor-specific formats to canonical UsageEvent schema
- Attribute usage to clients and agents
- Compute daily/cycle aggregates
- Detect anomalies (spikes, missing data)
- Expose usage reports for billing and analytics

**Supported Providers:**
- **Retell AI**: Voice call minutes, LLM token usage
- **Twilio**: SMS messages, voice call minutes
- **OpenRouter**: LLM tokens (GPT-4, Claude, etc.)

**Integration Points:**
- **Upstream**: Webhook Ingress (real-time events), Provider APIs (polling)
- **Downstream**: Payments/Billing Engine (invoice valuation), Portal UI (usage dashboards)

**NFRs:**
- Collection latency: < 5 minutes (webhook), < 15 minutes (polling)
- Aggregation: Daily rollups complete by 1 AM UTC
- Idempotency: Duplicate detection via idempotency keys
- Coverage: ≥95% (anomaly detection for gaps)
- Data retention: 13 months (detailed events), indefinite (cycle aggregates)

## Related Documentation

- [Payments Component](../payments/README.md) - Invoice generation, pricing valuation
- [Webhook Ingress](../webhook-ingress/README.md) - Real-time event collection
- [Orchestrator](../orchestrator/README.md) - Integration adapters (Retell, Twilio)
- [Implementation Spec](../impl/phase-1/billing-usage.md) - Development tasks
