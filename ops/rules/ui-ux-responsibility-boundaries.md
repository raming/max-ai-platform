# UI/UX Responsibility Boundaries (canonical)

Purpose
Define clear boundaries between architect functional UI specification and frontend developer implementation, ensuring AI agents can effectively handle frontend development without visual design capabilities.

## Responsibility Matrix

### Architect Responsibilities
**Functional UI Specification:**
- Define required UI components and their purposes
- Specify component hierarchy and data flow
- Define user interaction patterns and workflows
- Specify accessibility requirements (WCAG levels)
- Define responsive behavior and breakpoints
- Specify design system usage and component patterns
- Define form validation and error handling patterns

**Architect Escalation Triggers:**
- Visual design decisions (colors, typography, spacing)
- Detailed UX patterns and micro-interactions
- Brand-specific styling requirements
- User research or usability testing needs
- Complex animation or transition requirements

### Frontend Developer Responsibilities
**Functional UI Implementation:**
- Implement components using specified design system
- Build responsive layouts following architect breakpoints
- Implement accessibility features per WCAG specifications
- Create component composition and state management
- Implement form validation and error handling
- Build user interaction patterns as specified
- Optimize performance and bundle size
- Implement cross-browser compatibility

**Developer Escalation Triggers:**
- Unclear functional requirements
- Missing component specifications
- Conflicting interaction patterns
- Design system gaps or limitations
- Performance requirements that conflict with functionality

## AI Agent Considerations

### Visual Design Limitations
- AI agents cannot create or evaluate visual designs
- AI agents cannot assess UX usability or aesthetics
- AI agents must rely on established design systems and patterns
- AI agents should escalate visual design decisions to human designers

### Functional UI Focus
- Emphasize functional completeness over visual polish
- Prioritize accessibility and usability over aesthetics
- Use established design patterns for consistency
- Focus on component reusability and maintainability

## Workflow Integration

### Specification Phase
1. **Architect**: Defines functional UI requirements and component structure
2. **Team Lead**: Reviews specifications for completeness and AI agent readiness
3. **QA**: Validates specifications include testing requirements

### Implementation Phase
1. **Frontend Dev**: Implements functional UI using design system components
2. **QA**: Tests functionality, accessibility, and responsive behavior
3. **Architect**: Reviews implementation for architectural compliance

### Design Escalation
1. **Identify**: Visual design needs beyond functional UI
2. **Escalate**: Architect flags to human designer with context
3. **Block**: Implementation waits for design approval
4. **Implement**: Frontend dev implements approved visual designs

## Quality Gates

### Functional UI Completion
- [ ] All specified components implemented
- [ ] Responsive behavior works across breakpoints
- [ ] Accessibility requirements met
- [ ] Form validation and error handling functional
- [ ] Component composition follows patterns
- [ ] Performance requirements met

### Visual Design Readiness
- [ ] Human designer has reviewed and approved visual aspects
- [ ] Design system usage validated
- [ ] Brand compliance confirmed
- [ ] Cross-browser visual consistency verified

## Success Metrics

- **Functional Completeness**: 100% of specified UI functionality implemented
- **Accessibility Compliance**: WCAG AA standards met
- **Performance Targets**: Meet architect-specified performance budgets
- **Design System Usage**: 95%+ usage of established components
- **Escalation Rate**: <10% of tasks require visual design escalation