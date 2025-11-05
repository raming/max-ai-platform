# ARCH-14 Pre-Work Phase: GHL Limitations & Standalone Feasibility Assessment

**Architect**: architect.morgan-lee  
**Issue**: #14 (P1 Phase 1)  
**Date**: October 24, 2025  
**Status**: PRE-WORK PHASE — Planning & Context Review  

---

## Executive Summary

ARCH-14 requires a comprehensive assessment of GoHighLevel's (GHL) capabilities, limitations, and architectural fit for our platform's onboarding and cross-platform automation needs. This assessment will inform critical decisions on:

1. **Integration Strategy**: Encapsulation (proxy) vs. partial rebuild
2. **Phase 1 Priorities**: Which GHL-dependent features are viable
3. **Phase 2 Roadmap**: Where to build stand-alone capabilities
4. **Security & Privacy**: Domain exposure risks and mitigation

**This Pre-Work Phase** establishes scope, methodology, and deliverables before diving into detailed analysis.

---

## Scope Definition

### What We're Assessing

#### 1. Integration Modes (Security & Architecture)

- **Server-side API** (sub-account tokens via proxy) — Preferred approach
  - Pros: Hidden tokens, centralized control, rate limiting at proxy
  - Cons: Requires middleware, additional hop latency
  - Assessment: Document full implementation pattern

- **Browser-based JWT** (user-admin token from client) — Higher risk
  - Pros: Direct calls, lower latency
  - Cons: Token exposure, domain leakage, difficult to control
  - Assessment: Identify use cases where acceptable, mitigations needed

- **iFrame/Whitelabel Embedding** — Privacy-focused
  - Pros: Hides GHL domain completely
  - Cons: Limited support, CSP complexity, embedding constraints
  - Assessment: Test feasibility and official support

#### 2. API Coverage for Phase 1 Onboarding

**Contacts & Custom Fields**:
- Endpoint discovery: `/locations/{locationId}/customFields`
- Field operations: CRUD on standard/custom fields
- Field types: text, radio, multi-select, date, etc.
- Mapping to our normalized schema

**Workflows & Automations**:
- Trigger types: contact_created, appointment_booked, message received, etc.
- Action types: send_webhook, update_contact, send_sms, etc.
- Trigger variables: template support, limitations
- Export/import capabilities

**Webhooks (Outbound)**:
- Topics supported: What triggers can we hook?
- Payload flexibility: Can we customize fields?
- Delivery: Retries, ordering, guarantees?
- Validation: HMAC/signature options?

**Authentication & Security**:
- Token model: JWT, opaque, refresh?
- Scopes: Granular permissions?
- Rotation: Refresh frequency, expiration?
- Audit: Can we track who did what?

#### 3. Rate Limits & Reliability

- Per-endpoint quotas and windows
- Burst handling and backoff strategies
- Webhook retry semantics
- Error surfaces and recovery options

#### 4. Domain Privacy & Compliance

- Can we hide GHL domain from clients?
- Whitelabel/embed official support?
- SSO/consent flow integration?
- PII handling in webhooks?

---

## Methodology

### Phase A: Browser API Inspection (Days 1–2)

**Tool**: Puppeteer headless browser automation  
**Goal**: Capture actual network calls, headers, and authentication flows

**Steps**:

1. **Authentication Flow Capture**
   - Login via UI and capture token acquisition
   - Analyze JWT: expiration, scopes, issuer
   - Document refresh mechanism
   - Check for 2FA interactions

2. **Endpoint Mapping**
   - Navigate through UI sections (Contacts, Workflows, Settings)
   - Capture all XHR/fetch calls
   - Group by endpoint (e.g., `/v1/contacts`, `/v1/workflows`)
   - Document HTTP methods (GET, POST, PATCH, DELETE)

3. **Headers Analysis**
   - Collect authorization headers by endpoint
   - Identify custom headers (Location-ID, API-Version, etc.)
   - Check for rate limit info (X-RateLimit-*)
   - Document required vs. optional headers

4. **Request/Response Sampling**
   - Capture sample payloads for each endpoint
   - Document response status codes
   - Identify error patterns
   - Note pagination and filtering options

