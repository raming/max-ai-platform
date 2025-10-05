# ARCH-05 — Multi-Provider Payments and Invoicing

Summary
Add payment gateway–agnostic billing with IPaymentProviderPort and adapters (Stripe, PayPal), supporting subscription + included allowances + cost-plus (percent+fixed) + tiered overage + caps.

Scope
- Define IPaymentProviderPort: createCustomer, attachPayment, subscribe, reportUsage/createInvoiceItem, generateInvoice, refund, verifyWebhook, getInvoice
- Data model: products/prices, subscriptions, metric_definitions, usage_events, cycle_aggregates, invoices, invoice_line_items, ledger_entries
- Stripe: subscription + metered/dynamic invoice items; PayPal: internal computation + invoice API
- Idempotent webhooks and reconciliation; ledger as source of truth

Outputs
- Schemas: PaymentEvent, Subscription, Invoice, Charge/Refund
- ERD for payments tables; provider links
- Pricing config examples and valuation tests

Acceptance criteria
- P1: Contracts and ERD drafted
- P2: Webhook verification and idempotency policy documented
- P3: SCA/3DS flow for portal defined
- P4: Usage-to-invoice mapping aligned with billing-usage
- P5: Pricing config supports subscription, included, cost-plus, tiered overage, caps
- P6: Calculation spec with fixtures for voice_minutes, sms_segments, llm_tokens
- P7: Stripe mapping (metered vs invoice items) chosen; PayPal invoice flow specified
- P8: Ledger and reconciliation process documented; tests ≥95% coverage for valuation

References
- docs/design/billing-model.md
- docs/adr/adr-0004-payments-gateway-agnostic.md
- docs/release/phase-1.md