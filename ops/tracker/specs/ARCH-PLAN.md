# ARCH-PLAN — Open Investigations and Tasks

Use these as tracker bodies for GitHub Issues. Source of truth should be Issues; this file mirrors planned work.

- ARCH-02 — Billing/usage collectors and cost attribution
  - Objective: aggregate usage (Retell, Twilio, OpenRouter); attribute per client/agent; schedule via n8n→BullMQ
  - Outputs: UsageEvent/CycleAggregate schemas; ERD and collectors plan; risks; PoC for one source
  - Acceptance: A1..A5 (see issue body)

- ARCH-03 — Encapsulated reviews/calendar onboarding (no GHL domain)
  - Objective: portal flows with server-side proxy; token storage; ADR on embed vs proxy
  - Outputs: sequence diagrams; contracts for review/calendar models; decision matrix
  - Acceptance: B1..B3

- ARCH-04 — IAM and Prompt Management
  - Objective: multi-tenant RBAC; prompt templates/instances with rollout and audit
  - Outputs: IAM/Prompt schemas and ERDs; ADR on RBAC and prompt policies
  - Acceptance: C1..C4

- ARCH-05 — Multi-provider payments and invoicing
  - Objective: IPaymentProviderPort; Stripe+PayPal adapters; pricing config (subscription+included+cost-plus+overage)
  - Outputs: PaymentEvent/Subscription/Invoice schemas; ERD; ADR on provider mapping
  - Acceptance: P1..P8

- ARCH-06 — Declarative orchestration and plugin framework
  - Objective: flow spec + plugin registry + n8n fallback
  - Outputs: Flow schema; examples; ADR; capability matrix
  - Acceptance: D1..D3

- ARCH-07 — Platform-agnostic CRM/Calendar ports
  - Objective: ICRMPort/ICalendarPort for GHL/HubSpot/Dynamics and Google/Microsoft; OAuth proxy
  - Outputs: Port schemas; OAuth design; iFrame/whitelabel decision note
  - Acceptance: C1..C3
