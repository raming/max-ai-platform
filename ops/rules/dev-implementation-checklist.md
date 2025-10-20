# Dev Implementation Task Checklist

## Purpose
Ensure Dev role completes implementation tasks with full verification before claiming "done". Prevent the common problem of marking tasks complete without verifying code compiles, builds, tests pass, or actually runs.

## Mandatory Workflow: Prepare → Implement → Verify → Done

Dev agents work autonomously (no approval needed) but MUST follow this structured workflow.

## Phase 1: Task Preparation (Report, Don't Wait)

When starting a new task, Dev MUST announce their plan:

```
📋 DEV TASK PREPARATION

Issue: #[issue-number] - [brief title]
Assigned to: dev.[name]

Architecture Review:
✅ Read specification: [link to spec]
✅ Reviewed API contracts: [link or N/A]
✅ Reviewed data model: [link or N/A]
✅ Reviewed business logic requirements: [link or N/A]
✅ Understand acceptance criteria

Implementation Plan:
- [ ] [Component/file 1 to create/modify]
- [ ] [Component/file 2 to create/modify]
- [ ] [Tests to write]
- [ ] [Integration points to verify]

Dependencies:
- [List any blockers or dependencies]

Estimated completion: [timeframe]

Starting implementation...
```

**Note**: This is a report, not a request for approval. Proceed immediately after announcing.

## Phase 2: Implementation

### Folder Structure Compliance
**REQUIRED**: Follow `rules/folder-structure-best-practices.md`

**IMPORTANT - Context Matters**:
- **New projects**: Full compliance REQUIRED
- **Existing codebases** (e.g., Airmeez): RESPECT EXISTING structure
  - When modifying existing code → Match existing folder organization
  - When creating new standalone module → Can apply new standards (document in ADR)
  - Don't refactor existing working code just for compliance
- See "Applicability" section in folder structure guide for decision framework

#### Frontend Code Organization

**For NEW projects or NEW standalone modules:**

- [ ] ✅ **Reusable UI components in libs**: Pure UI components placed in `client/src/libs/ui-components/`
  - [ ] No business logic in UI components
  - [ ] No API calls in UI components
  - [ ] Components accept data via props only
  - [ ] Each component in its own folder with tests and stories

- [ ] ✅ **Feature-specific code in features**: Business logic in `client/src/features/[feature-name]/`
  - [ ] Feature components can use business logic
  - [ ] Feature components can make API calls via services

- [ ] ✅ **API calls in services layer**: Data fetching in `client/src/services/`
  - [ ] No API calls in component files
  - [ ] Service functions reusable across features

- [ ] ✅ **Layer separation maintained**: No mixing of UI/business/data concerns
  - [ ] Presentation layer: `libs/ui-components/`
  - [ ] Feature layer: `features/`
  - [ ] Data layer: `services/`
  - [ ] State layer: `store/`

**For EXISTING codebases:**

- [ ] ✅ **Match existing structure**: If modifying existing feature, follow its current organization
- [ ] ✅ **Document new structure**: If creating new module with new standards, create ADR explaining approach
- [ ] ✅ **No forced refactoring**: Don't restructure existing working code without explicit requirement

#### Backend Code Organization

**For NEW projects or NEW standalone modules:**

- [ ] ✅ **API layer separation**: Controllers, routes, DTOs in `server/src/api/`
  - [ ] No business logic in controllers
  - [ ] Controllers only handle HTTP concerns

- [ ] ✅ **Business logic layer**: Services, entities, validators in `server/src/domain/`
  - [ ] Business services implement domain interfaces
  - [ ] No database access in domain services

- [ ] ✅ **Data layer separation**: Repositories, database access in `server/src/infrastructure/`
  - [ ] Repositories implement domain interfaces
  - [ ] Database access only in infrastructure layer

- [ ] ✅ **Dependencies flow correctly**: API → Domain → Infrastructure
  - [ ] API depends on domain
  - [ ] Domain defines interfaces (ports)
  - [ ] Infrastructure implements interfaces (adapters)
  - [ ] Domain NEVER depends on infrastructure

**For EXISTING codebases:**

- [ ] ✅ **Respect existing architecture**: Follow current layer organization
- [ ] ✅ **Consistency within module**: Match existing patterns in same module
- [ ] ✅ **Document if diverging**: Create ADR if applying new standards to new module

### Code Quality Requirements

As you implement, continuously verify:

#### Compilation Check (Continuous)
- [ ] Code compiles without errors after each significant change
- [ ] No syntax errors
- [ ] No type errors (TypeScript/typed languages)
- [ ] IDE shows no red underlines/errors

#### Incremental Testing
- [ ] Run related tests frequently (not just at end)
- [ ] Fix issues immediately when tests fail
- [ ] Don't accumulate technical debt

