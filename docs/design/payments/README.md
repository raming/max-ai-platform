# Payments Component Architecture

Gateway-agnostic payment processing with multi-provider support (Stripe MVP, PayPal Phase 2).

## Documents

1. **[Overview](./overview.md)** - Component architecture, gateway-agnostic design philosophy
2. **[Data Model](./data-model.md)** - Subscriptions, invoices, usage events, ledger ERD
3. **[API Contracts](./api-contracts.md)** - REST endpoints, webhook schemas, idempotency
4. **[Stripe Adapter](./stripe-adapter.md)** - Stripe integration details, webhook handling
5. **[Billing Engine](./billing-engine.md)** - Usage aggregation, invoice generation, valuation
6. **[Reconciliation](./reconciliation.md)** - Payment reconciliation, disputes, refunds

## Quick Reference

| Topic | Document |
|-------|----------|
| Component architecture | [Overview](./overview.md#component-architecture) |
| Payment flow sequence | [Overview](./overview.md#payment-flow) |
| Database schema | [Data Model](./data-model.md#database-schema) |
| API endpoints | [API Contracts](./api-contracts.md#rest-api) |
| Stripe webhooks | [Stripe Adapter](./stripe-adapter.md#webhook-handling) |
| Usage valuation | [Billing Engine](./billing-engine.md#usage-valuation) |
| Dispute handling | [Reconciliation](./reconciliation.md#dispute-handling) |

## Related Documentation

- **Implementation Spec**: [`impl/phase-1/payments.md`](../impl/phase-1/payments.md)
- **Billing Model**: [`billing-model.md`](../billing-model.md)
- **ADRs**: ADR-0004 (Payment gateway agnostic design)
- **System Overview**: [`system-overview.md`](../system-overview.md)

## Design Principles

1. **Gateway Agnostic** - Abstract payment providers behind ports
2. **Idempotent Processing** - Webhook deduplication, event-based ledger
3. **PCI Compliance** - SAQ-A posture, no card data handling
4. **Audit Trail** - Immutable ledger entries, correlation IDs
5. **Cost Attribution** - Track vendor costs, apply markup transparently
