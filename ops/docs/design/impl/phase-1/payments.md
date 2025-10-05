# Payments (MVP) — Detailed Spec

Purpose
Implement IPaymentProviderPort with Stripe (MVP) to support subscription + included allowances + cost-plus (percent+fixed) + tiered overage + caps; prepare PayPal for Phase 2.

APIs (internal, initial)
- POST /payments/customers — create or link provider customer
- POST /payments/subscriptions — create subscription (base plan)
- POST /payments/usage — record usage or generate invoice items
- POST /payments/invoices/finalize — finalize and send invoice

Data model
- payments_customers(id, tenant_id, client_id, provider, provider_customer_id)
- subscriptions(id, customer_id, plan_id, status, period)
- invoices(id, subscription_id, total, currency, status)
- invoice_line_items(id, invoice_id, metric_key, quantity, unit_price, type)
- ledger_entries(id, debit, credit, ref)

Contracts
- JSON Schemas: PaymentEvent, Subscription, Invoice, Charge/Refund
- See: ../../contracts/payment-event.schema.json
- See: ../../contracts/subscription.schema.json
- See: ../../contracts/invoice.schema.json
- See: ../../contracts/invoice-line-item.schema.json

Acceptance criteria
- Stripe sandbox: base subscription + one metered metric invoice produced
- Webhook signature verification; idempotency for invoice events
- Valuation logic covered ≥95%