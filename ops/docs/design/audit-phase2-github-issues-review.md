# Phase 2: GitHub Issues Review - Detailed Findings

**Audit Date**: 2025-10-17  
**Tracking Issue**: #146  
**Auditor**: architect.morgan-lee

## Executive Summary

**MIXED RESULTS**: Issues have good structure and acceptance criteria, but **LACK extreme AI-agent implementation detail**

## Overall Scores

| Criteria | Score | Status |
|----------|-------|--------|
| Structure | 100% | ✅ Excellent |
| Acceptance Criteria | 100% | ✅ All present |
| Traceability | 95% | ✅ Good (1 broken ref) |
| **Extreme Detail** | **30%** | **🚨 CRITICAL GAP** |
| Code Examples | 10% | 🚨 Almost none |
| Schemas/ERDs | 0% | 🚨 Referenced but missing |
| Command Examples | 20% | ⚠️ Some present |
| **OVERALL** | **65%** | **⚠️ NEEDS ENHANCEMENT** |

## Detailed Findings by Issue

### Issue #129: ARCH-UI-01 - NX Library Structure Setup

**Status**: P0, Ready  
**Structure Score**: ✅ 100%  
**Detail Score**: 🚨 30%

**Strengths**:
- Clear summary with priority, effort, dependencies
- 8 well-defined scope items
- 6 objectives listed
- AI Agent Guidance section present
- Files to Create/Modify enumerated
- 6 acceptance criteria with checkboxes
- Test plan included
- References provided

**Critical Gaps**:
- ❌ No exact NX commands to run
- ❌ No example `project.json` content
- ❌ No specific TypeScript path mappings
- ❌ No Jest config examples
- ❌ No Tailwind config integration steps
- 🚨 **BROKEN REFERENCE**: `ops/docs/design/ui-framework-action-plan.md` (FILE DOES NOT EXIST!)
  - Should reference: `ops/docs/design/ui-framework-spec.md`

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-UI-01-implementation-spec.md` with:
1. Exact `nx generate library` commands
2. Complete `project.json` templates
3. TypeScript `paths` configuration
4. Jest preset configuration
5. Tailwind CSS setup steps
6. Example component exports

---

### Issue #14: ARCH-14 - GHL Limitations Assessment

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 25%

**Critical Gaps**:
- ❌ No structured comparison matrix template
- ❌ No specific GHL APIs/endpoints to evaluate
- ❌ No decision criteria thresholds
- ❌ No cost/benefit calculation methodology

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-14-assessment-template.md` with:
1. Comparison matrix structure (columns, criteria)
2. List of GHL APIs to evaluate (webhooks, automations, custom fields)
3. Decision thresholds (e.g., "rebuild if >X hours or >$Y")
4. Cost calculation formulas

---

### Issue #12: ARCH-13 - Messaging Backbone

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 35%

**Critical Gaps**:
- ❌ No BullMQ queue naming examples
- ❌ No specific retry/backoff policy values
- ❌ No queue configuration code snippets
- ❌ No idempotency key generation pattern

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-13-messaging-implementation.md` with:
1. Queue naming convention: `{service}.{action}.{priority}` pattern
2. Retry policy values: `attempts: 3, backoff: exponential, delay: 1000`
3. BullMQ configuration code examples
4. Idempotency key: `${source}-${eventId}-${timestamp}` pattern

---

### Issue #9: ARCH-10 - Feature Flags Framework

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 20%

**Critical Gaps**:
- ❌ No ERD provided (mentioned in acceptance but not inline)
- ❌ No API endpoint signatures
- ❌ No evaluation algorithm pseudocode
- ❌ No specific schema fields

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-10-feature-flags-spec.md` with:
1. ERD diagram (feature_flags, feature_assignments tables)
2. API endpoints: `GET /api/flags/:key`, `POST /api/flags/evaluate`
3. Evaluation algorithm pseudocode
4. Schema fields: `key, environment, status, rollout_percentage, allowlist`

---

### Issue #8: ARCH-09 - LLM Provider and Content Automation

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 25%

**Critical Gaps**:
- ❌ No ILlmPort interface definition
- ❌ No GeneratedArtifact schema structure
- ❌ No workflow state machine diagram
- ❌ No provenance field definitions

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-09-llm-integration-spec.md` with:
1. ILlmPort TypeScript interface
2. GeneratedArtifact schema with all fields
3. Workflow states: `draft → validating → review → approved → published`
4. Provenance fields: `model, prompt_hash, parameters, created_at, created_by`

---

### Issue #7: ARCH-08 - UI/UX Framework and Portal Scaffolding

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 30%

**Critical Gaps**:
- ❌ No specific template choice made (lists options)
- ❌ No component list to implement
- ❌ No file structure for portal shell
- ❌ No RHF+Zod integration examples

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-08-portal-implementation.md` with:
1. **DECISION**: Choose specific template (e.g., TailAdmin)
2. Component inventory: Header, Sidebar, Dashboard, Forms, Tables, Charts
3. File structure: `app/`, `components/`, `lib/`, `styles/`
4. RHF+Zod form example with validation

---

### Issue #6: ARCH-07 - Platform-Agnostic CRM and Calendar Ports

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 25%

