# QA Testing Task Checklist

## Purpose
Ensure QA role completes testing tasks with comprehensive validation before claiming "done". Prevent incomplete testing or skipped edge cases.

## Mandatory Workflow: Prepare → Test → Verify → Report

QA agents work autonomously (no approval needed) but MUST follow this structured workflow.

## Phase 1: Test Preparation (Report, Don't Wait)

When starting a new testing task, QA MUST announce their test plan:

```
📋 QA TEST PREPARATION

Issue: #[issue-number] - [brief title]
Testing for: #[implementation-issue] - [feature/fix]
Assigned to: qa.[name]

Specification Review:
✅ Read feature specification: [link]
✅ Reviewed acceptance criteria: [list]
✅ Reviewed architecture docs: [link or N/A]
✅ Reviewed implementation notes from Dev

Test Plan:
1. **Functional Testing**
   - [ ] [Test scenario 1]
   - [ ] [Test scenario 2]

2. **Edge Case Testing**
   - [ ] [Edge case 1]
   - [ ] [Edge case 2]

3. **Error Handling Testing**
   - [ ] [Error scenario 1]
   - [ ] [Error scenario 2]

4. **Integration Testing**
   - [ ] [Integration point 1]
   - [ ] [Integration point 2]

5. **Non-Functional Testing**
   - [ ] Performance (if applicable)
   - [ ] Security (if applicable)
   - [ ] Accessibility (if applicable)

Test Environment:
- Environment: [local/staging/etc.]
- Branch: [branch-name]
- Database state: [clean/seeded]

Starting testing...
```

**Note**: This is a report, not a request for approval. Proceed immediately after announcing.

## Phase 2: Test Execution

### Test Execution Requirements

For each test scenario:

#### Document Test Steps
- [ ] Clearly write step-by-step test procedure
- [ ] Document expected results for each step
- [ ] Document actual results observed
- [ ] Take screenshots/recordings for UI tests (if applicable)

#### Test Systematically
- [ ] Follow test plan in order
- [ ] Don't skip scenarios even if similar tests passed
- [ ] Test both happy path and error paths
- [ ] Test all acceptance criteria explicitly

#### Log Issues Immediately
- [ ] Create GitHub issue for each defect found
- [ ] Include reproduction steps
- [ ] Include screenshots/logs
- [ ] Tag with appropriate labels
- [ ] Link to implementation issue

## Phase 3: Pre-Completion Verification (MANDATORY)

Before claiming testing is done, QA MUST complete this checklist:

### Acceptance Criteria Validation
For EACH acceptance criterion from the issue:

- [ ] ✅ **AC1**: [criterion text]
  **Test Scenario**: [how you tested it]
  **Steps**: [specific steps taken]
  **Expected Result**: [what should happen]
  **Actual Result**: [what happened]
  **Status**: [✅ PASS / ❌ FAIL]
  **Evidence**: [link to screenshot/log if applicable]

- [ ] ✅ **AC2**: [criterion text]
  **Test Scenario**: [how you tested it]
  **Steps**: [specific steps taken]
  **Expected Result**: [what should happen]
  **Actual Result**: [what happened]
  **Status**: [✅ PASS / ❌ FAIL]
  **Evidence**: [link to screenshot/log if applicable]

[Document ALL acceptance criteria - no skipping]

**Overall AC Status**: [✅ ALL PASS / ❌ X of Y FAILED]

### Functional Testing Validation
- [ ] ✅ **Happy path tested**: Primary use case works as expected
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Alternative paths tested**: Secondary use cases work
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Feature completeness**: All specified features implemented
  **Missing features**: [None / List]

### Edge Case Testing Validation
- [ ] ✅ **Boundary values tested**: Min/max values, limits
  **Scenarios tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Empty/null inputs tested**: Handling of empty fields, null values
  **Scenarios tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Invalid inputs tested**: Malformed data, wrong types
  **Scenarios tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Concurrent operations tested**: Race conditions (if applicable)
  **Result**: [✅ PASS / ❌ FAIL / N/A]

