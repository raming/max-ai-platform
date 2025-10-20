# Documentation Reorganization Plan

**Status**: Planning  
**Priority**: P0  
**Owner**: architect.morgan-lee  
**Date**: 2025-10-20

## Objective

Reorganize all documentation to comply with:
1. `rules/folder-structure-best-practices.md` (canonical structure)
2. `rules/documentation-best-practices.md` (one-file-one-topic, anti-bloat)
3. `rules/architect-design-checklist.md` (extreme AI-agent detail)

## Critical Problems Identified

### 1. Bloated Mega-Docs (SEVERE)
- `ui-framework-spec.md` (783 lines) - mixes 7+ concerns
- `iam-prompt-foundation-spec.md` (517 lines) - combines IAM + Prompt
- `agent-state-management.md` (403 lines) - combines 3 separate topics
- `human-input-management.md` (388 lines) - combines capture + triage + templates

### 2. Missing Folder Structure Compliance
Current structure does NOT match canonical standard:
```
ops/docs/
├── adr/              ✅ OK
├── design/           ⚠️  Needs reorganization
│   ├── architecture/ ❌ MISSING (should exist per standard)
│   ├── components/   ❌ MISSING (should exist per standard)
│   └── impl/         ✅ OK (but needs review)
└── tracker/specs/    ✅ OK
```

### 3. GitHub Issues Lack AI-Agent Detail
All 13 architect issues have:
- ✅ Good structure and acceptance criteria
- ❌ Missing exact commands, code examples, schemas
- ❌ No embedded ERDs/diagrams
- ❌ Insufficient step-by-step procedures

## Target Folder Structure

Per `rules/folder-structure-best-practices.md`:

```
ops/docs/
├── architecture/              # NEW: High-level architecture
│   ├── overview.md           # System architecture overview
│   ├── principles.md         # Design principles
│   ├── layers/               # Layer-specific architecture
│   │   ├── presentation.md
│   │   ├── business-logic.md
│   │   ├── data-access.md
│   │   └── integration.md
│   └── decisions/            # Link to ADRs
│
├── components/                # NEW: Component specifications
│   ├── ui-framework/         # UI framework components
│   │   ├── overview.md
│   │   ├── installation.md
│   │   ├── structure.md
│   │   ├── patterns.md
│   │   ├── integration.md
│   │   ├── testing.md
│   │   └── migration.md
│   ├── iam/                  # IAM component
│   ├── prompt-service/       # Prompt management
│   ├── payments/             # Payment gateway
│   └── [other-components]/
│
├── implementation/            # RENAME from design/impl
│   ├── phase-1/
│   │   ├── README.md         # Phase overview
│   │   ├── iam/              # IAM implementation
│   │   ├── prompt-service/   # Prompt implementation
│   │   └── [other-features]/
│   └── phase-2/
│
├── adr/                       # ✅ Keep as-is
│   └── [existing ADRs]
│
├── guides/                    # NEW: How-to guides
│   ├── deployment/
│   ├── testing/
│   └── debugging/
│
└── reference/                 # NEW: API reference
    ├── apis/
    ├── schemas/
    └── contracts/
```

## Migration Plan

### Phase 1: Split Bloated Mega-Docs

#### 1.1 Split ui-framework-spec.md
**Current**: `ops/docs/design/ui-framework-spec.md` (783 lines)  
**Target**: `ops/docs/components/ui-framework/` (7 focused files)

- [ ] Create `components/ui-framework/overview.md` (~100 lines)
- [ ] Create `components/ui-framework/installation.md` (~150 lines)
- [ ] Create `components/ui-framework/structure.md` (~100 lines)
- [ ] Create `components/ui-framework/patterns.md` (~150 lines)
- [ ] Create `components/ui-framework/integration.md` (~100 lines)
- [ ] Create `components/ui-framework/testing.md` (~100 lines)
- [ ] Create `components/ui-framework/migration.md` (~100 lines)
- [ ] Create `components/ui-framework/README.md` (index with TOC)
- [ ] Delete old `design/ui-framework-spec.md`

#### 1.2 Split iam-prompt-foundation-spec.md
**Current**: `ops/docs/design/impl/phase-1/iam-prompt-foundation-spec.md` (517 lines)  
**Target**: Split into 2 implementation specs

- [ ] Create `implementation/phase-1/iam/implementation-spec.md` (~250 lines)
- [ ] Create `implementation/phase-1/prompt-service/implementation-spec.md` (~250 lines)
- [ ] Delete old `iam-prompt-foundation-spec.md`

#### 1.3 Split agent-state-management.md
**Current**: `ops/docs/ops-template/rules/agent-state-management.md` (403 lines)  
**Target**: 3 focused rule files

- [ ] Create `rules/agent-state-session-files.md` (~150 lines)
- [ ] Create `rules/agent-state-user-inputs.md` (~150 lines)
- [ ] Create `rules/agent-state-recovery.md` (~100 lines)
- [ ] Delete old `agent-state-management.md`

#### 1.4 Split human-input-management.md
**Current**: `ops/docs/ops-template/rules/human-input-management.md` (388 lines)  
**Target**: 3 focused rule files

- [ ] Create `rules/human-input-capture-protocol.md` (~150 lines)
- [ ] Create `rules/human-input-triage-workflow.md` (~150 lines)
- [ ] Create `rules/human-input-templates.md` (~100 lines)
- [ ] Delete old `human-input-management.md`

### Phase 2: Create Component Specifications

