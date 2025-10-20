# Portal UI/UX (MVP) — Extreme Detail Spec

Purpose
Deliver a production-ready portal shell with onboarding/connect-account wizards, usage/billing overview, and integrations catalog following the chosen stack and strict quality gates.

Stack
- Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Radix) + Tremor + TanStack Table + React Hook Form + Zod
- State: Zustand (client) + TanStack Query (server)

Architecture
- Layout: root layout with theme provider, auth boundary, error boundary, and Suspense
- Data fetching: server actions + REST adapters; cache keys include tenant/client
- Feature flags: useFeatureFlag/useFeatureFlags hooks to guard routes/components

Pages & flows (priority order)
1) Connect Accounts — OAuth buttons (Google/Microsoft), Retell/Twilio/GHL proxy; status badges; error handling and retries
2) Client Onboarding Wizard — steps: client info → providers → webhooks → review (schema-validated via Zod)
3) Usage & Billing Overview — subscription + included allowances + usage-to-date; chart with Tremor
4) Integrations Catalog — enable/disable adapters; per-tenant bindings; RBAC gating
5) Templates & Prompts — list/edit instances, publish flow; diff view
6) Settings & Audit — token management (admin), audit log

Components
- AppShell, Nav, Breadcrumbs, ThemeToggle; Stepper; Form components bound to Zod; Tables; Charts; Toaster
- Accessibility: leverage Radix primitives; role/aria attributes; keyboard navigation

Security/compliance
- Auth boundary: redirect unauthenticated users; SSR checks
- RBAC guards on routes and actions; no secrets/PII in logs
- Token proxy: no provider tokens in browser; all calls via api-gateway

Observability
- Frontend logs to console with redaction; backend via gateway
- Metrics: Web Vitals (TTFB, LCP, CLS, INP) reported to analytics
- Tracing: propagate correlation_id from gateway to UI (request-id header) and log it on actions

NFRs & performance budgets
- Initial load: < 200KB gzipped for critical path; Lighthouse PWA/Perf/Best Practices/Security ≥ 90
- A11y score ≥ 95; keyboard navigation on forms/wizards
- Render latency: TTI < 3.5s on 4x CPU slowdown; interaction latency < 200ms

Testing strategy
- Unit: components via RTL; forms with Zod resolvers; coverage ≥95%
- Integration: page-level tests for wizards; mock server responses
- E2E: Playwright flows for Connect Accounts and Onboarding; a11y checks (axe)
- Storybook: key components with stories and a11y addons

Acceptance criteria
- Shell compiles; dark mode; auth boundary enforced; feature flags guard routes
- Two wizards implemented with validation and server calls
- a11y checks pass in CI; coverage ≥95%; Web Vitals meet budgets