### Error Handling Validation
- [ ] ✅ **Error messages clear**: User-friendly, actionable error messages
  **Errors tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Graceful degradation**: Application doesn't crash on errors
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Error recovery**: User can recover from error states
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **HTTP status codes correct**: API returns appropriate status codes (if API)
  **Verified codes**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

### Integration Testing Validation
- [ ] ✅ **API integration**: Frontend correctly calls backend APIs
  **Endpoints tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **Data persistence**: Data correctly saved/retrieved from database
  **Operations tested**: [Create, Read, Update, Delete]
  **Result**: [✅ PASS / ❌ FAIL with details]

- [ ] ✅ **External services**: Integration with external APIs works (if applicable)
  **Services tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Cross-component**: Feature works with related components
  **Components tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL with details]

### Non-Functional Testing Validation

#### Performance (if applicable)
- [ ] ✅ **Response time**: Meets performance requirements
  **Measured**: [X ms] vs **Required**: [Y ms]
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Load handling**: Performs under expected load
  **Test**: [concurrent users/requests]
  **Result**: [✅ PASS / ❌ FAIL / N/A]

#### Security (if applicable)
**REQUIRED if feature handles sensitive data, authentication, or user permissions**

- [ ] ✅ **Authentication testing**: Verify authentication works correctly
  **Scenarios tested**:
  - [ ] Valid credentials accepted
  - [ ] Invalid credentials rejected
  - [ ] Password requirements enforced
  - [ ] Session timeout works
  - [ ] Token expiration handled
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Authorization testing**: Users only access permitted resources
  **Scenarios tested**:
  - [ ] Role-based access control enforced
  - [ ] Unauthorized access blocked (401/403)
  - [ ] Resource-level permissions work
  - [ ] Privilege escalation prevented
  - [ ] Cross-user data access blocked
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Input validation**: All inputs properly validated and sanitized
  **Attack vectors tested**:
  - [ ] SQL injection attempts blocked
  - [ ] XSS (Cross-Site Scripting) prevented
  - [ ] CSRF (Cross-Site Request Forgery) protected
  - [ ] Command injection prevented
  - [ ] Path traversal blocked
  - [ ] File upload restrictions enforced
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Data encryption**: Sensitive data encrypted properly
  **Verified**:
  - [ ] Data in transit uses HTTPS/TLS
  - [ ] Sensitive data at rest encrypted
  - [ ] Passwords hashed (not plain text)
  - [ ] API keys/secrets not exposed
  - [ ] Certificate validation works
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **PII/PHI handling**: Personal/health data handled per compliance requirements
  **Verified** (if applicable):
  - [ ] HIPAA requirements met (if PHI)
  - [ ] GDPR requirements met (if EU data)
  - [ ] Data masking applied where required
  - [ ] Consent management works
  - [ ] Data retention policy followed
  - [ ] Right to deletion supported (if required)
  **Compliance**: [HIPAA ✅ / GDPR ✅ / SOC2 ✅ / N/A]
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Session security**: Session management secure
  **Verified**:
  - [ ] Secure session cookies (HttpOnly, Secure, SameSite)
  - [ ] Session fixation prevented
  - [ ] Logout clears session completely
  - [ ] Concurrent session handling
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Security headers**: Appropriate security headers present
  **Verified** (if web app):
  - [ ] Content-Security-Policy (CSP)
  - [ ] X-Frame-Options (clickjacking protection)
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] X-XSS-Protection
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **API security**: API endpoints properly secured
  **Verified**:
  - [ ] Rate limiting works
  - [ ] API authentication required
  - [ ] CORS policy enforced
  - [ ] API versioning secure
  - [ ] Error messages don't leak sensitive info
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Audit logging**: Security events properly logged
  **Verified events logged**:
  - [ ] Login attempts (success/failure)
  - [ ] Authorization failures
  - [ ] Data access (especially PII/PHI)
  - [ ] Configuration changes
  - [ ] Security violations
  - [ ] Logs don't contain sensitive data
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Dependency security**: No known vulnerabilities
  **Verified**:
  - [ ] Dependency scan shows no critical vulnerabilities
  - [ ] Third-party libraries up to date
  - [ ] Vulnerable packages addressed
  **Scan tool used**: [npm audit / pip-audit / other]
  **Result**: [✅ CLEAN / ⚠️ MINOR ISSUES / ❌ CRITICAL ISSUES]