5. **Token & Authentication Details**
   - Extract JWT payload and decode
   - Analyze expiration and refresh flow
   - Check for multiple token types (access, refresh, session)
   - Document scope requirements

**Output**: Structured JSON files with all captured data + summary report

**User Action Required**: Navigate GHL UI while Puppeteer captures calls. Can be fully automated with credentials or manual.

### Phase B: Gap Analysis (Day 3)

**Goal**: Map discovered capabilities to Phase 1 requirements

**Steps**:

1. **Cross-Reference with Onboarding Flows**
   - Load known flows from KB (1prompt docs)
   - For each flow, identify required GHL APIs
   - Mark as ✅ (supported), ⚠️ (workaround needed), or ❌ (not available)

2. **Identify Gaps**
   - Which features lack API coverage?
   - Which require workarounds?
   - Which would need custom implementation?

3. **Integration Mode Feasibility**
   - Test proxy pattern with discovered endpoints
   - Evaluate browser JWT approach for specific use cases
   - Assess iFrame/whitelabel support

4. **Rate Limit Impact**
   - Document per-endpoint quotas
   - Calculate burst capacity for onboarding scale
   - Plan throttling strategies

**Output**: Updated Gap Matrix with feasibility notes

### Phase C: Architecture Decisions (Days 4–5)

**Goal**: Produce actionable decision framework

**Steps**:

1. **Build Decision Matrix**
   - Encapsulation (recommended baseline)
   - Partial rebuild (specific features only)
   - Full rebuild (if encapsulation insufficient)
   - Hybrid (encapsulate + custom build)

2. **Cost/Benefit Analysis**
   - Engineering effort per option
   - Maintenance burden
   - Future extensibility
   - Security trade-offs

3. **Phase Plan Impact**
   - Prioritize Phase 1 features based on GHL capability
   - Identify Phase 2 items requiring custom build
   - Flag any blockers to Phase 1 launch

4. **Risk Assessment**
   - Privacy/domain exposure
   - Rate limit contingencies
   - Token refresh failures
   - Webhook reliability

**Output**: Architecture decision note + updated Phase plan

---

## Deliverables (Acceptance Criteria)

### Level 1: Gap Analysis Document ✅

**File**: `/docs/design/assessments/ghl-limitations-detailed.md`

Contains:
- Detailed endpoint mapping (all discovered APIs)
- Request/response sample payloads
- Headers by endpoint (auth schemes, rate limits, custom headers)
- Token lifecycle analysis (expiration, refresh, scopes)
- Integration mode feasibility (server-side, browser JWT, iFrame/whitelabel)
- Rate limit details (per-endpoint quotas, windows, burst handling)
- Workflow/automation coverage (triggers, actions, variables)
- Custom fields discovery and type mappings
- Webhook support analysis (topics, payloads, retries)

**Acceptance**: Comprehensive, with actual captured data + analysis notes

### Level 2: Decision Note ✅

**File**: `/docs/design/decisions/ghl-encapsulation-decision.md`

Contains:
- Summary of findings
- Comparison: Encapsulation vs. Partial Rebuild vs. Full Rebuild
- Recommendation with rationale
- Cost/effort estimates for each option
- Risk assessment and mitigations
- Phase 1 & 2 impact on priorities
- Security/compliance implications
- Implementation roadmap

**Acceptance**: Clear decision with supporting analysis, no ambiguity

### Level 3: Phase Plan Updates ✅

**File**: `/docs/release/phase-1-updated.md` (with GHL findings integrated)

Contains:
- Any priority changes based on GHL capability
- Feasible vs. deferred features
- Effort estimates per feature (informed by findings)
- Dependency analysis
- Go/No-Go criteria for Phase 1 launch

**Acceptance**: Updated priorities, milestones clear

---

## Scope Boundaries (Out of Scope)

- ❌ Implementation of any adapters (design only)
- ❌ Detailed rate limit testing (document quoted limits)
- ❌ Load testing GHL APIs (observe from inspection)
- ❌ Building proxy service (spec only)
- ❌ Testing all GHL features (focus on onboarding + automation only)

