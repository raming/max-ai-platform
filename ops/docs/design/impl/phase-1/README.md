# Phase 1 — Onboarding Wizard Index

Tracker
- Epic: #22 — EPIC-ONB-06 Client Onboarding Wizard (Customize→Deploy)

Scope
A guided flow for client onboarding: Client info → Template selection → Customize (variables + optional LLM) → Plan/Deploy → Validate callbacks.

Design references
- ops/docs/design/impl/phase-1/portal-ui.md
- ops/docs/design/template-registry-and-deployment.md
- ops/docs/design/impl/phase-1/template-deployment.md
- ops/docs/design/impl/phase-1/webhook-ingress.md
- ops/docs/design/impl/phase-1/prompt-svc.md

ADRs
- ops/docs/adr/adr-0007-feature-flags.md

Contracts (canonical sources)
- ops/docs/contracts/deployment-plan.schema.json
- ops/docs/contracts/deployment-record.schema.json
- ops/docs/contracts/provider-link.schema.json
- ops/docs/contracts/prompt-template.schema.json
- ops/docs/contracts/template-artifact.schema.json
- ops/docs/contracts/voice-call-event.schema.json
- ops/docs/contracts/sms-event.schema.json
- ops/docs/contracts/ghl-event.schema.json

Stories (Phase 1)
- #33 ONB-06-02 — Client info form and validation
- #34 ONB-06-03 — Template registry selection page
- #35 ONB-06-04 — Template customization with variables and optional LLM
- #36 ONB-06-05 — Deployment plan generation and review
- #37 ONB-06-06 — Deployment execution and tracking with feature flags
- #38 ONB-06-07 — Webhook ingress and callback validation
- #40 ONB-06-08 — Observability and audit for onboarding wizard
- #39 ONB-06-09 — QA CI and contract tests for onboarding wizard

Quality gates (applies to all stories)
- Lint: ESLint max warnings = 0
- Types: type-check clean
- Coverage: ≥95% line and branch
- Contracts: validate adapter I/O against JSON Schemas in CI
- Boundaries: ports/adapters only; no inline SQL
- Observability: structured logs with correlation IDs; audit sensitive actions; no secrets in logs

Handoffs and traceability
- Use issue comments for progress and decisions; link PRs with Fixes #<N>.
- Keep docs small and focused; this file is an index. Update links as stories/PRs evolve.

# README — Phase 1 Detailed Specs Index

This index links to detailed, developer-ready specs for each Phase 1 component.

- IAM (MVP)
  - Spec: iam.md
- Prompt Service (MVP)
  - Spec: prompt-svc.md
- Webhook Ingress (MVP)
  - Spec: webhook-ingress.md
- Declarative Orchestrator & Flow Schema (MVP)
  - Spec: orchestrator.md
- Billing-Usage (Retell collector first)
  - Spec: billing-usage.md
- Payments (Stripe adapter MVP)
  - Spec: payments.md
- Portal UI/UX (shell, wizards, connect accounts)
  - Spec: portal-ui.md