- [ ] ✅ **Error handling**: Errors don't expose sensitive information
  **Verified**:
  - [ ] Stack traces not shown to users
  - [ ] Generic error messages for users
  - [ ] Detailed errors only in logs
  - [ ] Database errors sanitized
  **Result**: [✅ PASS / ❌ FAIL / N/A]

#### Accessibility (if UI)
- [ ] ✅ **Keyboard navigation**: Feature usable without mouse
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **Screen reader**: Works with assistive technology
  **Result**: [✅ PASS / ❌ FAIL / N/A]

- [ ] ✅ **WCAG compliance**: Meets required accessibility level
  **Level**: [A / AA / AAA]
  **Result**: [✅ PASS / ❌ FAIL / N/A]

### Documentation Validation
- [ ] ✅ **User documentation**: Accurate and complete (if applicable)
  **Docs checked**: [links]
  **Result**: [✅ ACCURATE / ❌ ISSUES FOUND / N/A]

- [ ] ✅ **API documentation**: Matches actual API behavior (if API)
  **Docs checked**: [links]
  **Result**: [✅ ACCURATE / ❌ ISSUES FOUND / N/A]

- [ ] ✅ **Code comments**: Inline docs accurate (spot check)
  **Result**: [✅ ACCURATE / ❌ ISSUES FOUND / N/A]

### Regression Testing
- [ ] ✅ **Existing features**: No broken functionality from changes
  **Features tested**: [list]
  **Result**: [✅ NO REGRESSION / ❌ REGRESSION FOUND]

- [ ] ✅ **Related features**: Connected features still work
  **Features tested**: [list]
  **Result**: [✅ PASS / ❌ FAIL]

### Defect Management
- [ ] ✅ **All defects logged**: Every issue has GitHub issue
  **Defects found**: [count]
  **Issues created**: [list of issue numbers]

- [ ] ✅ **Defects categorized**: Severity/priority assigned
  **Critical**: [count]
  **Major**: [count]
  **Minor**: [count]

- [ ] ✅ **Blocking defects**: Identified blockers for release
  **Blockers**: [list or "None"]

## Phase 4: Test Report (MANDATORY)

### If All Tests Pass

```
✅ QA TESTING COMPLETE - ALL TESTS PASSED

Issue: #[issue-number] - Testing for #[implementation-issue]

Test Summary:
📊 Total Test Scenarios: [count]
✅ Passed: [count]
❌ Failed: 0
⚠️  Blocked: 0

Acceptance Criteria:
✅ AC1: [criterion] - PASS
✅ AC2: [criterion] - PASS
[All criteria listed]

Test Coverage:
✅ Functional Testing: COMPLETE ([X] scenarios)
✅ Edge Cases: COMPLETE ([X] scenarios)
✅ Error Handling: COMPLETE ([X] scenarios)
✅ Integration: COMPLETE ([X] scenarios)
✅ Non-Functional: [COMPLETE / N/A]
✅ Security: [COMPLETE - All checks passed / N/A - No security requirements]
✅ Documentation: [VALIDATED / N/A]
✅ Regression: NO ISSUES FOUND

Defects Found: 0

Quality Assessment:
✅ Feature complete as specified
✅ No critical/major issues
✅ User experience is good
✅ Performance acceptable
✅ Security verified: [All checks passed / N/A]
✅ Compliance requirements met: [HIPAA ✅ / GDPR ✅ / SOC2 ✅ / N/A]
✅ Ready for deployment

RECOMMENDATION: ✅ APPROVE FOR RELEASE

Testing completed on: [date/time]
Environment: [environment details]
Branch: [branch-name]
```

### If Defects Found

