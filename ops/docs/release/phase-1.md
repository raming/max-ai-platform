# Phase 1 Plan — Foundations and MVP

Goals
- Establish Nx monorepo and CI gates (lint, type, test ≥95% coverage, schema validation)
- Deliver IAM (MVP), Prompt Management (MVP), Webhook Ingress (MVP)
- Define Declarative Flow Schema (MVP) and run one end-to-end flow (Retell → CRM upsert → Calendar booking)
- Implement Billing-Usage collector (Retell) and Payments (Stripe adapter MVP)
- Provide portal flows for “Connect accounts” and basic billing overview

Scope and links
- Architecture: ../design/architecture-overview.md
- Ports: ../design/ports-and-adapters.md
- Layering/DTOs: ../design/architecture-layering.md
- Billing: ../design/billing-model.md
- Notifications/SMS: ../design/notifications-and-sms-strategy.md
- LLM & Automation: ../design/llm-and-automation.md
- Feature Flags: ../design/feature-flags.md
- IAM Entities: ../design/iam-entities-and-tenancy.md
- Templates: ../design/template-registry-and-deployment.md
- ADR-0001: ../adr/adr-0001-ghl-encapsulation.md
- ADR-0002: ../adr/adr-0002-usage-aggregation.md
- ADR-0003: ../adr/adr-0003-iam-and-prompt-services.md
- ADR-0004: ../adr/adr-0004-payments-gateway-agnostic.md
- ADR-0005: ../adr/adr-0005-declarative-flows.md
- ADR-0006: ../adr/adr-0006-llm-provider-agnostic.md
- ADR-0007: ../adr/adr-0007-feature-flags.md
- ADR-0008: ../adr/adr-0008-security-compliance.md
- ADR-0009: ../adr/adr-0009-db-portability.md
- ADR-0010: ../adr/adr-0010-messaging-backbone.md

UI/UX Stack and Templates
- Primary stack: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Radix) + Tremor (charts) + TanStack Table + React Hook Form + Zod
- Admin alternatives: Ant Design Pro (Next.js) for rapid enterprise admin; React Admin for CRUD-heavy internal ops
- Dashboard shells and templates: TailAdmin, Mosaic, Notus, Windmill (use as shells; migrate components to shadcn/ui)
- Initial pages: Dashboard, Clients, Integrations, Flows, Usage & Billing, Templates & Prompts, Settings, Audit; include multi-step wizards for onboarding and connect flows
- Testing: Playwright e2e, React Testing Library, Storybook; a11y via Radix primitives; ESLint warnings as errors

Milestones
1) Monorepo + CI gates ready
2) IAM MVP: Google SSO, RBAC, audit events (entities: tenant, client, group, role, permission, assignment)
3) Prompt-svc MVP: import templates → client instance → publish (non-prod validation)
4) Webhook-ingress MVP: Retell + Twilio; normalize + validate
5) Declarative flow schema MVP + orchestrator (simple E2E)
6) Billing-usage MVP: Retell collector daily rollups
7) Payments MVP: Stripe adapter; base sub + one metered metric; sandbox invoice
8) Portal MVP: Connect accounts + billing overview
9) Portal UI: scaffold shell with the chosen stack and import dashboard template (Mosaic/Notus/Windmill), replace controls with shadcn/ui
10) Templates & Deployment MVP: template registry, customization, deployment plan, provider links recorded
11) LLM abstraction: ILlmPort defined and a draft generation→review→promote workflow exercised in non-prod (no auto-activation)
12) Feature flags: framework design finalized (implementation begins Phase 2)

Acceptance criteria
- CI enforces lint errors as failures and ≥95% coverage
- Contracts committed for all adapters used in Phase 1; validated in CI and non-prod
- One E2E flow demonstrably runs with correlation IDs and audits
- Billing: Retell usage ingested and visible in admin; stripe sandbox invoice generated
- Portal: Google connect completes; basic billing page shows subscription and usage-to-date
- UI/UX: Portal shell, navigation, and at least two wizard flows implemented with RHF+Zod; dark mode and a11y checks in CI
- LLM: ILlmPort contracts exist; at least one generated artifact passes non-prod validation and human review, then is promoted
- Feature flags: ADR and design doc approved; per-tenant/user allowlist semantics documented
- Security/Compliance: audit log fields present across services; logger redaction on; PCI SAQ A posture documented and followed
- DB portability: repository pattern in code; migrations tested on at least one alternative Postgres target
- Messaging: BullMQ/Redis queues with DLQ configured for orchestrator critical paths

Risks and mitigations
- GHL API gaps → proxy + guided flows; consider n8n polling where no webhooks exist
- Over-reliance on n8n → keep declarative-first, delegate only complex branches
- Billing accuracy → unit tests on valuation logic; idempotency + reconciliation
- Template drift → adopt shadcn/ui as a consistent component baseline and replace template components incrementally

Incremental Delivery & Priorities
- P0: Webhook Ingress (Retell, Twilio) + Declarative Orchestrator minimal path + Portal Connect Accounts
- P1: IAM (Google SSO, RBAC), Prompt-svc draft→publish, Retell usage collector
- P1: Payments (Stripe MVP), Usage & Billing Overview page
- P2: Integrations Catalog, Templates & Prompts UI
- P2: Additional flows in orchestrator; n8n delegation

Timeline (indicative)
- Week 1–2: P0 items
- Week 3–4: P1 items
- Week 5–6: P2 items; hardening, tests, a11y

Detailed Specs
- See detailed specs under ../design/impl/phase-1/README.md for each component

Handoffs
- Team Lead can decompose into stories by component; use the detailed specs pages to author tasks for dev/QA
