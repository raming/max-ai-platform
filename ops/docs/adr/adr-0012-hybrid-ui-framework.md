# ADR-0012: Hybrid UI Framework with Metronic Inspiration and Placeholder Strategy

Status: Proposed
Date: 2025-10-10
Deciders: Architecture Team (architect.morgan-lee)
Consulted: Product Team, Development Team
Status: Approved

## Context

Following the evaluation of Metronic theme (ADR-0011 evaluation) and user requirements for early visibility into application structure, we need to establish a hybrid UI approach that combines the accessibility and maintainability of shadcn/ui with strategic inspiration from Metronic's enterprise dashboard patterns. The platform requires:

1. **Early Structural Visibility**: Stakeholders need to see the overall application skeleton and navigation patterns before deep feature implementation
2. **Reusable Component Architecture**: Cross-project component sharing via NX libraries
3. **Rich Content Editing**: Quill.js integration for content-heavy features
4. **Enterprise Dashboard Patterns**: Professional layouts for billing, user management, and analytics
5. **Clean Separation**: UI components remain backend-agnostic with props-based data flow

## Decision

Adopt a **Hybrid UI Framework** combining shadcn/ui foundation with Metronic-inspired enterprise patterns, implementing a **Placeholder-First Development Strategy**.

### Core Technology Stack (Unchanged from ADR-0011)
- **Framework**: Next.js 14 with App Router
- **React Version**: React 18 with Server Components
- **UI Components**: shadcn/ui with Tailwind CSS
- **Client State**: Zustand
- **Server State**: TanStack Query

### Hybrid Enhancements
1. **Metronic-Inspired Layout Patterns**:
   - Multi-level sidebar navigation with collapsible sections
   - Top-bar with user profile, notifications, and quick actions
   - Breadcrumb navigation with contextual actions
   - Dashboard grid layouts with stats cards and data tables

2. **Placeholder-First Development**:
   - Skeleton components for all major application sections
   - Mock data structures with clear "MOCK" indicators
   - Responsive layouts that demonstrate intended UX patterns
   - TypeScript interfaces defining expected data contracts

3. **NX Library Architecture**:
   - `libs/ui/components`: Core shared components
   - `libs/ui/editor`: Quill.js rich text editor
   - `libs/ui/layouts`: Dashboard and navigation layouts
   - `libs/ui/forms`: Enterprise form patterns

### Application Skeleton Structure

#### Core Layout Components
```
├── Sidebar
│   ├── Main Navigation (Dashboard, Users, Billing, etc.)
│   ├── User Profile Section
│   └── Collapsible Sections
├── TopBar
│   ├── Breadcrumbs
│   ├── User Menu (Profile, Settings, Logout)
│   ├── Notifications
│   └── Search/Global Actions
├── Main Content Area
│   ├── Page Header (Title, Actions, Filters)
│   ├── Content Grid/Table
│   └── Pagination/Footer
```

#### Placeholder Pages Required
1. **Authentication**: Sign-in/Sign-up with form validation
2. **Dashboard**: Stats overview with charts and recent activity
3. **User Profile**: Account settings and preferences
4. **Billing & Plans**: Subscription management and invoices
5. **User Management**: User list with roles and permissions
6. **Settings**: Application and account configuration

### Quill.js Integration Strategy

Create dedicated NX library `libs/ui/editor` with:
- TypeScript-first Quill.js wrapper
- Theme integration with Tailwind/shadcn design system
- Content validation and sanitization
- Export capabilities (HTML, Markdown, JSON)
- Accessibility compliance (WCAG 2.1 AA)

## Implementation Phases

### Phase 1: Foundation (Week 1)
- NX library structure setup
- Core layout components (Sidebar, TopBar, MainContent)
- Basic placeholder pages with mock data
- Quill.js library integration

### Phase 2: Enhancement (Week 2)
- Advanced layout patterns (dashboards, forms, tables)
- Interactive placeholders with state management
- Component theming and responsive design
- Basic routing and navigation