```
⚠️ QA TESTING COMPLETE - DEFECTS FOUND

Issue: #[issue-number] - Testing for #[implementation-issue]

Test Summary:
📊 Total Test Scenarios: [count]
✅ Passed: [count]
❌ Failed: [count]
⚠️  Blocked: [count]

Acceptance Criteria:
✅ AC1: [criterion] - PASS
❌ AC2: [criterion] - FAIL (See #[defect-issue])
[All criteria listed with status]

Defects Found: [count]

Critical Issues (BLOCKING):
❌ #[issue] - [title] - [brief description]
   Impact: [what's broken]
   Steps to reproduce: [link to issue]

Major Issues:
❌ #[issue] - [title] - [brief description]

Minor Issues:
⚠️  #[issue] - [title] - [brief description]

Test Coverage:
✅ Functional Testing: COMPLETE ([X] scenarios, [Y] failed)
✅ Edge Cases: COMPLETE ([X] scenarios, [Y] failed)
✅ Error Handling: COMPLETE ([X] scenarios, [Y] failed)
✅ Integration: COMPLETE ([X] scenarios, [Y] failed)
✅ Security: [COMPLETE - [Y] issues found / N/A]

Quality Assessment:
⚠️  Feature [complete / incomplete]: [details]
❌ Critical issues present: [count]
⚠️  User experience issues: [details]
✅ Performance acceptable: [or issues found]
❌ Security concerns: [details if any - authentication/authorization/injection/encryption/compliance issues]
⚠️  Compliance issues: [HIPAA/GDPR/SOC2 concerns if applicable]

RECOMMENDATION: ❌ BLOCK RELEASE - Fix critical issues first
[or]
RECOMMENDATION: ⚠️  CONDITIONAL APPROVAL - Can release if minor issues accepted

Next Steps:
1. Dev to fix issues: [list blocking issues]
2. QA to re-test after fixes
3. [Additional steps]

Testing completed on: [date/time]
Environment: [environment details]
Branch: [branch-name]
```

## Failure Handling

### If Testing Cannot Be Completed

```
⚠️ QA TESTING BLOCKED

Issue: #[issue-number]

Blocker:
❌ [What is blocking testing]
   Details: [specific problem]
   Impact: [what can't be tested]

Completed Testing:
✅ [What was tested before blocker]
⚠️  [What remains to be tested]

Actions Needed:
- @[dev/architect/team-lead]: [what's needed to unblock]
- [Additional actions]

Status: BLOCKED - Waiting for [resolution]

Will resume testing when blocker is resolved.
```

## Escalation Scenarios

