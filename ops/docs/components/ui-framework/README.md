# UI Framework Component Specification

**Component**: UI Framework  
**Status**: Active  
**Owner**: architect.morgan-lee  
**Last Updated**: 2025-10-20

## Purpose

This directory contains the complete specification for the MaxAI Platform UI framework, including Next.js 14, React 18, shadcn/ui, and supporting libraries.

## Quick Navigation

| Document | Purpose | Lines |
|----------|---------|-------|
| [overview.md](./overview.md) | Technology stack, rationale, high-level design | ~100 |
| [installation.md](./installation.md) | Dependencies, configuration files, setup steps | ~150 |
| [structure.md](./structure.md) | Folder layout, file organization, conventions | ~100 |
| [patterns.md](./patterns.md) | Component patterns, shadcn/ui examples | ~150 |
| [integration.md](./integration.md) | RBAC integration, API connections, security | ~100 |
| [testing.md](./testing.md) | Test strategy, unit/integration/a11y tests | ~100 |
| [migration.md](./migration.md) | Migration phases, rollout plan | ~100 |

**Total**: ~800 lines across 7 focused documents (was 783 lines in 1 mega-doc)

## Related Documentation

- **Architecture**: [ops/docs/architecture/layers/presentation.md](../../architecture/layers/presentation.md)
- **ADR**: [ops/docs/adr/adr-0011-ui-framework-selection.md](../../adr/adr-0011-ui-framework-selection.md)
- **Implementation**: [ops/docs/implementation/phase-1/ui-framework/](../../implementation/phase-1/ui-framework/)
- **Tracker Issue**: [#129 - ARCH-UI-01: NX Library Structure Setup](https://github.com/raming/max-ai-platform/issues/129)

## Layer Mapping

This component implements the **Presentation Layer** per our layered architecture:

```
┌─────────────────────────────────────┐
│   Presentation Layer (This Doc)     │
│   - Next.js App Router              │
│   - React Components (shadcn/ui)    │
│   - Client State (Zustand)          │
│   - Server State (TanStack Query)   │
└─────────────────────────────────────┘
            ↓ API Calls
┌─────────────────────────────────────┐
│   Business Logic Layer               │
│   (See: components/api-gateway/)    │
└─────────────────────────────────────┘
```

## Reading Guide

### For AI Agents Implementing UI
1. Start with **overview.md** - understand the tech stack
2. Read **installation.md** - get environment set up
3. Read **structure.md** - understand folder organization
4. Read **patterns.md** - implement components correctly
5. Refer to **integration.md** - connect to backend
6. Follow **testing.md** - ensure quality

### For Architects Reviewing
1. Review **overview.md** - verify technology choices
2. Check **integration.md** - validate layer separation
3. Review **testing.md** - ensure coverage strategy

### For QA Testing
1. Read **testing.md** - understand test requirements
2. Refer to **patterns.md** - know expected behaviors
3. Use **integration.md** - understand API contracts

## Key Principles

1. **Layer Separation**: UI components MUST NOT contain business logic
2. **Type Safety**: All props and state must be fully typed
3. **Accessibility**: WCAG 2.1 AA compliance mandatory
4. **Performance**: Core Web Vitals targets must be met
5. **Security**: XSS prevention, CSP headers, RBAC enforcement

## Change History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-20 | 2.0 | Split mega-doc into focused components | architect.morgan-lee |
| 2025-10-14 | 1.0 | Initial specification | architect.morgan-lee |

## Compliance

- ✅ Complies with `rules/folder-structure-best-practices.md`
- ✅ Complies with `rules/documentation-best-practices.md`
- ✅ One-component-one-directory principle
- ✅ Layer specifications complete (presentation layer)
- ✅ Cross-references to related docs

---

**Related Issues**: #129, #147  
**Related ADRs**: adr-0011-ui-framework-selection  
**Tracker**: ops/tracker/specs/ARCH-08.md
