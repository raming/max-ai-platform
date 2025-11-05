# UI Framework Overview

**Component**: UI Framework  
**Layer**: Presentation  
**Status**: Active  
**Last Updated**: 2025-10-20

## Purpose

Define the technology stack and architecture for the MaxAI Platform portal's user interface layer.

## Technology Stack

### Core Framework
- **Next.js 14** (App Router)
  - Server Components for performance
  - Streaming and Suspense support
  - Built-in optimization (images, fonts, scripts)
  
- **React 18**
  - Concurrent rendering
  - Automatic batching
  - Transitions for responsive UI

### UI Component Library
- **shadcn/ui** + **Radix UI**
  - Accessible primitives (WCAG 2.1 AA)
  - Unstyled components with full control
  - Copy-paste components (no package dependency)
  
- **Tailwind CSS**
  - Utility-first styling
  - Dark mode support
  - Responsive design patterns
  - Custom theme system

### State Management

#### Client State
- **Zustand**
  - Minimal boilerplate
  - No context provider needed
  - TypeScript-first
  - Middleware support (persist, devtools)

#### Server State
- **TanStack Query** (React Query)
  - Automatic caching and synchronization
  - Background refetching
  - Optimistic updates
  - Infinite queries and pagination

## Design Principles

### 1. Layer Separation (CRITICAL)
UI components MUST NOT contain:
- Business logic or validation
- Direct API calls or data access
- Complex state management

**Pattern**: Presentation (UI) → Business Logic (hooks) → Data Access (queries)

See: [ops/docs/components/ui-framework/integration.md](./integration.md) for detailed layer architecture.

### 2. Accessibility First
- WCAG 2.1 AA compliance mandatory
- Keyboard navigation support
- Screen reader optimization
- Focus management
- ARIA attributes

### 3. Performance Targets
- **Initial Load**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Lighthouse Score**: > 90
- **Core Web Vitals**: All green

### 4. Type Safety
- Full TypeScript coverage
- Strict mode enabled
- No `any` types without justification
- Props interfaces for all components

### 5. Security
- XSS prevention (sanitized inputs)
- CSP headers enforcement
- No sensitive data in client state
- Secure cookie handling

## Architecture Overview

```
┌────────────────────────────────────────────┐
│         Next.js App Router                 │
│  (Server Components + Client Components)   │
└────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│    UI Components (Presentation Layer)      │
│    - shadcn/ui primitives                  │
│    - Custom components                     │
│    - Layout components                     │
└────────────────────────────────────────────┘
                    ↓
┌─────────────────┬──────────────────────────┐
│  Client State   │   Server State           │
│  (Zustand)      │   (TanStack Query)       │
└─────────────────┴──────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│         Business Logic Layer               │
│  (Custom hooks, services, validation)      │
└────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│          Data Access Layer                 │
│   (API clients, query hooks, adapters)     │
└────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────┐
│            Backend API                     │
│     (RBAC, feature flags, services)        │
└────────────────────────────────────────────┘
```

## Key Features

### Multi-Tenancy Support
- Tenant context propagation
- Tenant-specific theming
- Isolated data access
- Tenant-scoped feature flags

### RBAC Integration
- Role-based component rendering
- Permission checks in layouts
- Protected routes
- Conditional navigation

### Feature Flags
- UI gating per flag state
- Progressive rollout support
- A/B testing capability
- Environment-aware flags

### Observability
- Correlation ID propagation
- Error boundary logging
- Performance monitoring
- User action tracking

## Non-Functional Requirements

| Requirement | Target | Enforcement |
|-------------|--------|-------------|
| Accessibility | WCAG 2.1 AA | axe-core in CI |
| Performance | Lighthouse > 90 | CI performance budget |
| Bundle Size | < 250KB gzipped | Webpack analyzer |
| Test Coverage | > 80% components | Jest coverage |
| Type Safety | 100% TypeScript | Strict mode |
| Lint Clean | 0 warnings | ESLint --max-warnings 0 |

## Technology Rationale

### Why Next.js 14?
- **Server Components**: Reduce client bundle size
- **App Router**: Better routing and layouts
- **Built-in optimization**: Images, fonts, scripts
- **Streaming**: Faster initial page loads
- **TypeScript**: First-class support

### Why shadcn/ui over Component Libraries?
- **Full control**: Copy components, customize freely
- **No dependency lock-in**: No package updates to manage
- **Accessibility**: Built on Radix UI primitives
- **Tailwind integration**: Native styling approach
- **Bundle size**: Only include what you use

### Why Zustand over Redux?
- **Minimal boilerplate**: Less ceremony, faster development
- **No providers**: Direct store access
- **TypeScript-first**: Better type inference
- **Middleware**: Easy persistence and devtools
- **Bundle size**: Tiny (~1KB gzipped)

### Why TanStack Query?
- **Cache management**: Automatic staleness handling
- **Background sync**: Keep data fresh
- **Optimistic updates**: Better UX
- **Devtools**: Excellent debugging
- **TypeScript**: Full type safety

## Migration from Previous Stack

If migrating from an existing UI framework:

1. **Parallel implementation**: Build new alongside old
2. **Route-by-route migration**: Migrate one page at a time
3. **Shared components**: Gradual component replacement
4. **Feature flag gating**: Control rollout
5. **Performance monitoring**: Track metrics during migration

## Related Documentation

- **Installation Guide**: [installation.md](./installation.md)
- **Project Structure**: [structure.md](./structure.md)
- **Component Patterns**: [patterns.md](./patterns.md)
- **Layer Integration**: [integration.md](./integration.md)
- **Testing Strategy**: [testing.md](./testing.md)
- **Migration Plan**: [migration.md](./migration.md)

## References

- **ADR**: [ops/docs/adr/adr-0011-ui-framework-selection.md](../../adr/adr-0011-ui-framework-selection.md)
- **Tracker Spec**: [ops/tracker/specs/ARCH-08.md](../../../tracker/specs/ARCH-08.md)
- **Tracker Issue**: [#129 - ARCH-UI-01](https://github.com/raming/max-ai-platform/issues/129)
- **Architecture Layer**: [ops/docs/architecture/layers/presentation.md](../../architecture/layers/presentation.md)

---

**Compliance**: One-file-one-topic ✅ | Focused scope ✅ | < 300 lines ✅  
**Related Issues**: #129, #147  
**Last Review**: 2025-10-20 by architect.morgan-lee
