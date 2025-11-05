# GHL UI API & Invoice Creation Discovery

**Document**: Issue #14 - Critical UI API Analysis  
**Date**: 2025-10-30  
**Status**: Investigation & Analysis  
**Scope**: How GHL's UI creates invoices and whether workflows can create them

---

## Executive Summary

Your observation is **architecturally critical**: "We're using the UI API with admin-token. Can we learn how the UI creates invoices?"

This suggests a fundamental gap in our previous analysis: **The GHL browser UI must make API calls to create invoices that we haven't discovered yet.**

**Hypothesis**:
1. The GHL UI uses different/undocumented API endpoints than the REST API
2. Invoice creation might be possible via UI API + admin-token
3. Workflows might have invoice creation as an action
4. The Puppeteer inspection tool can capture these UI API calls

**Impact if True**: 
- ❌ Our "invoices not possible" conclusion may be **INCORRECT**
- ✅ Autonomous invoicing might be **FEASIBLE**
- ⚠️ Requires capturing actual UI network calls to verify

---

## 1. The Admin-Token Authentication Gap

### What We Know

From previous analysis:
- GHL REST API uses `token-id` header (JWT)
- REST API has no invoice creation endpoints (`POST /invoices/` doesn't exist)
- Billing endpoints are read-only (`GET /billing/`, `GET /products/`)

### The Opportunity

You mention: "using the UI api with admin-token"

**This implies**:
- The GHL admin panel uses different API endpoints than documented REST API
- Admin-token likely has higher privileges than regular JWT tokens
- UI API might expose payment/invoicing operations not in REST API

**Question**: What headers/authentication does admin-token use?
```
Is it:
- Authorization: Bearer {admin-token}?
- admin-token: {value}?
- X-Admin-Token: {value}?
- X-Authorization: Bearer {admin-token}?
```

### Network Capture Strategy

To discover UI API invoice endpoints:

1. **Use Puppeteer inspection tool** (in `/tools/ghl-token-investigation/`)
2. **Navigate to invoicing section** in GHL UI
3. **Create an invoice manually** while capturing network calls
4. **Extract POST/PUT requests** that contain "invoice" or "payment"
5. **Document request headers** including admin-token format
6. **Capture request/response bodies** for invoice creation

---

## 2. Hypothetical UI API Invoice Endpoints

Based on REST API patterns and UI functionality, GHL likely has:

### Potential Invoice Creation Endpoints

```
# Likely endpoints (unconfirmed - requires network inspection)
POST /invoices                    # Create invoice
POST /invoices/{id}               # Update invoice  
POST /invoices/{id}/send          # Send to customer
POST /invoices/{id}/payment       # Record payment
POST /charges                      # Create charge
POST /payment-links/{id}          # Generate payment link

# Possible nested endpoints
POST /contacts/{id}/invoices      # Create invoice for contact
POST /opportunities/{id}/invoice  # Convert opportunity to invoice
POST /invoices/{id}/reminders     # Send payment reminder
```

### Potential Workflow Action: "Create Invoice"

If workflows support invoicing, the action might be configured as:

```
Workflow Trigger: "Opportunity Won"
  ↓
Workflow Action: "Create Invoice"
  - Amount: {opportunity.value}
  - Customer: {contact.email}
  - Description: {opportunity.name}
  - Auto-send: true/false
  ↓
Workflow Action: "Send Payment Link"
  - Template: "Invoice Payment"
  - Customer: {contact.email}
  ↓
Workflow Trigger (next): "Payment Received"
```

---

## 3. Network Inspection to Discover Invoice APIs

### Step 1: Set Up Puppeteer Inspection

```bash
cd /Users/rayg/repos/max-ai/platform/tools/ghl-token-investigation

# Make sure dependencies are installed
npm install

# Prepare environment
export GHL_EMAIL="your-ghl-admin-email@example.com"
export GHL_PASSWORD="your-ghl-password"

# Run inspector with manual login recommended
npm run inspect-apis
```

### Step 2: Capture Invoice Creation

In the browser that opens:

```
1. Log in to GHL admin panel
2. Navigate to: Billing or Invoicing section
3. Create a new invoice manually:
   - Select customer/contact
   - Enter amount
   - Add description
   - Click "Create Invoice"
   - (Watch for network calls)
4. IMPORTANT: View invoice details
5. Send invoice to customer
6. Record any POST/PUT/PATCH calls
7. Exit browser
```

### Step 3: Analyze Captured Data

The inspection tool will generate JSON files:

```
ghl-api-capture-{timestamp}.json    # All API calls
ghl-headers-{timestamp}.json        # Headers by endpoint
ghl-inspection-summary-{timestamp}.json # Summary
```

**Look for**:
- Any endpoint containing "invoice", "charge", "payment", "billing"
- POST or PUT methods (not just GET)
- Request headers including admin-token format
- Request body structure (how invoice data is formatted)
- Response body (created invoice structure)

### Step 4: Document Findings

Expected output if invoice API exists:

```json
{
  "endpoint": "/invoices",
  "method": "POST",
  "url": "https://api.gohighlevel.com/v1/invoices",
  "headers": {
    "authorization": "Bearer {admin-token}",
    "content-type": "application/json",
    "x-admin-token": "...",
    "x-location-id": "..."
  },
  "requestBody": {
    "customerId": "contact-id",
    "amount": 5000,
    "description": "Professional Services",
    "dueDate": "2025-11-30",
    "autoSend": true
  },
  "responseBody": {
    "id": "invoice-123",
    "status": "draft",
    "createdAt": "2025-10-30T...",
    "paymentLink": "https://pay.gohighlevel.com/invoice/123"
  }
}
```

---

## 4. Workflow-Based Invoice Creation

### Theory: Workflows Can Create Invoices

If GHL's workflow engine has invoice creation as an action, the flow would be:

```
┌─────────────────────────────────┐
│  Contact Form Submission        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Workflow Trigger: Form Submit  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Create Contact/Opportunity     │ (via API)
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Workflow Action: Create Invoice│ (POSSIBLE?)
│  - Use contact email            │
│  - Use opportunity amount       │
│  - Auto-generate payment link   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Workflow Action: Send Email    │
│  - With payment link            │
│  - With invoice PDF             │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Customer Pays (External)       │
│  Click payment link             │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Webhook: Payment Received      │
│  Update contact status          │
│  Mark opportunity as won        │
└─────────────────────────────────┘
```

### Testing Workflow Invoice Action

1. **List available workflow actions**:
   - Use: `GET /v1/actions` (if available)
   - Look for action named: "Create Invoice", "Generate Invoice", "Create Charge"

2. **Create test workflow**:
   - Set trigger: Contact created
   - Add action: Create Invoice (if available)
   - Configure: Amount field, customer field, description
   - Save and test

3. **Verify via webhook**:
   - If workflow creates invoice, a webhook event should fire
   - Event type: "invoice.created" or similar
   - Webhook payload should contain invoice ID, amount, status

---

## 5. Alternative: Stripe Direct Integration

If GHL doesn't expose invoice APIs directly, consider:

### Stripe Integration Points

```
Scenario: GHL + Stripe Integration

1. Contact/Opportunity created in GHL ✅
   └─ Via REST API (documented)

2. Trigger AI workflow logic
   └─ AI detects "invoice needed" opportunity

3. Create Stripe invoice directly ⚠️
   └─ If customer has Stripe account connected
   └─ If Stripe API key available to AI
   └─ RISKY: Customer credentials to AI system

4. Send invoice to customer
   └─ Via GHL workflow
   └─ Workflow sends email with Stripe payment link

5. Webhook: Stripe payment received
   └─ Stripe webhook fires
   └─ System updates GHL contact status

6. Webhook: GHL contact status updated
   └─ Workflow detects status change
   └─ Workflow triggers completion actions
```

### Requirements for Stripe Direct

**Pros**:
- ✅ Stripe API has full invoice/charge capabilities
- ✅ Mature payment processing
- ✅ Well-documented

**Cons**:
- ❌ Requires Stripe account (customer must have one)
- ❌ Requires Stripe API key (security concern)
- ❌ Requires separate integration & syncing
- ❌ Complex error handling
- ⚠️ Not truly "GHL standalone"

---

## 6. Investigation Plan: Immediate Actions

### Action 1: Network Inspection (1-2 hours)

```bash
# Terminal 1: Start Puppeteer inspection
cd /Users/rayg/repos/max-ai/platform/tools/ghl-token-investigation
npm run inspect-apis

# In the browser:
# 1. Login
# 2. Navigate to Invoicing/Billing section
# 3. Create a test invoice
# 4. Note any network activity
# 5. Exit
```

### Action 2: Analyze Captured Data (30 min)

```bash
# After inspection completes:

# Find the latest capture file
ls -lrt ghl-api-capture-*.json | tail -1

# Search for invoice-related calls
cat ghl-api-capture-*.json | grep -i invoice

# Extract headers for billing endpoints
cat ghl-headers-*.json | grep -i -A5 invoice
```

### Action 3: Document Findings (30 min)

If invoice endpoints are found:
- Extract endpoint URLs
- Document required headers
- Extract request/response schemas
- Note rate limits (if present)
- Verify with test calls

### Action 4: Test Workflow Actions (1 hour)

```bash
# If workflow invoice action exists:

1. List available actions:
   GET /v1/actions
   (Look for invoice-related actions)

2. Create test workflow:
   POST /v1/workflows
   {
     "name": "Test Invoice Flow",
     "trigger": "contact.created",
     "actions": [
       {
         "type": "create_invoice",
         "config": {
           "amount": 100,
           "description": "Test"
         }
       }
     ]
   }

3. Test trigger:
   POST /contact (to trigger workflow)

4. Verify invoice created:
   GET /invoices (if endpoint exists)
```

---

## 7. Findings Checklist

Create a discovery checklist to verify:

```
UI API Invoice Creation Discovery Checklist
============================================

[ ] Step 1: Puppeteer Inspection Run
  [ ] Tool executed successfully
  [ ] Browser logged in
  [ ] Invoice created manually via UI
  [ ] Network calls captured
  [ ] Output files generated (ghl-api-capture-*.json)

[ ] Step 2: Network Analysis
  [ ] Searched for "invoice" in captured endpoints
  [ ] Found POST/PUT endpoints for invoicing (Y/N)
  [ ] Extracted headers (admin-token format identified)
  [ ] Extracted request/response bodies

[ ] Step 3: Invoice Endpoint Documentation
  [ ] Endpoint URL documented
  [ ] HTTP method verified (POST/PUT/PATCH)
  [ ] Required headers listed
  [ ] Request schema documented
  [ ] Response schema documented
  [ ] Rate limit info captured (if present)

[ ] Step 4: Workflow Invoice Action Test
  [ ] Listed available workflow actions
  [ ] Found "Create Invoice" or similar action (Y/N)
  [ ] Created test workflow with invoice action
  [ ] Triggered workflow
  [ ] Verified invoice was created

[ ] Step 5: Results
  [ ] Invoice creation API EXISTS: YES/NO
  [ ] Can be called programmatically: YES/NO
  [ ] Requires admin-token: YES/NO
  [ ] Works in workflows: YES/NO
  [ ] Autonomous invoicing feasible: YES/NO

[ ] Step 6: Documentation
  [ ] Findings documented in 06-ui-api-invoice-discovery.md
  [ ] Endpoint specifications added
  [ ] Code examples provided
  [ ] Feasibility updated in Issue #14
```

---

## 8. Potential Outcomes & Implications

### Outcome A: Invoice API EXISTS ✅

**Discovery**: Network inspection reveals `POST /invoices` endpoint exists

**Implications**:
- ✅ **Autonomous invoicing becomes FEASIBLE**
- ✅ **Major feasibility update required**
- ✅ AI can create invoices programmatically
- ⚠️ Requires admin-token (escalated privileges)
- ✅ Workflows can likely use invoice action
- ✅ Hybrid approach no longer needed for billing

**Updated Feasibility**:
- Before: Autonomous billing NOT FEASIBLE
- After: Autonomous billing FEASIBLE (Phase 3 priority)

### Outcome B: Workflow Invoice Action Exists ✅

**Discovery**: Workflows have "Create Invoice" action available

**Implications**:
- ✅ **Users can configure invoice workflows manually**
- ✅ **AI just needs to trigger workflows**
- ✅ **Simplified architecture**
- ✅ **No additional endpoints needed**
- ⚠️ Still requires manual workflow setup

**Updated Feasibility**:
- Before: Manual workaround needed
- After: User-configurable workflows sufficient

### Outcome C: Stripe Integration in Workflows ⚠️

**Discovery**: Workflows can integrate with Stripe directly

**Implications**:
- ✅ Workflows might create Stripe invoices
- ✅ Reduces need for GHL invoice API
- ⚠️ Still requires Stripe account
- ⚠️ Complex multi-system coordination

### Outcome D: No Invoice API Found ❌

**Discovery**: Network inspection finds no invoice creation endpoints

**Implications**:
- ❌ Manual invoicing remains necessary
- ✅ Confirms previous analysis was correct
- ⚠️ Hybrid approach recommended as best solution
- ✓ Provides definitive answer (instead of guessing)

---

## 9. Architecture Decision Points

### Decision 1: Proceed with UI API Investigation?

**Recommendation**: **YES - Strongly Recommended**

**Rationale**:
- Low effort (run Puppeteer tool)
- High impact (could change feasibility verdict)
- Fills critical knowledge gap
- Converts hypothesis to facts

**Timeline**: 2-3 hours investigation time

### Decision 2: If Invoice API Found, How to Use It?

**Option A: Direct UI API Use** (if invoice endpoint exists)
```typescript
async createInvoice(details: InvoiceDetails): Promise<Invoice> {
  const response = await fetch('https://api.gohighlevel.com/v1/invoices', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${this.adminToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      customerId: details.contactId,
      amount: details.amount,
      description: details.description,
      dueDate: details.dueDate,
      autoSend: true
    })
  });
  
  return response.json();
}
```

**Option B: Workflow-Based** (if workflows can create invoices)
```typescript
async createInvoiceViaWorkflow(opportunityId: string): Promise<void> {
  // Workflow configuration (done once by user in GHL UI)
  // Trigger: Opportunity status = "Ready for Invoicing"
  // Action: Create Invoice, Send Email, etc.
  
  // AI just updates opportunity status
  await this.updateOpportunity(opportunityId, {
    status: 'Ready for Invoicing'  // Triggers workflow
  });
  
  // Workflow handles invoice creation
}
```

### Decision 3: Trust vs. Verify Approach

**Trust Approach** (current):
- Accept previous analysis conclusion
- Invoicing not possible
- Use hybrid manual workaround

**Verify Approach** (recommended):
- Run network inspection
- Verify invoice capabilities
- Get definitive answer
- Update architecture based on facts

---

## 10. Implementation Strategy If Invoice API Found

### Phase 1: Verification (2-3 hours)
- Complete network inspection
- Document endpoints
- Create test calls
- Verify authentication

### Phase 2: Integration (3-4 hours)
- Add invoice endpoints to ICRMPort adapter
- Implement RateLimitManager for invoice calls
- Add error handling (invoice duplicates, validation)
- Create test suite

### Phase 3: Workflow Integration (2-3 hours)
- Document how to set up invoice workflows
- Provide workflow templates
- Integration testing
- Documentation

### Phase 4: Full Autonomous Invoicing (1 week)
- Update Phase 3 implementation plan
- Full AI agent billing workflow
- End-to-end testing
- Customer documentation

---

## 11. Risk Mitigation

### Risk 1: Admin-Token Exposure

If UI API requires admin-token:

**Mitigations**:
- ✅ Store admin-token server-side (never in browser)
- ✅ Use short-lived tokens with rotation
- ✅ Audit logs for all invoice operations
- ✅ Rate limiting to detect abuse
- ✅ Separate admin-token from user tokens

### Risk 2: Invoice Duplication

If API is called multiple times:

**Mitigations**:
- ✅ Implement idempotency keys (if supported)
- ✅ Check for existing invoices before creating
- ✅ Queue invoice requests (one at a time)
- ✅ Handle 409 Conflict responses

### Risk 3: Workflow Failures

If workflows are critical to billing:

**Mitigations**:
- ✅ Implement workflow execution monitoring
- ✅ Fallback to manual notification if workflow fails
- ✅ Retry logic with exponential backoff
- ✅ Dead-letter queue for failed operations

---

## 12. Next Steps (Immediate)

1. **Schedule Investigation** (This week)
   - Set aside 2-3 hours
   - Ensure GHL admin access available
   - Prepare Puppeteer inspection environment

2. **Run Network Capture**
   - Execute Puppeteer tool
   - Create invoices via UI
   - Capture all network calls

3. **Analyze Findings**
   - Document discovered endpoints
   - Extract authentication methods
   - Note any limitations

4. **Update Issue #14**
   - Add findings to 06-ui-api-invoice-discovery.md
   - Update feasibility matrix
   - Revise recommendations

5. **Make Feasibility Decision**
   - If API found: Update Phase 3 plan to include autonomous invoicing
   - If not found: Confirm hybrid approach is best solution
   - Either way: Provide definitive answer (not guess)

---

## 13. Success Criteria

Investigation is successful if we can answer:

- [ ] Are invoice creation APIs available in GHL?
- [ ] What headers/authentication do they require?
- [ ] Can they be called programmatically (not just UI)?
- [ ] Do workflows have invoice creation actions?
- [ ] What are the rate limits for invoice operations?
- [ ] Is autonomous invoicing feasible? (YES/NO)
- [ ] If YES: What are specific implementation requirements?
- [ ] If NO: What is the recommended workaround?

---

## Appendix: Puppeteer Inspection Quick Reference

```bash
# Quick start
cd /tools/ghl-token-investigation
npm install
npm run inspect-apis

# The tool will:
# 1. Open browser to https://app.gohighlevel.com
# 2. Wait for you to log in
# 3. Capture all network calls
# 4. Generate JSON files with findings

# Files created:
# - ghl-api-capture-{timestamp}.json       → All API calls
# - ghl-headers-{timestamp}.json           → Headers mapping
# - ghl-console-{timestamp}.json           → Console logs
# - ghl-dom-{timestamp}.json               → DOM analysis
# - ghl-inspection-summary-{timestamp}.json → Summary

# Search for invoice findings:
cat ghl-api-capture-*.json | grep -i "invoice\|charge\|payment\|billing"

# Extract specific endpoint:
cat ghl-api-capture-*.json | jq '.endpoints | keys[]' | grep -i invoice
```

---

## Document Metadata

- **Type**: Investigation & Analysis
- **Issue**: #14 (Supplementary)
- **Status**: In Progress - Awaiting Network Inspection Results
- **Requires**: Network inspection to complete
- **Impact**: Could fundamentally change feasibility verdict
- **Owner**: architect.morgan-lee
- **Next Review**: After network inspection complete

