# Coding standards (canonical)

Purpose
Provide clear, enforceable guidance so coders (human and AI) produce small, testable, maintainable code that fits our architecture and CI gates.

General principles
- Single Responsibility: each module/function/class does one thing; prefer composition over large multi‑purpose units.
- **Separation of Concerns**: strictly separate UI/presentation, business logic, and data access layers. UI handles rendering and user interaction; business logic contains domain rules and workflows; data access manages persistence and external APIs.
- Small, testable units: design functions with explicit inputs/outputs; avoid hidden global state; maximize pure logic.
- Refactor continuously: if a function exceeds thresholds (below), split it and add unit tests for the extracted logic.
- Defensive boundaries: validate inputs at API/adapter edges; keep domain logic free of IO concerns.
- Ports & adapters: domain depends on ports; all external IO (DB, HTTP, queues) behind adapters; no inline SQL in services/controllers.
- Immutability by default: avoid in‑place mutation; return new values; reduce side effects.

**ARCHITECTURAL LAYER SEPARATION (MANDATORY):**
Maintain strict separation between UI, business logic, and data layers:

- **UI/Presentation Layer**: Handles rendering, user interaction, and view logic only. No business rules or data access.
  - Components render data passed as props
  - Event handlers dispatch actions or call business services
  - No direct API calls or database queries
  - No business validation logic

- **Business Logic Layer**: Contains domain rules, workflows, and application logic. Pure functions where possible.
  - Validates business rules and constraints
  - Orchestrates complex operations across multiple data sources
  - Transforms data between external and internal formats
  - No direct UI manipulation or rendering
  - No direct database queries or external API calls

- **Data Access Layer**: Manages persistence, external APIs, and data retrieval.
  - Repository/adapter patterns for data operations
  - Connection pooling, caching, and optimization
  - Data validation and sanitization
  - No business logic or UI concerns

**Layer Violation Examples:**
```typescript
// ❌ BAD: UI component with business logic
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Business logic in UI: validation, transformation
    if (userId && userId.length > 5) {
      fetch(`/api/users/${userId}`)
        .then(data => {
          // Data transformation in UI
          const transformed = { ...data, fullName: `${data.firstName} ${data.lastName}` };
          setUser(transformed);
        });
    }
  }, [userId]);
  
  return <div>{user?.fullName}</div>;
}

// ✅ GOOD: Clean separation
function UserProfile({ user }) {
  return <div>{user.fullName}</div>; // Pure presentation
}

// Business logic in service
class UserService {
  async getUser(userId: string): Promise<User> {
    if (!userId || userId.length <= 5) throw new ValidationError('Invalid user ID');
    const data = await this.userRepository.getById(userId);
    return {
      ...data,
      fullName: `${data.firstName} ${data.lastName}` // Business transformation
    };
  }
}

// Data access in repository
class UserRepository {
  async getById(id: string): Promise<UserData> {
    return await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}
```

Size and complexity thresholds
- Function length: target ≤ 30 LOC; hard cap ≤ 60 LOC (mandatory refactor if exceeded).
- Cyclomatic complexity: target ≤ 10; hard cap ≤ 15 (add tests and refactor if exceeded).
- File/module size: prefer ≤ 300 LOC; split into submodules when it grows beyond 500 LOC.

Testing & linting requirements
- Linting/formatting: ESLint + Prettier. Warnings are treated as errors in CI (eslint --max-warnings 0). Do not ignore rules globally; use targeted disables only with justification and an issue link.
  - Local: run npm run lint and npm run lint:fix before pushing.
  - CI: run eslint --max-warnings 0; PRs may not introduce new warnings.
- Unit tests: every logical unit has fast unit tests covering happy/edge paths.
- Integration tests: repository/adapter logic tested with real dependencies (e.g., test DB via containers).
- Contract tests: adapter I/O validated against JSON Schemas.
- E2E: critical user flows; smoke suite runs on every PR; full nightly suite.
- Coverage: global and changed packages ≥ 95% lines/branches; enforce in CI.

**AUTOMATED BUILD/TEST WORKFLOW (MANDATORY):**
Before marking any development task complete, agents MUST automatically execute:
```bash
npm run lint --fix          # Auto-fix formatting issues
npm run build              # Verify compilation succeeds  
npm run detect-stubs       # Identify unimplemented methods
npm run test               # Run full test suite
npm run test:coverage      # Validate ≥95% coverage
```
If ANY command fails, task remains incomplete. Do not commit broken code.

**FRONTEND DEVELOPMENT REQUIREMENTS (MANDATORY):**
For frontend development tasks, agents MUST additionally execute:
```bash
npm run test:components     # Component-specific tests (if available)
npm run test:accessibility  # Accessibility compliance tests (if available)
npm run build:analyze       # Bundle size analysis (if available)
npm run test:e2e:smoke      # Smoke E2E tests for critical user flows (if specified by architect)
```

**Frontend Quality Gates:**
- **Accessibility Compliance**: WCAG 2.1 AA minimum standards
- **Responsive Design**: Mobile-first approach with specified breakpoints
- **Performance Budget**: Meet architect-specified performance targets
- **Design System Usage**: 100% usage of established design system components
- **Cross-browser Support**: Support specified browser matrix
- **Component Testing**: Unit tests for all components, integration tests for critical flows
- **Functional UI Focus**: Implement functional requirements per ui-ux-responsibility-boundaries.md (no visual design without human designer approval)
