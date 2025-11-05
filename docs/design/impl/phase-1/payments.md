# Payments (MVP) — Extreme Detail Spec

Purpose
Provide gateway-agnostic payments via IPaymentProviderPort with Stripe (MVP) and PayPal (Phase 2), including idempotent webhooks, valuation logic, and ledger entries.

Ports (interfaces)
- IPaymentProviderPort: createCustomer, createSubscription, recordUsage, finalizeInvoice
- IInvoiceValuation: value(lineItem|usageEvent) → amount; supports tiers, caps, cost-plus
- IWebhookVerifier: verify(provider, headers, rawBody) → ok

APIs (internal)
- POST /payments/customers — 201 {customerId}; idempotent by (tenant, client)
- POST /payments/subscriptions — 201 {subscriptionId}
- POST /payments/usage — 202 accepted; enqueue valuation job
- POST /payments/invoices/finalize — 200 {invoiceId}

Webhooks (ingress → normalize → enqueue)
- POST /ingress/payments/stripe — signature verify; normalize PaymentEvent; idempotency via event id

Data model (constraints)
- payments_customers(
  id PK, tenant_id, client_id, provider, provider_customer_id, UNIQUE(tenant_id, client_id, provider)
)
- subscriptions(
  id PK, customer_id FK, plan_id, status ENUM(active,canceled,past_due), period JSONB
)
- invoices(
  id PK, subscription_id FK, total_cents, currency, status ENUM(open,finalized,pending), external_id?, UNIQUE(external_id)
)
- invoice_line_items(
  id PK, invoice_id FK, metric_key, quantity, unit_price_cents, type ENUM(subscription,usage,credit,refund)
)
- ledger_entries(
  id PK, at, debit_cents, credit_cents, ref_type, ref_id, correlation_id
)

Contracts (JSON Schemas)
- ../../contracts/payment-event.schema.json
- ../../contracts/subscription.schema.json
- ../../contracts/invoice.schema.json
- ../../contracts/invoice-line-item.schema.json

Security & compliance
- PCI SAQ A posture: use hosted UI; do not handle card data
- Webhook signatures verified; reject on skew/invalid
- Redact PII; no tokens in logs

Observability
- Metrics: payments_events_total{provider,type}, valuation_duration_ms, invoices_finalized_total
- Logs: tenant_id, client_id, provider, invoice_id, correlation_id
- Traces: valuation and finalize spans with external ids

NFRs
- Valuation P95 < 100ms per 100 line items; invoice finalize P95 < 1s
- Reliability: idempotent processing of webhooks (ignore duplicates)

Error taxonomy
- 400.schema_invalid | 401.signature_invalid
- 404.customer_or_subscription_not_found
- 409.duplicate_event | 409.subscription_state_conflict
- 502.provider_error_{stripe|paypal}

Test strategy
- Unit: valuation rules; ≥95% coverage
- Integration: Stripe sandbox flows; webhook idempotency; finalize invoice end-to-end
- Contract: JSON Schemas for payment events and invoice artifacts

Acceptance criteria
- Stripe sandbox: base subscription + one metered metric invoice produced
- Webhook signature verification and idempotency implemented; ledger entries recorded where applicable
- CI coverage ≥95% on valuation and billing flows
