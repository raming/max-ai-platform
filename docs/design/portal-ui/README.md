# Portal UI Component Architecture

## Purpose

Customer-facing web portal built with Next.js 14 App Router for client onboarding, agent management, usage monitoring, and billing. Provides responsive, accessible interface with real-time updates and RBAC-protected features.

## Documentation Index

| Document | Purpose | Key Topics |
|----------|---------|------------|
| [Overview](./overview.md) | Next.js architecture & component hierarchy | App Router, layout structure, design system |
| [Features](./features.md) | Portal feature specifications | Onboarding wizard, dashboards, connections, settings |
| [State Management](./state-management.md) | Client & server state patterns | Zustand stores, TanStack Query, caching |
| [Routing](./routing.md) | App Router structure & auth | Routes, middleware, auth guards, navigation |
| [Integration](./integration.md) | Backend API integration | API client, RBAC, error handling, loading states |

## Quick Reference

**Tech Stack:**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (client state), TanStack Query (server state)
- **Auth**: NextAuth.js with JWT strategy
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright

**Core Features:**
- Multi-step onboarding wizard with deployment generator
- Client connection management (GHL, Retell, Twilio)
- Usage dashboards with real-time metrics
- Billing portal with invoice history
- Settings & account management
- RBAC-protected admin features

**NFRs:**
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Lighthouse score: ≥ 90 (Performance, Accessibility, Best Practices)
- Mobile-first responsive design (breakpoints: 640px, 768px, 1024px, 1280px)
- WCAG 2.1 AA compliance

**Related Documentation:**
- [IAM Component](../iam/README.md) - Authentication & authorization
- [Billing-Usage](../billing-usage/README.md) - Usage metrics & reporting
- [Payments](../payments/README.md) - Subscription & billing
- [Implementation Spec](../impl/phase-1/portal-ui.md) - Development tasks
