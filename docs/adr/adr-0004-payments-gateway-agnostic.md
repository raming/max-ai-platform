# ADR-0004: Payment Gateway Agnostic Design

Status: Proposed

Context
We must support Stripe and PayPal (extensible), with subscription + cost-plus + included + overage pricing.

Decision
- Define IPaymentProviderPort; implement Stripe and PayPal adapters
- Stripe: subscription + metered/dynamic invoice items; PayPal: internal computation + invoice API
- Ledger and idempotent webhooks as the source of truth

Consequences
- Flexible provider choice per tenant/client; consistent contracts
- Slight duplication in provider-specific features; mitigated via port abstraction

References
- docs/design/billing-model.md
- docs/design/ports-and-adapters.md