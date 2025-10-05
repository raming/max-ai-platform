# Portal UI/UX (MVP) — Detailed Spec

Purpose
Deliver a usable portal shell with onboarding/connect-account wizards, usage/billing overview, and integrations catalog using the chosen stack.

Stack
- Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Radix) + Tremor + TanStack Table + React Hook Form + Zod

Pages & flows (priority order)
1) Connect Accounts (Google, Microsoft, Retell, Twilio, GHL proxy) — OAuth buttons, status badges
2) Client Onboarding Wizard — multi-step: client info → providers → webhooks → review
3) Usage & Billing Overview — subscription, included allowances, usage-to-date
4) Integrations Catalog — enable/disable adapters; per-tenant bindings
5) Templates & Prompts — list/edit instances, publish flow
6) Settings & Audit — token management (admin), audit log

Components
- Auth boundary, app shell/nav, steppers, forms (RHF/Zod), tables, charts, toasts, banners

Testing
- Playwright e2e for wizards; RTL for forms; Storybook for components; a11y checks

Acceptance criteria
- Shell compiles; dark mode; auth boundary enforced
- Two wizards implemented with validation; flows hit real backend stubs
- a11y checks pass in CI; coverage ≥95%
