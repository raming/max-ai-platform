# Coding standards (canonical)

Purpose
Provide clear, enforceable guidance so coders (human and AI) produce small, testable, maintainable code that fits our architecture and CI gates.

IAM foundation (Keycloak + Casbin) — Definition of Ready gates (MANDATORY)
- AuthN: All protected endpoints must verify OIDC JWTs using OIDC discovery and JWKS from Keycloak. Validate iss/aud/exp/nbf and required claims (sub, tenant).
- AuthZ: All protected endpoints must enforce authorization via Casbin (enforce(subject, resource, action, context)). Policies must live in-repo and be reviewed in PRs.
- Contracts: JSON Schemas must exist and be referenced for token claims and authz request/response. Contract tests run in CI; runtime validation enabled in non-prod.
- Observability: Structured logs with correlation IDs; emit audit event on allow/deny decisions for sensitive actions.
- CI gates: eslint --max-warnings 0, tests + coverage ≥95% for changed code, contract tests green. PRs may not introduce new warnings.

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
