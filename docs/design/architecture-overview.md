# Architecture Overview (MaxAI Platform)

Purpose
Define the target multi-tenant architecture for AI-Employee services with platform-agnostic integrations, declarative orchestration, and payment gateway–agnostic billing.

Services (high-level)
- apps/portal-web (Next.js)
  - Client portal for onboarding, connections (reviews/calendar), usage, and billing
  - RBAC via IAM; no direct GHL exposure (server-side proxies)
- apps/admin-web (optional initially)
  - Internal ops/support dashboards, billing/usage analytics
- apps/api-gateway (NestJS)
  - Public API, RBAC gates, request validation, correlation IDs, audit hooks
- services/webhook-ingress (NestJS)
  - Terminate external webhooks (GHL, Retell, Twilio, Payments), normalize via JSON Schemas, forward to orchestrator/n8n
- services/orchestrator (NestJS)
  - Execute declarative flows (triggers, steps, adapters, retries); delegate complex flows to n8n
- services/integrations (ports/adapters)
  - integrations-crm (ICRMPort): GHL (current), HubSpot, Dynamics (future)
  - integrations-calendar (ICalendarPort): Google, Microsoft
  - integrations-voice (Retell): agent config, post-call analysis
  - integrations-messaging (IMessagePort): Twilio SMS/calls (and future providers)
  - integrations-llm (ILlmPort): OpenRouter default; pluggable models/providers (direct model APIs supported)
  - integrations-workflow: n8n control/templating
- apps/feature-flags (or shared service)
  - Global feature registry (alpha, beta, GA), environment-aware
  - Allowlist at tenant and user level; server-side evaluation; UI gates in portal
  - Pattern inspired by hakim_platform betaFeatures (global list + per-tenant/user enablement)
- apps/iam (NestJS)
  - Multi-tenant identity, SSO (Google), service tokens, RBAC, audit
- apps/prompt-svc (NestJS)
  - Template registry (MD/JSON), client instances, versioning, rollout, delivery to agents/workflows
- apps/billing-usage (NestJS)
  - Collectors for Retell/Twilio/OpenRouter; daily rollups; anomaly flags
- apps/payments (NestJS)
  - IPaymentProviderPort with adapters (Stripe, PayPal); subscriptions, usage-based invoice items, SCA; ledger/reconciliation

Key flows
- Ingress → Normalize → Orchestrate → Adapters
- Declarative flows bind tenant/client to specific adapters (crm, calendar, payments). Complex branches go to n8n.
- Client-facing “Connect accounts” done via our backend OAuth proxy; tokens stored server-side, not exposed.

Platform-agnostic integrations
- Ports define contracts: ICRMPort, ICalendarPort, IPaymentProviderPort, IMessagePort
- Adapters are swappable by configuration per tenant/client via flow bindings

LLM-assisted content and deployment
- Use ILlmPort to generate/edit prompts, flow specs, webhook mappings, and templates for client onboarding
- Human-in-the-loop review and non-prod validation against contracts before activation
- Versioned artifacts (templates, client instances) in prompt-svc; ability to push/re-push configs to n8n, GHL, Retell via adapters with upsert semantics; full audit trail

Billing and payments (gateway-agnostic)
- Subscription + cost-plus (percent + fixed) + included allowances + tiered overage + min/max caps
- Usage sources: Retell, Twilio, OpenRouter; attribute per client/agent; cycle snapshots for reproducibility
- Stripe: metered prices or dynamic invoice items; PayPal: internal computation + invoice API; ledger as source of truth

Notifications and SMS strategy
- Critical notifications (billing/auth/SLA): internal service for guarantees, idempotency, audit
- Business/process flows: use n8n where helpful
- SMS delivery in agent conversations: three options
  1) Direct via IMessagePort (Twilio adapter)
  2) Via GHL API (when appropriate)
  3) Via n8n Twilio node

Security, compliance, observability, governance
- ESLint warnings as errors, ≥95% coverage; contracts validated in CI and non-prod runtime
- Structured logs with tenant_id, client_id, correlation_id; no secrets/PII in logs; redaction enforced
- Audit trails for IAM changes, prompt publishing, credential rotations, payments events
- Compliance: HIPAA-like safeguards (if PHI is present) and PCI SAQ A posture (hosted payments only)

Database portability
- ANSI-first SQL; portable ORM; application-layer policy checks; CI matrix across providers

Messaging backbone
- BullMQ/Redis for internal job queues; n8n for complex visual workflows; evaluate RabbitMQ/Kafka in later phases

Links
- ADRs: docs/adr/
- Ports: docs/design/ports-and-adapters.md
- Billing: docs/design/billing-model.md
- Notifications: docs/design/notifications-and-sms-strategy.md
- Security & compliance: docs/design/security-compliance.md
- DB portability: docs/design/db-portability.md
- Release plan: docs/release/phase-1.md