---

## Timeline & Milestones

| Phase | Days | Deliverable | Status |
|-------|------|-------------|--------|
| **Pre-Work** | 0.5 | Scope + Planning + Tool setup | 🟢 IN-PROGRESS |
| **Phase A** | 1.5 | Browser API inspection complete, JSON outputs | ⏳ TO-DO |
| **Phase B** | 1 | Gap matrix updated with findings | ⏳ TO-DO |
| **Phase C** | 1.5 | Decision note + phase plan updates | ⏳ TO-DO |
| **Delivery** | 0.5 | All outputs committed, issue closed | ⏳ TO-DO |
| **TOTAL** | 5 | All deliverables complete | ⏳ 5 DAYS |

---

## Tools & Resources

### Browser Inspection

**Tool**: `tools/ghl-token-investigation/inspect-browser-apis.js`

**Features**:
- Puppeteer-based headless browser automation
- Captures all XHR/fetch calls to GHL APIs
- Extracts headers, tokens, auth flows
- Navigates through key UI sections (Contacts, Workflows, Settings, Custom Fields)
- Generates structured JSON output
- Optional automated login or manual browser control

**Usage**:
```bash
cd tools/ghl-token-investigation
npm install
npm run inspect-apis                    # Manual login with browser
# OR
GHL_EMAIL=user@example.com GHL_PASSWORD=password npm run inspect-apis:headless
```

**Output Files**:
- `ghl-api-capture-{timestamp}.json` — All captured endpoints, requests, responses, tokens
- `ghl-headers-{timestamp}.json` — Headers mapping by endpoint
- `ghl-inspection-summary-{timestamp}.json` — Summary: endpoint count, API calls, token count
- `ghl-console-{timestamp}.json` — Console logs and errors
- `ghl-dom-{timestamp}.json` — DOM analysis, storage elements

**Documentation**: `tools/ghl-token-investigation/INSPECTION-GUIDE.md`

### Existing Documentation

- **Knowledge Base**: `docs/design/integrations/1prompt/1PROMPT-V18-*.md` (imported KB)
- **Current Gap Matrix**: `docs/design/assessments/ghl-gap-matrix.md` (v1, needs updating)
- **Feasibility Draft**: `docs/design/assessments/ghl-feasibility.md` (initial assessment)
- **ADR-0001**: `docs/adr/adr-0001-ghl-encapsulation.md` (encapsulation decision)
- **Contracts**: `docs/contracts/ghl-*.schema.json` (event schemas)

---

## Next Steps (Design Phase)

Once Pre-Work Phase is complete:

1. **Run browser inspection**
   - User navigates GHL UI while tool captures
   - Review generated JSON files
   - Document key findings

2. **Analyze captured data**
   - Extract endpoint list
   - Map to onboarding flows
   - Identify gaps vs. requirements

3. **Build detailed specs**
   - Document each API endpoint
   - Capture request/response formats
   - Note authentication + rate limits
   - Create contracts for use by adapters

4. **Make architectural decisions**
   - Encapsulation (server-side proxy) recommended
   - Identify rebuild candidates
   - Plan proxy implementation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Rate limits prevent bulk onboarding | 🔴 High | Schedule imports off-peak, implement queue with backoff |
| Domain exposure via browser JWT | 🔴 High | Use server-side proxy for all calls, avoid browser JWT |
| Webhook retries cause duplicates | 🟠 Medium | Implement idempotency keys in ingress, deduplicate on timestamp+content |
| iFrame embed not supported | 🟠 Medium | Default to proxy, escalate to GHL support if needed |
| Token refresh fails mid-workflow | 🟠 Medium | Implement health check, circuit breaker, graceful degradation |

---

## Key Questions to Answer

By end of assessment:

1. ✅ Can we hide GHL domain from clients? (Security)
2. ✅ Are webhooks flexible enough for our needs? (Integration)
3. ✅ What's the rate limit per location? (Scale)
4. ✅ Can we programmatically manage workflows? (Automation)
5. ✅ What's the token lifecycle? (Token Management)
6. ✅ Do we need custom field mapping? (Onboarding)
7. ✅ Can we automate all phase 1 triggers? (Completeness)