#### Specification Compliance
- [ ] Implement exactly what spec defines
- [ ] Use specified DTOs/interfaces (don't invent your own)
- [ ] Follow specified error handling patterns
- [ ] Match API contracts exactly
- [ ] Use specified database schema (don't modify)

### Anti-Pattern Warning

❌ **DO NOT**:
- Write all code then test at end
- Skip running the application
- Assume code works if it compiles
- Deviate from architectural specs without approval
- Mark done without verification

## Phase 3: Pre-Completion Verification (MANDATORY)

Before claiming task is done, Dev MUST complete this checklist:

### Build & Compilation Verification
- [ ] ✅ **Code compiles**: Run full build, no errors
  ```bash
  # Example commands:
  npm run build
  # OR
  tsc --noEmit
  # OR
  mvn compile
  ```
  **Status**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **No lint errors**: Linting passes (warnings as errors per policy)
  ```bash
  npm run lint
  # OR
  eslint src/
  ```
  **Status**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **No type errors**: Type checking passes
  ```bash
  tsc --noEmit
  # OR
  mypy src/
  ```
  **Status**: [✅ PASS / ❌ FAIL with details]

### Test Verification
- [ ] ✅ **Unit tests pass**: All unit tests for modified code pass
  ```bash
  npm test -- [test-file]
  # OR
  pytest tests/unit/
  ```
  **Results**: [X/Y tests passed]
  **Coverage**: [%]

- [ ] ✅ **Integration tests pass**: Related integration tests pass
  ```bash
  npm run test:integration
  # OR
  pytest tests/integration/
  ```
  **Results**: [X/Y tests passed]

- [ ] ✅ **Coverage threshold met**: Minimum 95% coverage (per policy)
  ```bash
  npm run test:coverage
  ```
  **Coverage**: [%] (must be ≥95%)

- [ ] ✅ **New tests written**: Added tests for new functionality
  **Unit tests added**: [count]
  **Integration tests added**: [count]

### Runtime Verification
- [ ] ✅ **Application runs**: Successfully start application locally
  ```bash
  npm start
  # OR
  python app.py
  # OR
  docker-compose up
  ```
  **Status**: [✅ Started successfully / ❌ Failed]

- [ ] ✅ **Feature works**: Manually tested the implemented feature
  **Test scenario**: [what you tested]
  **Result**: [✅ Works as expected / ❌ Issues found]

- [ ] ✅ **No console errors**: Application runs without errors in console/logs
  **Status**: [✅ Clean / ❌ Errors found]

- [ ] ✅ **Database migrations**: If schema changed, migrations run successfully
  ```bash
  npm run migrate
  # OR
  alembic upgrade head
  ```
  **Status**: [✅ Applied / N/A]

### Specification Compliance Verification
- [ ] ✅ **API contract matches spec**: Endpoints match OpenAPI/Swagger spec
  **Verified endpoints**: [list]
  **Contract tests pass**: [✅ / ❌]

- [ ] ✅ **DTOs match spec**: Request/response DTOs match TypeScript interfaces from spec
  **Verified DTOs**: [list]

- [ ] ✅ **Business logic matches spec**: Implementation follows specified rules
  **Verified rules**: [list]

- [ ] ✅ **Error handling matches spec**: Errors thrown/returned as specified
  **Verified error scenarios**: [list]

- [ ] ✅ **Data model matches spec**: Database schema matches specification
  **Tables verified**: [list]

### Acceptance Criteria Verification
For each acceptance criterion from the issue:

- [ ] ✅ **AC1**: [criterion text]
  **Verification**: [how you verified it works]
  **Status**: [✅ MET / ❌ NOT MET]

- [ ] ✅ **AC2**: [criterion text]
  **Verification**: [how you verified it works]
  **Status**: [✅ MET / ❌ NOT MET]

[Add all acceptance criteria from issue]

### Security Verification
**REQUIRED if feature handles sensitive data, authentication, or user permissions**

- [ ] ✅ **Authentication implemented**: Auth checks in place per spec
  **Verified**: [✅ / N/A]
  **Details**: [authentication method used]

- [ ] ✅ **Authorization implemented**: Permission checks enforce RBAC rules
  **Verified**: [✅ / N/A]
  **Test scenarios**: [list permission checks tested]

- [ ] ✅ **Input validation**: All user inputs validated and sanitized
  **Verified**: [✅ / N/A]
  **Protected against**: [SQL injection ✅ / XSS ✅ / CSRF ✅]

- [ ] ✅ **Data encryption**: Sensitive data encrypted per spec
  **At rest**: [✅ / N/A] - [method]
  **In transit**: [✅ HTTPS/TLS] - [verified how]

- [ ] ✅ **PII handling**: PII handled according to privacy requirements
  **Verified**: [✅ / N/A]
  **Data masking**: [implemented where required ✅ / N/A]

- [ ] ✅ **Secret management**: No hardcoded secrets, using env vars/vault
  **Verified**: [✅ checked all config files]
  **Secrets stored**: [environment variables / secret manager]

- [ ] ✅ **Audit logging**: Security events logged per spec
  **Verified**: [✅ / N/A]
  **Events logged**: [list security events tracked]

- [ ] ✅ **Compliance requirements**: HIPAA/GDPR/SOC2 requirements met
  **Applicable compliance**: [HIPAA / GDPR / SOC2 / None]
  **Requirements met**: [✅ / N/A]
  **Verified by**: [specific checks performed]

- [ ] ✅ **Security headers**: Appropriate security headers set (if web app)
  **CSP**: [✅ / N/A]
  **X-Frame-Options**: [✅ / N/A]
  **Other headers**: [list]

- [ ] ✅ **Dependency security**: No known vulnerabilities in dependencies
  ```bash
  npm audit
  # OR
  pip-audit
  ```
  **Status**: [✅ Clean / ❌ Vulnerabilities found and addressed]

### Code Quality Verification
- [ ] ✅ **Code review ready**: Code is clean, documented, follows standards
- [ ] ✅ **No TODO comments**: All TODOs resolved or converted to issues
- [ ] ✅ **No debug code**: Removed console.logs, debugger statements, etc.
- [ ] ✅ **Documentation updated**: Updated relevant docs (API docs, README, etc.)
- [ ] ✅ **Dependencies documented**: New dependencies added to package.json with justification

### Integration Verification
- [ ] ✅ **Integration points tested**: Verified integration with other components
  **Components integrated with**: [list]
  **Integration status**: [✅ Working / ❌ Issues]

- [ ] ✅ **Backwards compatibility**: Changes don't break existing functionality
  **Regression tests**: [✅ PASS / N/A]

## Phase 4: Completion Announcement

Only after ALL verification items are ✅, announce completion:

```
✅ DEV TASK COMPLETE

Issue: #[issue-number] - [brief title]

Implementation Summary:
📄 Files created/modified:
  - [file1] - [description]
  - [file2] - [description]

Verification Results:
✅ Build: PASS (compiles without errors)
✅ Lint: PASS (no warnings/errors)
✅ Type Check: PASS
✅ Unit Tests: PASS (X/Y tests, Z% coverage)
✅ Integration Tests: PASS (X/Y tests)
✅ Runtime: Application runs successfully
✅ Feature Test: Manually verified functionality works
✅ Spec Compliance: Matches architecture specification
✅ All Acceptance Criteria: MET
✅ Security: [Authentication ✅ / Authorization ✅ / Input Validation ✅ / Encryption ✅ / No vulnerabilities ✅] OR [N/A - no security requirements]

Acceptance Criteria Verification:
✅ AC1: [criterion] - Verified by [method]
✅ AC2: [criterion] - Verified by [method]

Code Quality:
✅ Linting passes (warnings as errors)
✅ Coverage ≥95% (actual: [%])
✅ No TODOs or debug code
✅ Documentation updated

Ready for QA testing and code review.

Branch: [branch-name]
Commits: [commit-hash(es)]
```

## Failure Handling

### If ANY Verification Fails

**DO NOT claim task is done.** Instead:

```
⚠️ DEV TASK - VERIFICATION ISSUES FOUND

Issue: #[issue-number]

Failed Verification Items:
❌ [Item that failed]
   Error: [specific error message]
   Impact: [what this means]

❌ [Another failed item]
   Error: [specific error message]
   Impact: [what this means]

Actions Taken:
- [What you're doing to fix]
- [Additional steps needed]

Status: IN PROGRESS - Fixing verification issues

Will re-verify and report when fixed.
```

Then fix the issues and re-run the verification checklist.

## Escalation Scenarios

### When to Escalate to Architect
- Specification is ambiguous or incomplete
- Implementation requires deviation from spec
- API contract doesn't match actual requirements
- Data model needs modification
- Architectural decision needed

### When to Escalate to Team Lead
- Task is blocked by dependency
- Scope is larger than estimated
- Breaking changes required
- Need to create sub-tasks

### When to Escalate to QA
- Need clarification on acceptance criteria
- Test scenarios unclear
- Edge cases not specified

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: "It Compiles, Ship It"
**Wrong**: "Code compiles, marking as done"
**Right**: "Code compiles ✅, tests pass ✅, application runs ✅, feature verified ✅, marking as done"

### ❌ Anti-Pattern 2: "Tests? I'll Add Those Later"
**Wrong**: Marking done without tests
**Right**: Write tests alongside implementation, verify coverage ≥95%

### ❌ Anti-Pattern 3: "Spec Says X, But I Think Y is Better"
**Wrong**: Implementing differently without approval
**Right**: Escalate to Architect, get approval for deviation, update spec, then implement

### ❌ Anti-Pattern 4: "Works On My Machine"
**Wrong**: Only testing in IDE, not running full application
**Right**: Build, run application, test feature end-to-end in running app

### ❌ Anti-Pattern 5: "I'll Fix That Lint Warning Later"
**Wrong**: Marking done with lint warnings
**Right**: Fix all lint issues (warnings as errors per policy)

## Examples

### Example 1: Simple API Endpoint

**Preparation**:
```
📋 DEV TASK PREPARATION
Issue: #123 - Add GET /users/:id endpoint
Specification: docs/architecture/backend/user-api.md

Implementation Plan:
- [ ] Create UserController.getUserById method
- [ ] Add route in router.ts
- [ ] Write UserService.findById method
- [ ] Add unit tests for service
- [ ] Add integration test for endpoint
- [ ] Verify against OpenAPI spec

Starting implementation...
```

**Completion** (only if all ✅):
```
✅ DEV TASK COMPLETE
Issue: #123 - Add GET /users/:id endpoint

Implementation Summary:
📄 src/controllers/UserController.ts - Added getUserById method
📄 src/routes/user.routes.ts - Added GET /users/:id route
📄 src/services/UserService.ts - Added findById method
📄 tests/unit/services/UserService.test.ts - Added 5 unit tests
📄 tests/integration/user.routes.test.ts - Added endpoint tests

Verification Results:
✅ Build: PASS
✅ Lint: PASS
✅ Unit Tests: PASS (5/5 tests, 98% coverage)
✅ Integration Tests: PASS (3/3 tests)
✅ Runtime: Application starts, endpoint responds
✅ API Contract: Matches OpenAPI spec exactly
✅ Manual Test: curl localhost:3000/users/1 returns user data

Ready for QA testing.
```

### Example 2: Complex Feature

**Preparation**:
```
📋 DEV TASK PREPARATION
Issue: #456 - Implement user authentication flow
Specification: docs/architecture/backend/auth-api.md

Implementation Plan:
- [ ] Create AuthController (login, logout, refresh)
- [ ] Create AuthService (JWT generation, validation)
- [ ] Add authentication middleware
- [ ] Create auth routes
- [ ] Add password hashing utility
- [ ] Write unit tests (auth service, middleware)
- [ ] Write integration tests (auth flow)
- [ ] Update API documentation

Dependencies:
- Needs JWT secret environment variable configured

Starting implementation...
```

**Completion**:
```
✅ DEV TASK COMPLETE
Issue: #456 - Implement user authentication flow

Implementation Summary:
📄 8 files created/modified (AuthController, AuthService, middleware, routes, tests, docs)

Verification Results:
✅ Build: PASS (TypeScript compiles)
✅ Lint: PASS (0 warnings)
✅ Type Check: PASS
✅ Unit Tests: PASS (15/15 tests, 96% coverage)
✅ Integration Tests: PASS (8/8 tests covering login, logout, refresh flows)
✅ Runtime: Application runs, auth endpoints respond correctly
✅ Spec Compliance: Implementation matches auth-api.md exactly

Acceptance Criteria:
✅ AC1: User can login with email/password - Verified via POST /auth/login
✅ AC2: JWT token returned on successful login - Verified in response
✅ AC3: Protected endpoints require valid token - Verified with middleware tests
✅ AC4: Token can be refreshed - Verified via POST /auth/refresh
✅ AC5: User can logout - Verified via POST /auth/logout

Manual Testing:
✅ Login flow: Successfully logged in test user
✅ Protected route: Access denied without token, allowed with valid token
✅ Token refresh: Successfully refreshed expired token
✅ Logout: Token invalidated after logout

Ready for QA comprehensive testing.

Branch: feature/user-authentication
Commits: abc123, def456, ghi789
```

## Summary

**Key Principles**:
1. **Report, don't wait**: Announce your plan, then proceed autonomously
2. **Verify continuously**: Don't save all verification for the end
3. **100% completeness**: Code must compile, build, pass tests, and run
4. **Match the spec**: Implementation must exactly follow architecture specification
5. **Checklist before done**: Complete ALL verification items before claiming done

**The "Done" Gate**:
A task is NOT done until:
- ✅ It compiles
- ✅ It builds
- ✅ Tests pass (≥95% coverage)
- ✅ Application runs
- ✅ Feature actually works
- ✅ Matches specification
- ✅ Acceptance criteria met

No shortcuts, no "almost done", no "works on my machine" - VERIFY EVERYTHING.
