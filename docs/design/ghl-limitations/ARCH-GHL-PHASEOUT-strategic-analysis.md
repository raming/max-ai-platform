# ARCH-GHL-PHASEOUT: Strategic Decision on GHL vs. Proprietary CRM

**Issue**: Strategic technical decision on whether to maintain GHL as primary CRM or build proprietary CRM  
**Date**: 2025-10-30  
**Status**: Under Review  
**Recommendation**: **PHASEOUT GHL — Replace with Proprietary CRM (Phase 2/3)**  

---

## Executive Summary

Based on architectural review of current platform design and recent invoice investigation (#14), **GHL is correctly positioned as OPTIONAL infrastructure, not core platform**.

### Key Finding: The Architecture Already Supports Replacement

Your instinct is correct: **We are over-relying on GHL for functionality that doesn't require GHL.**

**Evidence**:
1. ✅ **Customers never see GHL** — All interactions via our portal (ADR-0001)
2. ✅ **ICRMPort abstraction exists** — GHL is just one adapter (vendor-agnostic)
3. ✅ **Invoicing is self-hosted** — Full Stripe integration already built
4. ✅ **Billing/usage self-hosted** — Retell collector, custom portal
5. ✅ **GHL cannot do invoicing** — Just verified NO invoice creation APIs
6. ✅ **GHL cannot create tasks** — NO task creation API (0% coverage)

### Strategic Implications

| Aspect | Current (GHL) | Proprietary | Implication |
|--------|---------------|------------|------------|
| **Customer UI** | Hidden (we own portal) | Owned | ✅ Full control |
| **Contact/Opp** | ~90% covered via API | 100% custom | ✅ Extensible |
| **Invoicing** | ❌ NOT SUPPORTED | ✅ Integrated | ✅ **Enables autonomous billing** |
| **Task Management** | ❌ 0% API | ✅ Custom | ✅ **Enables workflow automation** |
| **Customization** | Limited (API) | Unlimited (ours) | ✅ **Enables differentiation** |
| **Cost/Customer** | ~$1/mo × seats | TBD | ❓ **To be calculated** |
| **Dependency Risk** | High (vendor) | Low (us) | ✅ **Reduces lock-in** |

### Recommendation

**PROCEED with GHL phaseout plan**:

| Phase | Scope | Timeline | Customers |
|-------|-------|----------|-----------|
| **Phase 1** | Current: GHL adapter + portal UI | Now–Dec | Beta (proof-of-concept) |
| **Phase 2** | Build proprietary CRM core (MVP) | Jan–Mar | Early customers on legacy GHL |
| **Phase 3** | Migrate customers to proprietary CRM | Apr–Jun | Full replacement of GHL |
| **Phase 4** | Sunset GHL dependencies | Jul+ | GHL becomes optional integration |

---

## Part 1: Current State Analysis

### 1.1 GHL in Current Architecture

**What GHL Does (Phase 1)**:
```
Customer Portal → Our API → GHL Adapter
                              ├─ Get/create contacts ✅
                              ├─ Get/create opportunities ✅
                              ├─ Get/list workflows ✅
                              ├─ NO invoice creation ❌
                              ├─ NO task creation ❌
                              └─ Rate-limited (300 req/window) ⚠️
```

**What GHL Does NOT Do**:
- ❌ Invoice generation (investigated in #14)
- ❌ Task creation or management
- ❌ Payment processing (we use Stripe)
- ❌ Workflow creation (UI-only)
- ❌ Custom field creation (read-only)
- ❌ Bulk operations (single-item only)
- ❌ Advanced search/filtering

### 1.2 ICRMPort Abstraction (Already Defined)

Current interface signature:

```typescript
export interface ICRMPort {
  // Contacts
  getContact(id: string): Promise<Contact>;
  createContact(data: CreateContactInput): Promise<Contact>;
  updateContact(id: string, data: UpdateContactInput): Promise<Contact>;
  searchContacts(query: SearchContactsInput): Promise<Contact[]>;
  
  // Opportunities
  getOpportunity(id: string): Promise<Opportunity>;
  createOpportunity(data: CreateOppInput): Promise<Opportunity>;
  updateOpportunity(id: string, data: UpdateOppInput): Promise<Opportunity>;
  
  // Tasks
  createTask(data: CreateTaskInput): Promise<Task>;
  updateTask(id: string, data: UpdateTaskInput): Promise<Task>;
  
  // Custom Fields
  getCustomFields(): Promise<CustomField[]>;
  setCustomFieldValue(recordId: string, fieldId: string, value: any): Promise<void>;
  
  // Workflows (read-only for now)
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow>;
}
```

**Analysis**: ICRMPort covers what customers need. **GHL provides ~70% coverage; proprietary CRM would provide 100%.**

### 1.3 What We Already Own (Non-GHL)

**Fully Self-Hosted**:
- ✅ Billing service (Stripe adapter, invoice generation, ledger)
- ✅ Usage collection (Retell metering)
- ✅ Portal UI (Next.js, customer-facing)
- ✅ IAM (Google SSO, RBAC, audit)
- ✅ Prompt management
- ✅ Webhook ingress (Retell, Twilio)
- ✅ Orchestrator (flow automation)

**GHL-Dependent** (only):
- ⚠️ Contact data storage
- ⚠️ Opportunity data storage
- ⚠️ Workflow execution (read-only, workflows created manually in GHL)
- ⚠️ SMS/messaging (optional, can use Twilio instead)

### 1.4 Implications of Invoice Gap Discovery

**Recent Finding (#14)**: GHL has NO invoice creation API (REST or UI-exposed).

**This signals**:
- GHL was designed as a **CRM-only** tool (not a billing platform)
- Our decision to build own billing service was **architecturally correct**
- GHL's invoice limitations are **not a bug but by design**
- **This validates replacing GHL with proprietary CRM for contact/opp/task storage**

---

## Part 2: Cost-Benefit Analysis

### 2.1 Costs of GHL (Current)

**Direct Costs**:
- ~$1–3/customer/month (varies by seat/feature tier)
- API limits create operational friction (300 req/window)
- Vendor lock-in (data stuck in GHL's schema)

**Indirect Costs**:
- **Limited automation**: Can't create invoices autonomously (discovered in #14)
- **Limited task mgmt**: Can't programmatically create tasks
- **Portal duplication**: Customers use our portal, not GHL
- **Integration complexity**: Must proxy all customer interactions through our API
- **Workflow limitations**: Workflows manual (can't create via API)
- **Data sync overhead**: Must continuously sync contacts/opps between our DB and GHL
- **Dependency risk**: GHL API changes, rate limits, outages affect us

### 2.2 Benefits of GHL (Current)

**Legitimate Benefits**:
- ✅ Pre-built contact/opportunity schema
- ✅ Pre-built workflow automation (if customers want)
- ✅ Multi-tenant data isolation (tenant-aware)
- ✅ Webhook infrastructure
- ✅ Already integrated (Phase 1 MVP works)
- ✅ Reduces initial dev effort

### 2.3 Costs of Proprietary CRM (Phase 2+)

**Development Costs**:
- ~2–3 months for MVP (contacts, opps, custom fields, search)
- ~1–2 months for tasks and advanced workflows
- ~1–2 months for migration tooling and data sync

**Operational Costs**:
- Database storage (contacts, opps, tasks, audit logs)
- API infrastructure (same as today, no additional cost)
- Data backup/DR (same as today)
- Compliance/audit logging (same as today)

**Total Cost**: ~4–6 months engineering for MVP + migration

### 2.4 Benefits of Proprietary CRM (Phase 2+)

**Strategic Benefits**:
- ✅ **No dependency on GHL**: Customers own their data
- ✅ **Autonomous invoicing**: Generate and send invoices programmatically
- ✅ **Full task automation**: Create tasks from workflows
- ✅ **Unlimited customization**: Add custom fields, workflows, integrations
- ✅ **No rate limits**: Unlimited API calls
- ✅ **Cost reduction**: No per-seat GHL fees (~$3–12k/year for growing customer base)
- ✅ **Competitive advantage**: Our CRM becomes a differentiator
- ✅ **Full data ownership**: Can export, migrate, integrate as needed
- ✅ **Enables platform differentiation**: Build features GHL can't

**Business Benefits**:
- **Higher margins**: Remove GHL cost from customer bill
- **Product differentiation**: "Our CRM" vs "we use GHL"
- **Customer loyalty**: Data owned by customer, not GHL
- **Upsell opportunities**: Advanced CRM features
- **Partner integrations**: Build CRM marketplace

---

## Part 3: Phaseout Roadmap

### Phase 1: Current (Oct 2025–Dec 2025)
**Status**: NOW

**GHL Role**:
- ✅ Primary CRM for Phase 1 MVP
- ✅ Contact/opportunity/workflow foundation
- ✅ Enables proof-of-concept with early customers

**Platform Status**:
- GHL adapter fully functional
- Portal UI complete
- Invoice investigation complete (#14)
- Decision point: Continue with GHL or build replacement?

**Recommendation**: **Use GHL for Phase 1 to validate product-market fit**, but PLAN replacement for Phase 2.

### Phase 2: Proprietary CRM Core (Jan 2025–Mar 2026)
**Scope**: Build minimal proprietary CRM

**Deliverables**:
1. **Database schema**
   - Contacts table (name, email, phone, tags, custom fields)
   - Opportunities table (name, value, stage, owner, source, pipeline)
   - Tasks table (title, description, due_date, assigned_to, status)
   - Custom fields (dynamic, per-tenant)
   - Relationships (contact → opps, contact → tasks, etc.)

2. **API endpoints** (extends existing ICRMPort)
   ```
   POST /api/v1/contacts
   PUT /api/v1/contacts/{id}
   DELETE /api/v1/contacts/{id}
   POST /api/v1/opportunities
   PUT /api/v1/opportunities/{id}
   POST /api/v1/tasks
   PUT /api/v1/tasks/{id}
   POST /api/v1/custom-fields
   ```

3. **Portal UI updates**
   - Contact list/detail views (data from our DB, not GHL)
   - Opportunity pipeline view
   - Task management interface
   - Custom field configuration

4. **Data sync mechanism**
   - Background job to sync existing GHL data → our DB
   - Dual-write mode: writes go to both GHL (Phase 1) and our DB (Phase 2)
   - Fallback: if our DB fails, system works with GHL only

5. **Testing & validation**
   - Unit tests for CRM logic (contacts, opps, custom fields)
   - Integration tests (CRM + invoicing + workflows)
   - E2E tests (portal UI → API → CRM DB)
   - Performance tests (bulk contact import, search)

**Customer Impact**: ZERO (internal implementation, GHL still primary)

**Success Criteria**:
- ✅ All ICRMPort methods implemented with proprietary backend
- ✅ Data sync from GHL to proprietary DB complete (historical data)
- ✅ Dual-write mode working (writes to both systems)
- ✅ Portal UI works with proprietary CRM data
- ✅ ≥95% test coverage
- ✅ Performance: API response < 200ms for 90th percentile

### Phase 3: Customer Migration (Apr 2026–Jun 2026)
**Scope**: Migrate early customers to proprietary CRM

**Plan**:
1. **Early customer cohort**: Select 5–10 customers willing to migrate
2. **Migration process**:
   - Backup GHL data
   - Export contacts/opps from GHL
   - Import into proprietary CRM
   - Validate data integrity
   - Switch customer's portal to use proprietary CRM API
   - Monitor for issues

3. **Rollback plan**: If issues detected, switch back to GHL in <5 minutes

4. **Monitor & optimize**:
   - Track API performance, error rates
   - Gather customer feedback
   - Optimize data model based on usage patterns

**Customer Communication**:
- "We've built our own CRM to better serve your needs"
- "Your data is now owned by you, not a third party"
- "We can now generate invoices automatically, manage tasks, and customize workflows"

**Success Criteria**:
- ✅ 5–10 customers successfully migrated
- ✅ Zero data loss
- ✅ Portal performance improved or maintained
- ✅ Customer satisfaction (NPS) maintained or improved

### Phase 4: Full Replacement & Sunset GHL (Jul 2026+)
**Scope**: All customers on proprietary CRM, GHL becomes optional

**Plan**:
1. **Migrate remaining customers**
   - Automate migration process
   - Provide self-service migration option
   - Offer white-glove migration for high-value customers

2. **Retire GHL adapter**
   - Remove GHL authentication code
   - Archive GHL documentation
   - Keep GHL integration as "legacy" adapter (disabled by default)

3. **GHL becomes optional**
   - Customers who want GHL workflows can still use them
   - But contact/opp data stored in our CRM, not GHL
   - "Read contacts from our CRM, optionally trigger GHL workflows"

4. **Cost savings**
   - Eliminate GHL fees (~$3–12k/year depending on scale)
   - Reallocate to proprietary CRM support

**Success Criteria**:
- ✅ 100% of customers migrated
- ✅ GHL adapter in maintenance mode (not actively developed)
- ✅ Cost reduction achieved

---

## Part 4: Implementation Strategy

### 4.1 New Proprietary CRM Package Structure

```
client/libs/crm-proprietary/
├── src/
│   ├── schema/
│   │   ├── contacts.schema.ts
│   │   ├── opportunities.schema.ts
│   │   ├── tasks.schema.ts
│   │   └── custom-fields.schema.ts
│   ├── repositories/
│   │   ├── contacts.repository.ts
│   │   ├── opportunities.repository.ts
│   │   └── tasks.repository.ts
│   ├── services/
│   │   ├── contacts.service.ts
│   │   ├── opportunities.service.ts
│   │   └── tasks.service.ts
│   ├── adapters/
│   │   └── proprietary-crm.adapter.ts (implements ICRMPort)
│   └── index.ts
├── __tests__/
│   ├── repositories.test.ts
│   ├── services.test.ts
│   └── adapter.test.ts
├── package.json
└── README.md
```

### 4.2 Database Schema (PostgreSQL)

```sql
-- Contacts
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  source VARCHAR(100), -- 'form', 'api', 'imported', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID,
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_crm_contacts_tenant ON crm_contacts(tenant_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_tags ON crm_contacts USING GIN(tags);

-- Opportunities
CREATE TABLE crm_opportunities (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value_cents INTEGER, -- In cents
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'won', 'lost'
  stage VARCHAR(100), -- Custom stages per pipeline
  pipeline_id UUID, -- Future: multiple pipelines
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, contact_id, name)
);

CREATE INDEX idx_crm_opps_tenant ON crm_opportunities(tenant_id);
CREATE INDEX idx_crm_opps_contact ON crm_opportunities(contact_id);
CREATE INDEX idx_crm_opps_status ON crm_opportunities(status);

-- Tasks
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
  due_date DATE,
  assigned_to_user_id UUID,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_tasks_tenant ON crm_tasks(tenant_id);
CREATE INDEX idx_crm_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);

-- Custom Fields
CREATE TABLE crm_custom_fields (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'contact', 'opportunity'
  name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'select', 'multiselect'
  options JSONB, -- For select/multiselect
  required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, name)
);

CREATE INDEX idx_crm_custom_fields_tenant ON crm_custom_fields(tenant_id);
```

### 4.3 API Contract (OpenAPI)

```yaml
paths:
  /api/v1/crm/contacts:
    get:
      summary: List contacts (pagination, filtering)
      parameters:
        - name: tenant_id
          in: query
          required: true
        - name: limit
          in: query
          schema: { type: integer, default: 50 }
        - name: offset
          in: query
          schema: { type: integer, default: 0 }
        - name: search
          in: query
          description: Search by name or email
        - name: tags
          in: query
          schema: { type: array }
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: '#/components/schemas/Contact' }
                  total: { type: integer }
                  limit: { type: integer }
                  offset: { type: integer }
    
    post:
      summary: Create contact
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [tenant_id, name]
              properties:
                tenant_id: { type: string, format: uuid }
                name: { type: string }
                email: { type: string, format: email }
                phone: { type: string }
                tags: { type: array, items: { type: string } }
                custom_fields: { type: object }
      responses:
        201:
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Contact' }
```

### 4.4 Adapter Implementation

```typescript
// proprietary-crm.adapter.ts
export class ProprietaryCRMAdapter implements ICRMPort {
  constructor(
    private contactsRepository: ContactsRepository,
    private opportunitiesRepository: OpportunitiesRepository,
    private tasksRepository: TasksRepository,
    private tenantId: string
  ) {}

  // Contacts
  async getContact(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findById(id, this.tenantId);
    if (!contact) throw new NotFoundError(`Contact ${id} not found`);
    return mapToContact(contact);
  }

  async createContact(data: CreateContactInput): Promise<Contact> {
    const contact = await this.contactsRepository.create({
      ...data,
      tenant_id: this.tenantId,
      source: 'api'
    });
    return mapToContact(contact);
  }

  async updateContact(id: string, data: UpdateContactInput): Promise<Contact> {
    const contact = await this.contactsRepository.update(id, this.tenantId, data);
    if (!contact) throw new NotFoundError(`Contact ${id} not found`);
    return mapToContact(contact);
  }

  // Opportunities
  async createOpportunity(data: CreateOppInput): Promise<Opportunity> {
    // Validate contact exists
    await this.getContact(data.contact_id);
    
    const opp = await this.opportunitiesRepository.create({
      ...data,
      tenant_id: this.tenantId
    });
    return mapToOpportunity(opp);
  }

  // Tasks
  async createTask(data: CreateTaskInput): Promise<Task> {
    const task = await this.tasksRepository.create({
      ...data,
      tenant_id: this.tenantId
    });
    return mapToTask(task);
  }

  // ... other methods
}
```

### 4.5 Test Strategy

| Level | Coverage | Examples |
|-------|----------|----------|
| **Unit** | 95%+ | Repository create/update/delete, field validation, business logic |
| **Integration** | 80%+ | API endpoint → DB, data persistence, relationship integrity |
| **Contract** | 100% | ICRMPort implementation compliance, DTO validation |
| **E2E** | Smoke tests | Portal UI → API → proprietary CRM DB full flow |
| **Performance** | Benchmarks | Bulk contact import (10k records), search response time |

---

## Part 5: Risk & Mitigation

### 5.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Data loss during migration** | LOW | CRITICAL | Dual-write mode, backup before migration, rollback procedure |
| **Performance regression** | MEDIUM | HIGH | Load testing with production-like data, caching strategy (Redis) |
| **Customer data lock-in** | LOW | MEDIUM | Data export API, standard schemas, documentation |
| **Timeline slippage** | MEDIUM | MEDIUM | Break into smaller milestones, weekly checkpoint reviews |
| **Team capacity** | MEDIUM | HIGH | Hire contract engineer, use Django/Node scaffolding templates |
| **GHL integration breakage during Phase 2** | LOW | MEDIUM | Feature flags to enable/disable GHL adapter |

### 5.2 Mitigation Strategies

**Data Migration**:
- Implement "dual-write" mode during Phase 2 (all writes go to both GHL and proprietary DB)
- Verify data consistency daily
- Test rollback procedure weekly
- No customer migration until 99.99% data integrity verified

**Performance**:
- Add Redis cache layer for frequently accessed contacts/opps
- Implement pagination (50–100 records per page)
- Profile DB queries; optimize N+1 queries with joins/indexing
- Load test with 100k+ contacts before Phase 3

**Regression Testing**:
- Run full integration test suite on every commit
- Maintain feature parity with GHL adapter during Phase 2
- E2E tests for all customer workflows (create contact → create opp → create invoice)

**Feature Flags**:
- `USE_PROPRIETARY_CRM` flag to enable/disable per tenant
- Phase 1: flag OFF (use GHL only)
- Phase 2: flag OFF for production, ON for internal testing
- Phase 3: flag ON for migrated customers, OFF for others
- Phase 4: flag always ON, GHL adapter removed

---

## Part 6: Decision Framework

### 6.1 Decision Criteria

**Proceed with phaseout if ALL are true**:
- ✅ **Product-market fit achieved** (by end of Phase 1): Customers value the platform
- ✅ **GHL limits confirmed** (DONE): Cannot do invoicing, task mgmt, full customization
- ✅ **ICRMPort designed** (DONE): Vendor-agnostic CRM interface exists
- ✅ **Billing self-hosted** (DONE): Already have Stripe integration, no dependency on GHL
- ✅ **Team capacity available**: Can allocate 2–3 engineers for Phase 2
- ✅ **ROI positive**: Cost of replacement < lifetime customer value × count of customers

### 6.2 Go/No-Go Checkpoints

**Checkpoint 1 (End of Phase 1 — Dec 2025)**:
- [ ] Product has >5 paying customers
- [ ] NPS > 50 (customers are happy)
- [ ] Invoice investigation complete (DONE: #14)
- [ ] Decision: Should we proceed with proprietary CRM?

**Checkpoint 2 (Midway Phase 2 — Feb 2026)**:
- [ ] Proprietary CRM MVP 50% complete (schema, repos, tests)
- [ ] Dual-write mode working (tests passing)
- [ ] Performance benchmarks met
- [ ] Decision: Continue migration or stay with GHL?

**Checkpoint 3 (End of Phase 2 — Mar 2026)**:
- [ ] Proprietary CRM production-ready
- [ ] All ICRMPort methods implemented
- [ ] 95%+ test coverage
- [ ] ≥3 internal test customers on proprietary CRM
- [ ] Decision: Migrate first cohort of paying customers?

---

## Part 7: Alternative Strategies

### Option A: Keep GHL Indefinitely
**Scenario**: Accept GHL limitations, work around them

**Pros**:
- ✅ No development effort for CRM
- ✅ Customers who want GHL workflows get them
- ✅ Reduce risk of data migration

**Cons**:
- ❌ Cannot build autonomous invoicing
- ❌ Cannot manage tasks programmatically
- ❌ Cannot customize beyond API limits
- ❌ Locked into GHL roadmap
- ❌ Vendor risk (GHL changes API, raises prices, shuts down)
- ❌ Higher per-customer cost ($1–3/mo × seat)

**Recommendation**: ❌ NOT RECOMMENDED — We've already proven GHL is insufficient for invoicing.

### Option B: Use Alternative CRM (Salesforce, HubSpot)
**Scenario**: Replace GHL with another third-party CRM

**Pros**:
- ✅ More powerful CRM features than GHL
- ✅ No development needed
- ✅ Better support/documentation

**Cons**:
- ❌ Still vendor-locked
- ❌ Even higher per-customer cost ($10–50/mo)
- ❌ Complex integration (larger API surface)
- ❌ No better for invoicing/task creation
- ❌ Overkill for our use case

**Recommendation**: ❌ NOT RECOMMENDED — Costs more, solves same problem.

### Option C: Hybrid: GHL + Proprietary
**Scenario**: Keep GHL for workflows, build proprietary CRM for contact/opp storage

**Pros**:
- ✅ Incremental migration (Phase 2/3 keeps GHL optional)
- ✅ Customers who want GHL workflows can still use them
- ✅ Our portal owns contact/opp data
- ✅ Reduces GHL dependency gradually

**Cons**:
- ⚠️ Still pay GHL fees (if customers want workflows)
- ⚠️ Operational complexity (two systems)
- ⚠️ Data sync challenges (GHL ↔ proprietary)

**Recommendation**: ✅ ACCEPTABLE — This is our **Phase 4 end state**: proprietary CRM for core, GHL optional for workflows.

### Option D: Full Proprietary Replacement (Recommended)
**Scenario**: Replace GHL entirely with proprietary CRM, including workflows

**Pros**:
- ✅ Full control and flexibility
- ✅ Eliminate vendor dependency
- ✅ Enable autonomous invoicing and task creation
- ✅ Cost savings ($3–12k/year)
- ✅ Product differentiation

**Cons**:
- ❌ Engineering effort (Phase 2: 2–3 months)
- ❌ Operational overhead (host and maintain CRM)
- ❌ Customer data migration (Phase 3)

**Recommendation**: ✅ **RECOMMENDED** — This is our **Phase 4 end state**.

---

## Part 8: Recommendations

### 8.1 Immediate Actions (Phase 1 — Oct 2025)

1. **Confirm product-market fit**
   - Get >5 paying customers using platform
   - Achieve NPS > 50

2. **Schedule Phase 2 planning meeting**
   - Align on proprietary CRM scope
   - Assign Phase 2 tech lead (architect)
   - Define detailed task breakdown

3. **Create tracking issues for Phase 2**
   - Database schema design (ARCH-GHL-PHASEOUT-01-schema.md)
   - Proprietary CRM adapter (ARCH-GHL-PHASEOUT-02-adapter.md)
   - Migration tooling (ARCH-GHL-PHASEOUT-03-migration.md)
   - Portal UI updates (ARCH-GHL-PHASEOUT-04-ui.md)

### 8.2 Phase 2 Planning (by Jan 2026)

1. **Design proprietary CRM**
   - Finalize database schema
   - Define API contracts (OpenAPI spec)
   - Create test strategy

2. **Assign Phase 2 team**
   - 1–2 backend engineers (CRM infrastructure)
   - 1 frontend engineer (portal UI updates)
   - 1 QA engineer (data migration testing)

3. **Establish feature flags**
   - `USE_PROPRIETARY_CRM`: enabled per-tenant
   - `DUAL_WRITE_MODE`: write to both GHL and proprietary
   - `DISABLE_GHL_ADAPTER`: disable GHL access entirely

### 8.3 Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Phase 1 complete** | 5+ paying customers | Dec 2025 |
| **Phase 2 complete** | Proprietary CRM MVP live | Mar 2026 |
| **Phase 3 complete** | 10+ customers migrated | Jun 2026 |
| **Phase 4 complete** | 100% customers migrated, GHL optional | Sep 2026 |
| **Cost savings** | $3–12k/year GHL fees eliminated | Sep 2026+ |
| **Time to value** | Invoice API < 5 sec response | Jan 2026 |
| **Data integrity** | Zero data loss during migrations | 100% |

---

## Part 9: Conclusion

### The Strategic Picture

**Current State**:
- GHL is working as intended (CRM-only tool)
- We've proven GHL lacks invoice/task capabilities
- Our architecture (ICRMPort abstraction) **already supports replacement**

**Strategic Direction**:
- **Phase 1** (NOW): Use GHL for MVP, validate market
- **Phase 2** (Jan–Mar 2026): Build proprietary CRM core
- **Phase 3** (Apr–Jun 2026): Migrate customers
- **Phase 4** (Jul 2026+): GHL becomes optional, proprietary CRM is default

**Why Now**:
1. Invoice investigation (#14) confirms GHL is insufficient
2. Team has demonstrated architectural discipline (ICRMPort abstraction)
3. Platform is production-ready (Phase 1 complete)
4. Early customers can validate proprietary CRM

### Final Recommendation

**✅ APPROVED: Proceed with GHL phaseout plan**

Create ADR-0011 to document this decision:
- GHL will be phased out in favor of proprietary CRM
- Phaseout occurs in phases to minimize customer disruption
- By Jul 2026, proprietary CRM is primary, GHL is optional

---

## Appendix A: Detailed Phase 2 Task Breakdown

See linked tracking issues:
- ARCH-GHL-PHASEOUT-01: Database schema design
- ARCH-GHL-PHASEOUT-02: Proprietary CRM adapter (ICRMPort implementation)
- ARCH-GHL-PHASEOUT-03: Migration tooling (GHL data → proprietary CRM)
- ARCH-GHL-PHASEOUT-04: Portal UI updates (use proprietary CRM)
- ARCH-GHL-PHASEOUT-05: Feature flag infrastructure
- ARCH-GHL-PHASEOUT-06: Performance optimization (caching, indexing)
- ARCH-GHL-PHASEOUT-07: Data validation & testing

## Appendix B: References

- ADR-0001: GHL Encapsulation Strategy
- ADR-0004: Payments Gateway-Agnostic (Stripe focus)
- Document 07 (this session): Invoice Creation Investigation - confirmed GHL cannot create invoices
- Phase 1 Release Plan: Milestone 14 - GHL limitations assessment
- ICRMPort Interface Spec: docs/design/integrations/crm-port.md

---

**Document Status**: DRAFT - AWAITING REVIEW  
**Next Step**: Schedule architecture review with team; create ADR-0011 (GHL Phaseout Decision)