**Critical Gaps**:
- ❌ No ICRMPort method signatures
- ❌ No JSON Schema examples provided
- ❌ No OAuth flow steps
- ❌ No token rotation specifics

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-07-crm-calendar-ports-spec.md` with:
1. ICRMPort interface: `createContact()`, `updateContact()`, `listContacts()`
2. Contact JSON Schema with all fields
3. OAuth flow: 6-step sequence diagram
4. Token rotation: expiry check, refresh logic, storage pattern

---

### Issue #5: ARCH-06 - Declarative Orchestration

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 20%

**Critical Gaps**:
- ❌ No Flow JSON Schema provided
- ❌ No sample flow examples in issue
- ❌ No adapter capability matrix
- ❌ No n8n delegation criteria

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-06-orchestration-spec.md` with:
1. Flow JSON Schema with `trigger`, `steps[]`, `error_handling`
2. 2 sample flows: "Onboard Client", "Send Notification"
3. Capability matrix: CRM (GHL ✅, HubSpot 🚧), Calendar (Google ✅)
4. n8n delegation: "if steps > 10 OR has loops OR needs human approval"

---

### Issue #4: ARCH-05 - Multi-Provider Payments

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 30%

**Critical Gaps**:
- ❌ No IPaymentProviderPort interface definition
- ❌ No data model ERD provided in issue
- ❌ No pricing config format
- ❌ No webhook verification algorithm

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-05-payments-implementation.md` with:
1. IPaymentProviderPort interface with all methods
2. ERD: `subscriptions`, `usage_events`, `invoices`, `line_items`
3. Pricing config JSON structure
4. Webhook verification: HMAC signature algorithm

---

### Issue #3: ARCH-04 - IAM and Prompt Management

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 25%

**Critical Gaps**:
- ❌ No User/Role/Assignment schemas provided
- ❌ No RBAC matrix included
- ❌ No prompt rollout workflow diagram
- ❌ No service boundaries specified

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-04-iam-prompt-spec.md` with:
1. User/Role/Assignment TypeScript types
2. RBAC matrix: 5 roles × 8 resources
3. Prompt rollout: 5-state workflow diagram
4. Service boundaries: IAM owns auth, Prompt owns templates

---

### Issue #2: ARCH-03 - Reviews/Calendar Onboarding

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 30%

**Critical Gaps**:
- ❌ No sequence diagrams in issue (mentioned as output)
- ❌ No proxy endpoint definitions
- ❌ No token storage schema
- ❌ No specific GHL APIs listed

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-03-reviews-calendar-spec.md` with:
1. Sequence diagrams for "Connect Reviews" and "Connect Calendar"
2. Proxy endpoints: `POST /api/oauth/google`, `GET /api/reviews`
3. Token storage: encrypted at rest, per-tenant, refresh logic
4. GHL APIs: list specific endpoints to use

---

### Issue #1: ARCH-02 - Billing/Usage Collectors

**Status**: P1  
**Structure Score**: ✅ 95%  
**Detail Score**: 🚨 35%

**Critical Gaps**:
- ❌ No UsageEvent/CycleAggregate schemas provided
- ❌ No ERD included in issue
- ❌ No collector pseudocode
- ❌ No specific API endpoints per source

**Required Implementation Spec**:
Create `ops/tracker/specs/impl/ARCH-02-usage-collectors-spec.md` with:
1. UsageEvent JSON Schema with all fields
2. ERD: `usage_events`, `cycle_aggregates`, `sources`
3. Collector pseudocode for Retell, Twilio, OpenRouter
4. Specific API endpoints: Retell `/v1/usage`, Twilio `/2010-04-01/Usage`

---

## Summary of Required Actions

### 1. Create 13 Implementation Specification Documents

For each ARCH issue, create detailed implementation spec in:
```
ops/tracker/specs/impl/ARCH-{NN}-{topic}-implementation-spec.md
```

**Template Structure**:
1. Overview (link to parent issue)
2. Prerequisites (exact state required)
3. Step-by-Step Implementation (copy-paste commands)
4. Code Artifacts (full interfaces, types, schemas)
5. Configuration Files (complete content)
6. Test Cases (fixtures, assertions)
7. Validation Steps (how to verify success)
8. Edge Cases (explicit handling)
9. Rollback Procedure (if needed)

### 2. Fix Broken Reference in Issue #129

Update issue #129 to reference correct file:
- ❌ Remove: `ops/docs/design/ui-framework-action-plan.md`
- ✅ Add: `ops/docs/design/ui-framework-spec.md`

### 3. Create Missing JSON Schemas

Create contract files for all data models:
```
libs/contracts/schemas/
├── usage-event.schema.json
├── cycle-aggregate.schema.json
├── subscription.schema.json
├── invoice.schema.json
├── feature-flag.schema.json
├── flow-spec.schema.json
└── ...
```

### 4. Add ERDs to Specs

Create diagram files for all data models:
```
ops/docs/design/erds/
├── billing-usage.mermaid
├── payments.mermaid
├── iam.mermaid
├── feature-flags.mermaid
└── ...
```

## Compliance Checklist

- [x] All issues have structure ✅
- [x] All issues have acceptance criteria ✅
- [x] All issues have references ✅
- [ ] All issues have extreme implementation detail 🚨
- [ ] All referenced files exist 🚨
- [ ] All schemas provided inline or linked 🚨
- [ ] All ERDs provided inline or linked 🚨
- [ ] All command examples copy-pasteable 🚨

## Next Steps

1. **Immediate**: Create implementation spec for #129 (P0 issue)
2. **Phase 3**: Split bloated docs from Phase 1 audit
3. **Phase 4**: Create implementation specs for remaining 12 issues
4. **Phase 5**: Create all JSON Schema files
5. **Phase 6**: Create all ERD diagrams

## Architect Responsibility

Per Architect prompt:
> **EXTREME SPECIFICATION DETAIL**: Produce designs/specs that minimize ambiguity for downstream AI agents: structured outlines, sub-sections, and cross-references as needed.

Current state: **NOT MEETING STANDARD**  
Required action: **COMPREHENSIVE ENHANCEMENT OF ALL SPECS**
