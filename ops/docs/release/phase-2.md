# Phase 2 Plan — Platformization & Portal GA

Goals
- Broaden adapters (payments, calendar, CRM) and make the portal production-ready (GA)
- Harden declarative flows and notifications; expand billing features

Scope and links
- Architecture: ../design/architecture-overview.md
- Ports: ../design/ports-and-adapters.md
- LLM & Automation: ../design/llm-and-automation.md
- Feature Flags: ../design/feature-flags.md
- ADR-0001: ../adr/adr-0001-ghl-encapsulation.md
- ADR-0002: ../adr/adr-0002-usage-aggregation.md
- ADR-0004: ../adr/adr-0004-payments-gateway-agnostic.md
- ADR-0005: ../adr/adr-0005-declarative-flows.md
- ADR-0006: ../adr/adr-0006-llm-provider-agnostic.md
- ADR-0007: ../adr/adr-0007-feature-flags.md

Milestones
1) Payments: PayPal adapter; finalize pricing config in code; invoices and receipts
2) Calendar: Microsoft adapter; calendar unit tests ≥95% coverage; OAuth proxy hardened
3) CRM: add HubSpot (or Dynamics) adapter; contact field mapping UI in portal
4) Declarative Flows: GA feature set (retries, compensation hooks, promotion pipeline)
5) Notifications: internal service for critical alerts + n8n recipes for business flows
6) Billing: tiered overage, caps, multi-currency (if needed), anomaly alerts
7) Portal: full onboarding wizard, integrations catalog, usage dashboards, prompt manager GA
8) Feature Flags: implement server-side evaluation + portal consumption

Acceptance criteria
- All new adapters have contracts and CI validation; coverage ≥95%
- Payments (Stripe+PayPal) generate accurate invoices in sandbox
- Portal GA checklist passed (a11y, perf, SSR/SEO where needed)
- Declarative flows promotion pipeline in place; version rollback tested

Risks and mitigations
- Provider API limits → backoff, quotas, caching; on-call runbooks
- CRM divergences → canonical mapping docs and tests; adapter matrix maintained

Handoffs
- Team Lead can decompose by adapter/service; QA plans per adapter
