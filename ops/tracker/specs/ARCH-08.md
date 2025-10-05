# ARCH-08 — UI/UX Framework and Portal Scaffolding

Summary
Standardize the UI/UX stack and scaffold the portal shell with a high-quality template.

Recommendation
- Main stack: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Radix) + Tremor (charts) + TanStack Table + RHF + Zod
- Templates: TailAdmin dashboard shell or Mosaic/Notus/Windmill as starting shells (replace components with shadcn/ui)
- Alternatives: Ant Design Pro for fast enterprise admin; React Admin for CRUD-heavy internal ops

Scope
- Choose template shell and import into apps/portal-web
- Establish design tokens, theming (dark mode), and layout/navigation patterns
- Set up forms, tables, charts, toasts, and wizards aligned with declarative flows
- Testing and a11y: Playwright e2e, RTL unit tests, Storybook, ESLint warnings as errors

Outputs
- Portal shell with navigation and auth boundary
- Two wizards: Client onboarding and Connect accounts
- Component catalog baseline in Storybook

Acceptance criteria
- U1: Portal shell compiles; dark mode and basic navigation present
- U2: Onboarding and Connect flows scaffolded with RHF+Zod and shadcn/ui
- U3: Storybook published with at least forms, table, chart examples
- U4: CI a11y checks run for key pages

References
- docs/release/phase-1.md (UI/UX Stack and Templates section)
- docs/design/architecture-overview.md
