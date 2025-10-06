# Nx Compliance Audit - Phase 1 MaxAI Platform

## Executive Summary

This audit reviews Phase 1 implementations for compliance with the established Nx workspace structure (`client/docs/nx-foldering.md`). The analysis identifies current violations and provides specific refactoring guidance to ensure all client-side applications and services follow proper Nx conventions.

## Current State Analysis

### ✅ Correctly Placed Assets
- **Nx Workspace Setup**: `client/nx.json` - properly configured with plugins
- **Documentation**: `client/docs/nx-foldering.md` - comprehensive foldering guide
- **Ops Tooling**: Located correctly outside client workspace in `ops/tools/`

### ❌ Violations Found

#### 1. Missing Required Nx Structure
**Issue**: The client workspace lacks the required `apps/` and `libs/` directories
**Impact**: All Phase 1 development work has no proper structure to follow

**Required Structure Missing**:
```
client/
  apps/           # ❌ MISSING - deployable applications
  libs/           # ❌ MISSING - shared libraries  
```

#### 2. Future Violation Risk: Webhook Service
**Current**: `ops/tools/webhook-echo/` (Express.js service)
**Issue**: This is positioned as a "tool" but is actually a deployable API service
**Risk**: When this moves to production, it should be in the Nx workspace as `client/apps/webhook-api/`

## Required Refactoring Plan

### Phase 1A: Initialize Nx Structure (Immediate)

**Priority**: P0 - Must be completed before any application development begins

1. **Create Required Directories**:
   ```bash
   cd client
   mkdir -p apps libs
   ```

2. **Install Required Nx Plugins**:
   ```bash
   cd client
   npm install -D @nx/next @nx/nest @nx/jest @nx/eslint @nx/js typescript jest ts-jest eslint
   ```

3. **Generate Initial Applications** (based on Phase 1 requirements):
   ```bash
   # Web portal for onboarding wizard and console
   npx nx g @nx/next:app web --tags="type:app,framework:next,domain:core"
   
   # Main API service for backend operations
   npx nx g @nx/nest:app api --tags="type:app,framework:nest,domain:core"
   
   # Webhook ingress service (migrate from ops/tools/webhook-echo)
   npx nx g @nx/nest:app webhook-api --tags="type:app,framework:nest,domain:integration"
   ```

4. **Generate Core Libraries**:
   ```bash
   # Shared validation schemas and contracts
   npx nx g @nx/js:lib shared/validation --directory=libs --tags="type:lib,layer:shared"
   
   # IAM and authentication
   npx nx g @nx/js:lib shared/auth --directory=libs --tags="type:lib,layer:shared,domain:iam"
   
   # Configuration management
   npx nx g @nx/js:lib shared/config --directory=libs --tags="type:lib,layer:shared"
   
   # Feature flags framework
   npx nx g @nx/js:lib shared/feature-flags --directory=libs --tags="type:lib,layer:shared"
   ```

### Phase 1B: Migrate Existing Work

**Priority**: P1 - Required before continuing development

1. **Migrate Webhook Echo Service**:
   ```bash
   # Move ops/tools/webhook-echo -> client/apps/webhook-api
   # Update to use Nx build/serve targets
   # Preserve existing validation logic
   ```

2. **Contract Schemas Migration**:
   ```bash
   # Move ops/docs/contracts/*.schema.json -> client/libs/shared/validation/src/schemas/
   # Update imports in migrated webhook service
   ```

### Phase 1C: Issue-Specific Requirements

Based on Phase 1 issues analysis, the following applications/libraries must be created:

#### Applications (client/apps/)
1. **web** - Next.js portal for onboarding wizard (#23, #33-41)
2. **api** - NestJS main API service (#49-52, authentication/IAM)
3. **webhook-api** - NestJS webhook ingress (#38, migrate from webhook-echo)

#### Libraries (client/libs/)

**Domain Libraries**:
- `domain/onboarding/core` - Onboarding business logic
- `domain/iam/core` - IAM domain models
- `domain/templates/core` - Template registry logic

**Data Access Libraries**:
- `data-access/keycloak` - Keycloak OIDC integration (#49)
- `data-access/ghl` - GHL API clients
- `data-access/supabase` - Supabase client (#32)
- `data-access/template-registry` - Template registry API

**Feature Libraries**:
- `feature/onboarding-wizard` - Wizard UI components (#23, #33-41)
- `feature/authentication` - Auth guards and middleware (#49-50)
- `feature/contract-validation` - JSON schema validation (#51)

**Shared Libraries**:
- `shared/validation` - JSON schemas and validators (#51)
- `shared/config` - Environment and configuration
- `shared/auth` - Authentication utilities
- `shared/feature-flags` - Feature flag framework (#45)

**UI Libraries**:
- `ui/components` - Shared UI components
- `ui/wizard` - Wizard-specific components

## Phase 1 Issues Requiring Nx Compliance Updates

### High Priority (P0) Issues
- **#23**: DEV-ONB-01 - Wizard scaffolding → Requires `apps/web` and `feature/onboarding-wizard`
- **#49**: OIDC verify middleware → Requires `libs/shared/auth` and `data-access/keycloak`
- **#51**: Contract validation → Requires `libs/shared/validation`

### Medium Priority (P1) Issues  
- **#33-41**: Onboarding wizard steps → All require proper Nx app/lib structure
- **#42**: API Gateway → Requires `apps/api` with proper structure
- **#45**: Feature flags → Requires `libs/shared/feature-flags`

## Enforcement Strategy

### 1. Update Development Standards
All Phase 1 issues must include Nx compliance requirements:
- Applications must be in `client/apps/<name>`
- Shared code must be in appropriate `client/libs/<category>/<name>`
- Follow tagging strategy from `client/docs/nx-foldering.md`

### 2. CI/CD Integration
- Add Nx linting rules to enforce module boundaries
- Require `nx affected` tests for all PRs
- Validate proper project structure in CI

### 3. Developer Guidelines Update
- All new development must follow Nx foldering guide
- No standalone applications outside the workspace
- Proper dependency management via Nx tags

## Migration Timeline

### Week 1: Foundation Setup
- [ ] Create Nx structure (apps/, libs/)
- [ ] Install required plugins
- [ ] Generate initial apps and core libs

### Week 2: Existing Work Migration  
- [ ] Migrate webhook-echo to client/apps/webhook-api
- [ ] Move contract schemas to client/libs/shared/validation
- [ ] Update references and imports

### Week 3: Development Alignment
- [ ] Update all Phase 1 issues with Nx requirements
- [ ] Add compliance checks to all active branches
- [ ] Developer team training on Nx conventions

## Success Criteria

✅ **Structure Compliance**
- All applications in `client/apps/`
- All shared code in `client/libs/`
- Proper tagging and boundaries enforced

✅ **Development Workflow**
- All new features use Nx generators
- Build/test/lint through Nx commands
- Dependency graph maintained and clean

✅ **Issue Alignment**
- All Phase 1 issues updated with Nx requirements
- No development work outside workspace
- Consistent foldering across all deliverables

## Next Steps

1. **Immediate Action Required**: Initialize Nx structure before any further development
2. **Team Lead Assignment**: Update all Phase 1 issues with Nx compliance requirements
3. **Development Process**: All new work must follow Nx conventions from this point forward

This audit ensures Phase 1 development follows enterprise-grade practices and maintains consistency with the established architecture guidelines.