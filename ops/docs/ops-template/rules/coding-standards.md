# Coding standards (canonical)

Purpose
Provide clear, enforceable guidance so coders (human and AI) produce small, testable, maintainable code that fits our architecture and CI gates.

General principles
- Single Responsibility: each module/function/class does one thing; prefer composition over large multi‑purpose units.
- Small, testable units: design functions with explicit inputs/outputs; avoid hidden global state; maximize pure logic.
- Refactor continuously: if a function exceeds thresholds (below), split it and add unit tests for the extracted logic.
- Defensive boundaries: validate inputs at API/adapter edges; keep domain logic free of IO concerns.
- Ports & adapters: domain depends on ports; all external IO (DB, HTTP, queues) behind adapters; no inline SQL in services/controllers.
- Immutability by default: avoid in‑place mutation; return new values; reduce side effects.

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

Error handling
- Fail fast at boundaries; convert unchecked errors to typed domain/application errors.
- Do not use exceptions for control flow; return typed results where appropriate.
- Always attach a correlation/request ID to error contexts; include actionable fields.
- Never swallow errors; either handle locally with a clear recovery path or propagate with context.

Coding practices
- Naming: use descriptive, intention‑revealing names; avoid abbreviations; consistent casing per language.
- Parameters: avoid long parameter lists; prefer a typed options object; validate at the edge.
- Dependency injection: inject collaborators; avoid new inside domain logic; enable mocking in tests.
- Side effects: isolate IO and time; pass time/clock sources for determinism in tests.
- Concurrency: prefer safe abstractions (queues/promises/workers); protect shared state with atomic ops; avoid ad‑hoc locks.

**STUB METHOD TRACKING (MANDATORY FOR AI AGENTS):**
AI agents MUST mark all unimplemented prototype methods with standardized annotations. This ensures scaffolding code is tracked and revisited when features are implemented.

**Marking Unimplemented Methods:**
```typescript
// For TypeScript/JavaScript
function processUserData(userId: string): UserData {
  throw new NotImplementedError('processUserData: User data processing logic not yet implemented');
}

// For Python
def process_user_data(user_id: str) -> UserData:
    raise NotImplementedError("process_user_data: User data processing logic not yet implemented")

// For Go
func ProcessUserData(userId string) (*UserData, error) {
    return nil, fmt.Errorf("ProcessUserData: user data processing logic not yet implemented")
}
```

**Standardized Error Messages:**
- Format: `{MethodName}: {Brief description} not yet implemented`
- Include method name for easy identification
- Provide context about what the method should do

**Detection and Testing:**
- CI will automatically detect stub methods using `npm run detect-stubs`
- Tests MUST cover all non-stub methods (stubs are excluded from coverage requirements)
- Stub methods are logged during test runs for visibility

**Practical Examples:**

```typescript
// ✅ GOOD: Properly marked stub method
export async function processPayment(orderId: string, amount: number): Promise<PaymentResult> {
  throw new NotImplementedError('processPayment: Payment processing integration not yet implemented - requires Stripe/PayPal setup');
}

// ❌ BAD: Unmarked stub (will be missed)
export async function processPayment(orderId: string, amount: number): Promise<PaymentResult> {
  return { success: false, error: 'Not implemented' }; // Silent failure
}

// ✅ GOOD: Python stub
def validate_user_permissions(user_id: str, resource: str) -> bool:
    raise NotImplementedError("validate_user_permissions: Permission validation logic not yet implemented - requires role-based access control")

// ✅ GOOD: Go stub
func (s *UserService) UpdateProfile(ctx context.Context, userID string, updates UserUpdates) error {
    return fmt.Errorf("UpdateProfile: user profile update logic not yet implemented - requires database schema changes")
}
```

**When to Use Stub Methods:**
- During initial scaffolding/architecture setup
- When implementing features incrementally
- When external dependencies (APIs, databases) are not yet available
- For placeholder methods in interfaces/abstract classes

**When NOT to Use Stub Methods:**
- For methods that should be fully implemented in the current task
- For critical path functionality required for the feature to work
- When the implementation is straightforward and doesn't require external dependencies
- PR hygiene: small, single‑purpose PRs; reference issues; include tests and docs; pass CI gates.

Performance & memory
- Measure before optimizing; add SLO‑oriented performance tests when needed.
- Avoid N+1 queries; batch/stream where appropriate; paginate list endpoints by default.

Security & privacy
- Validate and sanitize inputs at edges; never log secrets/PHI; centralize secret access in a manager.
- Use least privilege; prefer short‑lived tokens; rotate keys; adhere to compliance ADRs.

Review checklist (maintainers)
- Does the change reduce complexity and improve testability?
- Are sizes/thresholds respected (or refactor committed alongside)?
- Are ports/adapters boundaries intact; no inline SQL in services/controllers?
- Are errors/edge cases handled and logged with correlation IDs?
- Are tests present, meaningful, and coverage maintained ≥ 95%?
