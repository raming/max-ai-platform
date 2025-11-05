# Billing Model

Purpose
Define pricing and invoicing rules: subscription + included allowances + cost-plus markup + overage + caps, mapped to Stripe/PayPal.

Concepts
- Subscription: base recurring price per plan
- Included allowances: monthly included units by metric
- Cost-plus markup: percent and/or fixed added on top of vendor unit cost
- Overage: rate-based or cost-plus beyond included
- Tiers: optional tiered overage brackets
- Caps: minimum/maximum variable charges per cycle

Calculation (per cycle)
1) Aggregate usage per metric
2) included_applied = min(total_qty, included_qty)
3) overage_qty = max(0, total_qty - included_qty)
4) included_value = usually $0 (covered by subscription) or cost-plus if configured
5) overage_value =
   - rate: overage_qty × client_unit_rate
   - cost_plus: overage_qty × (vendor_unit_cost × (1+percent) + fixed) with optional tiers
6) Variable subtotal = included_value + overage_value, apply min/max
7) Total = subscription + variable subtotal + taxes/fees

Stripe mapping
- Subscription: standard recurring price
- Overage: metered usage (usage records) or dynamic invoice items computed at close
- Cost-plus: prefer dynamic invoice items for precision

PayPal mapping
- Compute totals internally, create PayPal invoice/order; internal ledger is source of truth

Data model (MVP)
- products/prices, subscriptions, metric_definitions
- usage_events (vendor_cost, quantity, metric_key, client_id, agent_id)
- cycle_aggregates, invoices, invoice_line_items, ledger_entries

Acceptance criteria (ARCH-05 alignment)
- Pricing config supports subscription, included, cost-plus (percent+fixed), tiered overage, caps
- Calculation spec with test fixtures and ≥95% coverage for valuation logic
- Stripe and PayPal mappings documented; idempotent webhook handling

References
- ADR-0004 — Payment gateway agnostic design
- docs/release/phase-1.md