---

## Stakeholder Input

**Release Manager**:
- Provide GHL account admin access (or sandbox)
- Provide location ID(s) for testing
- Schedule inspection during non-peak hours (if high-traffic account)

**Team Lead**:
- Review gap matrix for correctness
- Validate decision note against business priorities
- Approve phase plan updates

**User/Product**:
- Confirm Phase 1 onboarding flows match analysis
- Approve any feature deferrals to Phase 2

---

## Success Criteria

✅ **Assessment Complete When**:

1. Browser inspection captures > 50 API endpoints with sample payloads
2. Gap matrix maps all Phase 1 features to GHL capability
3. Decision note provides clear recommendation (Encapsulation, Partial Rebuild, or Hybrid)
4. Phase plan is updated with GHL-informed priorities
5. All deliverables committed to git
6. Issue closed with comprehensive summary

---

## Sign-Off

| Role | Name | Status |
|------|------|--------|
| Architect | architect.morgan-lee | 🟢 PRE-WORK APPROVED |
| Team Lead | TBD | ⏳ Awaiting PRE-WORK Completion |
| Release Manager | TBD | ⏳ Awaiting Setup |

---

## References

- **Issue**: #14 (P1, Phase 1)
- **ADR**: docs/adr/adr-0001-ghl-encapsulation.md
- **Gap Matrix (v1)**: docs/design/assessments/ghl-gap-matrix.md
- **Tool Guide**: tools/ghl-token-investigation/INSPECTION-GUIDE.md
- **Contracts**: docs/contracts/ghl-*.schema.json

---

**Status**: Ready for Design Phase (awaiting user setup of browser inspection)

---

## Appendix: Architecture Decision Framework

### Option A: Server-Side Proxy (RECOMMENDED)

**Approach**: All GHL API calls go through our proxy; tokens stored server-side; client has no direct access

**Pros**:
- ✅ Token security (never exposed to browser)
- ✅ Rate limiting at proxy layer
- ✅ Easy token refresh (no client logic needed)
- ✅ Can inject headers/auth transparently
- ✅ Privacy: GHL domain hidden from client

**Cons**:
- ❌ Additional hop (slight latency)
- ❌ Proxy implementation effort

**Cost**: ~2–3 days for proxy + adapter layer

**Recommendation**: Use this as baseline

### Option B: Partial Rebuild + Proxy

**Approach**: Use GHL for contacts/workflows via proxy; rebuild custom orchestrations in n8n

**Pros**:
- ✅ All benefits of proxy
- ✅ Full control over automation logic
- ✅ Not locked into GHL workflow constraints

**Cons**:
- ❌ Requires n8n setup (additional infrastructure)
- ❌ Higher engineering effort

**Cost**: ~5–7 days (proxy + n8n setup + migrations)

**Recommendation**: Consider if GHL workflow constraints are too limiting

### Option C: Browser JWT (NOT RECOMMENDED)

**Approach**: Client calls GHL APIs directly with user's JWT

**Pros**:
- ✅ Lower latency (direct calls)
- ✅ No proxy infrastructure needed

**Cons**:
- ❌ Token exposure (security risk)
- ❌ Domain leakage (privacy risk)
- ❌ Client needs auth refresh logic
- ❌ Rate limiting harder to enforce

**Cost**: ~1 day (easy but risky)

**Recommendation**: Only for non-sensitive, read-only operations with strict scoping

### Option D: Full Rebuild

**Approach**: Don't use GHL at all; build all capabilities in-house

**Pros**:
- ✅ Full control and customization
- ✅ No vendor lock-in

**Cons**:
- ❌ Massive engineering effort (~20+ days)
- ❌ Ongoing maintenance burden
- ❌ Duplicates GHL functionality

**Cost**: ~15–20 days + ongoing support

**Recommendation**: Only if GHL completely insufficient (unlikely)

---

**Phase 1 Recommendation**: Option A (Server-Side Proxy) for all APIs + Option B (n8n) if GHL workflows too limited