For each major system component, create comprehensive specs:

- [ ] `components/iam/` (Identity & Access Management)
- [ ] `components/prompt-service/` (Prompt Management)
- [ ] `components/payments/` (Payment Gateway)
- [ ] `components/messaging/` (Messaging Backbone)
- [ ] `components/feature-flags/` (Feature Flags)
- [ ] `components/orchestrator/` (Declarative Orchestration)
- [ ] `components/crm-calendar/` (CRM & Calendar Ports)
- [ ] `components/llm-provider/` (LLM Provider)

Each component folder should contain:
- `overview.md` - Purpose, responsibilities, boundaries
- `architecture.md` - Component architecture, interfaces
- `data-model.md` - Entities, relationships, schemas
- `api-contracts.md` - API endpoints, DTOs, validation
- `integration.md` - Dependencies, communication patterns
- `testing.md` - Test strategy, fixtures
- `deployment.md` - Deployment considerations
- `README.md` - Index and quick reference

### Phase 3: Enhance GitHub Issues with Implementation Details

For EACH of the 13 architect issues, create companion implementation spec:

**Template**: `ops/tracker/specs/impl/ARCH-{NN}-implementation-spec.md`

#### Required Content (Per architect-design-checklist.md):
1. **Prerequisites** - Exact state required before starting
2. **Step-by-Step Commands** - Copy-pasteable terminal commands
3. **Code Artifacts** - Full interfaces, types, schemas (not fragments)
4. **Configuration Files** - Complete content (not templates)
5. **Data Models** - ERDs, entity definitions, relationships
6. **API Specifications** - OpenAPI/Swagger definitions
7. **Test Cases** - Fixtures, test data, assertions
8. **Validation Steps** - How to verify each step succeeded
9. **Edge Cases** - Explicit if/then handling rules
10. **Rollback Procedure** - How to undo if needed

#### Issues Requiring Implementation Specs:
- [ ] #129: ARCH-UI-01 (NX Library Structure)
- [ ] #14: ARCH-14 (GHL Limitations Assessment)
- [ ] #12: ARCH-13 (Messaging Backbone)
- [ ] #9: ARCH-10 (Feature Flags Framework)
- [ ] #8: ARCH-09 (LLM Provider)
- [ ] #7: ARCH-08 (UI/UX Framework)
- [ ] #6: ARCH-07 (CRM & Calendar Ports)
- [ ] #5: ARCH-06 (Declarative Orchestration)
- [ ] #4: ARCH-05 (Multi-Provider Payments)
- [ ] #3: ARCH-04 (IAM and Prompt Management)
- [ ] #2: ARCH-03 (Reviews/Calendar Onboarding)
- [ ] #1: ARCH-02 (Billing/Usage Collectors)
- [ ] #125: ARCH-UI-02 (Metronic Theme Integration)

### Phase 4: Update All Cross-References

After reorganization, update all references:

- [ ] Update all ADRs with new doc paths
- [ ] Update all issue bodies with new references
- [ ] Update all spec files with new cross-links
- [ ] Update `.agents/rules/context.md` with new structure
- [ ] Update role prompts with new documentation paths
- [ ] Run `scripts/sync-github-prompts.sh` to sync prompts

### Phase 5: Validation & Cleanup

- [ ] Verify all docs follow one-file-one-topic
- [ ] Verify no doc exceeds ~300 lines (5 pages)
- [ ] Verify all components have complete layer specs
- [ ] Verify all issues link to implementation specs
- [ ] Remove all deprecated/old doc files
- [ ] Create migration guide for team
- [ ] Update onboarding documentation

## Success Criteria

### Documentation Structure
- [x] All docs comply with `folder-structure-best-practices.md`
- [ ] No mega-docs over 300 lines
- [ ] All components have complete specifications
- [ ] Clear separation of architecture/components/implementation

### AI-Agent Readiness
- [ ] All GitHub issues have implementation specs
- [ ] All specs include exact commands and code examples
- [ ] All data models have ERDs
- [ ] All APIs have OpenAPI/Swagger specs
- [ ] All edge cases explicitly documented

### Maintainability
- [ ] All cross-references updated
- [ ] All docs have proper traceability (tracker links)
- [ ] Index/README files guide navigation
- [ ] Team can find docs easily

## Impact Assessment

### Affected GitHub Issues
- 13 architect issues need implementation spec companions
- 0 dev issues (none exist yet)
- 0 QA issues (none exist yet)

### Affected Documentation Files
- 4 mega-docs to split (high priority)
- ~20 design docs to reorganize
- ~50 references to update

### Team Impact
- Architect: 2-3 days focused work
- Dev team: Minimal (no active implementation yet)
- QA team: Minimal (no active testing yet)
- Human stakeholder: Review reorganization plan

## Timeline

**Total Estimated Effort**: 2-3 days

- **Day 1**: Phase 1 (Split mega-docs) + Phase 2 start (Create component folders)
- **Day 2**: Phase 2 complete (Component specs) + Phase 3 start (Implementation specs)
- **Day 3**: Phase 3 complete + Phase 4 (Cross-references) + Phase 5 (Validation)

## Dependencies

**None** - This work can begin immediately and is a prerequisite for all dev/QA work.

## References

- `rules/folder-structure-best-practices.md` - Canonical structure standard
- `rules/documentation-best-practices.md` - Documentation principles
- `rules/architect-design-checklist.md` - Design deliverables checklist
- Issue #146: Documentation Policy Compliance Audit (parent tracking issue)