### When to Escalate to Dev
- Feature doesn't work as implemented
- Defects found (create issues, don't just escalate)
- Implementation doesn't match specification
- Need clarification on functionality

### When to Escalate to Architect
- Specification unclear or ambiguous
- Acceptance criteria missing
- Feature seems incomplete by design
- Security/architecture concerns

### When to Escalate to Team Lead
- Multiple critical defects found
- Implementation significantly different from spec
- Testing blocked by environment issues
- Need guidance on release readiness

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: "Happy Path Only"
**Wrong**: Only testing the main use case
**Right**: Test happy path, edge cases, error scenarios, and integrations

### ❌ Anti-Pattern 2: "Looks Good To Me"
**Wrong**: Marking passed without systematic testing
**Right**: Follow test plan, document results for each scenario

### ❌ Anti-Pattern 3: "I'll Log That Bug Later"
**Wrong**: Finding issues but not creating GitHub issues
**Right**: Create issue immediately when defect found

### ❌ Anti-Pattern 4: "Close Enough"
**Wrong**: Accepting behavior that doesn't match specification
**Right**: Fail tests that don't match spec, escalate to architect if spec is wrong

### ❌ Anti-Pattern 5: "Works In My Browser"
**Wrong**: Only testing in one environment/browser
**Right**: Test in all supported environments (if applicable)

## Examples

### Example 1: API Endpoint Testing

**Preparation**:
```
📋 QA TEST PREPARATION
Issue: #124 - Test GET /users/:id endpoint
Testing for: #123 - Add GET /users/:id endpoint

Test Plan:
1. Functional: Get existing user by ID
2. Edge Cases: Non-existent ID, invalid ID format
3. Error Handling: 404 for missing, 400 for invalid
4. Integration: Data matches database
5. Security: Authentication required

Starting testing...
```

**Completion** (all tests pass):
```
✅ QA TESTING COMPLETE - ALL TESTS PASSED

Test Summary:
📊 Total Test Scenarios: 8
✅ Passed: 8
❌ Failed: 0

Acceptance Criteria:
✅ AC1: Endpoint returns user data for valid ID - PASS
✅ AC2: Returns 404 for non-existent user - PASS
✅ AC3: Returns 400 for invalid ID format - PASS
✅ AC4: Requires authentication - PASS

Test Results:
✅ GET /users/1 → 200, returns user object matching spec
✅ GET /users/999999 → 404, appropriate error message
✅ GET /users/invalid → 400, validation error
✅ GET /users/1 without token → 401, unauthorized
✅ Response matches OpenAPI schema
✅ Database data matches response
✅ Response time: 45ms (< 100ms requirement)

Defects Found: 0

RECOMMENDATION: ✅ APPROVE FOR RELEASE
```

**Completion** (defects found):
```
⚠️ QA TESTING COMPLETE - DEFECTS FOUND

Test Summary:
📊 Total Test Scenarios: 8
✅ Passed: 6
❌ Failed: 2

Critical Issues:
❌ #125 - GET /users/:id returns 500 for non-existent user
   Expected: 404 with error message
   Actual: 500 internal server error
   Steps: See issue #125

Minor Issues:
⚠️  #126 - Response time occasionally >100ms
   Requirement: <100ms
   Observed: 45-150ms range
   Impact: Acceptable but should investigate

RECOMMENDATION: ❌ BLOCK RELEASE - Fix #125 before deployment

Next Steps:
1. @Dev: Fix #125 (critical)
2. @Dev: Investigate #126 performance (optional)
3. @QA: Re-test after fixes
```

### Example 2: UI Feature Testing

**Preparation**:
```
📋 QA TEST PREPARATION
Issue: #234 - Test user registration form
Testing for: #233 - Implement user registration

Test Plan:
1. Functional: Valid registration, form submission
2. Edge Cases: Duplicate email, weak password
3. Error Handling: Validation errors, server errors
4. UI/UX: Field validation, error display, success feedback
5. Integration: API calls, database persistence
6. Accessibility: Keyboard navigation, screen reader

Environment: Local development
Branch: feature/user-registration

Starting testing...
```

**Completion**:
```
✅ QA TESTING COMPLETE - ALL TESTS PASSED

Test Summary:
📊 Total Test Scenarios: 15
✅ Passed: 15

Acceptance Criteria:
✅ AC1: User can register with email/password - PASS
✅ AC2: Validation errors shown for invalid input - PASS
✅ AC3: Success message shown on registration - PASS
✅ AC4: User redirected to dashboard after registration - PASS

Functional Testing:
✅ Valid registration creates user account
✅ Form validation works (email format, password strength)
✅ Duplicate email prevented with clear error
✅ Success feedback displayed
✅ User redirected correctly

Edge Cases:
✅ Empty fields → validation errors
✅ Invalid email format → validation error
✅ Weak password → strength indicator + error
✅ Duplicate email → specific error message

Integration:
✅ POST /auth/register called with correct data
✅ User created in database
✅ Authentication token received and stored

Accessibility:
✅ Form navigable with keyboard
✅ Screen reader announces errors
✅ WCAG AA compliant

Defects Found: 0

RECOMMENDATION: ✅ APPROVE FOR RELEASE

Screenshots: [links to test evidence]
```

## Summary

**Key Principles**:
1. **Plan systematically**: Create comprehensive test plan before starting
2. **Test thoroughly**: Don't skip edge cases or error scenarios
3. **Document everything**: Record steps, results, evidence
4. **Log defects immediately**: Create GitHub issues as you find problems
5. **Verify acceptance criteria**: Test EVERY criterion explicitly
6. **Report completely**: Use the checklist format for test reports

**The "Done" Gate**:
Testing is NOT done until:
- ✅ All acceptance criteria tested
- ✅ Happy path and edge cases covered
- ✅ Error handling validated
- ✅ Integration points verified
- ✅ All defects logged in GitHub
- ✅ Test report completed
- ✅ Release recommendation made

No partial testing, no "I'm sure it works", no skipped scenarios - TEST EVERYTHING.