### Phase 3: Integration (Week 3)
- API integration points preparation
- Form validation and error handling
- Loading states and empty states
- Accessibility testing and fixes

### Phase 4: Polish (Week 4)
- Performance optimization
- Comprehensive testing
- Documentation and Storybook
- Production readiness assessment

## Consequences

### Positive
- **Early Visibility**: Stakeholders can see application structure and UX patterns immediately
- **Accelerated Development**: Placeholder foundation enables parallel feature development
- **Consistency**: Metronic-inspired patterns provide professional enterprise feel
- **Maintainability**: shadcn/ui foundation ensures long-term component health
- **Reusability**: NX libraries enable cross-project component sharing

### Negative
- **Initial Complexity**: Hybrid approach requires careful balance of inspiration vs. implementation
- **Bundle Size**: Additional layout components may increase initial load
- **Maintenance Overhead**: Custom implementations require ongoing updates vs. off-the-shelf themes

### Risks
- **Scope Creep**: Placeholder strategy could expand beyond intended boundaries
- **Design Drift**: Metronic inspiration might conflict with shadcn/ui principles
- **Performance Impact**: Rich layouts may affect mobile performance if not optimized

### Dependencies
- Requires NX workspace fully initialized
- Depends on ADR-0011 UI Framework implementation
- Requires design system tokens established
- Depends on authentication and routing foundation

## Alternatives Considered

### Pure Metronic Implementation
- **Pros**: Complete enterprise theme, faster initial setup
- **Cons**: Heavy bundle size, coupling concerns, limited customization, conflicts with ADR-0011

### Custom Dashboard Framework
- **Pros**: Full control, optimized for specific needs
- **Cons**: High development cost, longer timeline, potential inconsistency

### Enhanced shadcn/ui Only
- **Pros**: Maintains architectural purity, smaller bundle
- **Cons**: Lacks enterprise dashboard patterns, requires more custom development

## Compliance and Requirements

### Accessibility (WCAG 2.1 AA)
- All components must support keyboard navigation
- Color contrast ratios maintained
- Screen reader support for dynamic content
- Focus management in complex layouts

### Security
- No sensitive data in placeholder content
- XSS protection in Quill.js integration
- CSRF protection for forms
- Input validation and sanitization

### Performance
- Initial bundle < 200KB gzipped
- Lighthouse score > 90
- Mobile-first responsive design
- Lazy loading for heavy components

## References

- ADR-0011: UI Framework Selection
- ops/docs/design/ui-framework-spec.md
- ADR-0008: Security/Compliance Baseline
- NX Workspace Guidelines: client/docs/nx-foldering.md

## Success Metrics

- **Structural Completeness**: All major application sections have placeholder implementations
- **Visual Consistency**: Professional enterprise appearance across all pages
- **Developer Experience**: Clear component APIs and TypeScript contracts
- **Performance**: < 3s initial load time, > 90 Lighthouse score
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Reusability**: Components successfully shared across projects

## Implementation Notes

### Mock Data Strategy
- All placeholder data clearly marked as "MOCK"
- TypeScript interfaces define real data contracts
- Mock services provide consistent data patterns
- Easy identification for replacement with real APIs

### Component Architecture
- Props-based data flow (ports/adapters compliance)
- Separation of presentation and business logic
- Reusable across different application contexts
- Type-safe component APIs

### Testing Strategy
- Unit tests for component logic
- Integration tests for layout interactions
- E2E tests for critical user journeys
- Accessibility tests automated in CI

---

*This ADR establishes the foundation for a hybrid UI approach that balances enterprise requirements with architectural principles, enabling early visibility while maintaining long-term maintainability.*</content>
<parameter name="filePath">/Users/rayg/repos/max-ai/platform/ops/docs/adr/adr-0012-hybrid-ui-framework.md