# Folder Structure Best Practices

**Version:** 1.1  
**Last Updated:** October 20, 2025  
**Status:** Canonical Standard

## Purpose

This document defines the **canonical folder structure** for both documentation and code across all projects. Consistent structure ensures:
- Easy navigation and discoverability
- Clear separation of concerns
- Reusability and maintainability
- Consistent experience across projects

## Applicability

### When This Standard Applies

**REQUIRED - New Projects:**
- ✅ **Full compliance mandatory** for all new projects starting from scratch
- ✅ **Enforced in architect specifications** and dev implementation
- ✅ **Both documentation AND code structure** must follow this standard

**RECOMMENDED - Existing Codebases (e.g., Airmeez):**
- ⚠️ **Documentation structure**: RECOMMENDED to migrate (low risk, high value)
  - Can standardize `docs/` folder structure without breaking code
  - Move contracts to canonical location
  - Reorganize architecture docs by layer
  
- ⚠️ **Code structure**: RESPECT EXISTING structure (high risk to refactor)
  - Do NOT force restructuring of existing working code
  - Existing folder organization takes precedence
  - Apply standards ONLY to completely new features/modules
  - When adding to existing areas, match existing style for consistency

**INCREMENTAL - New Features in Existing Projects:**
- 🔄 **Evaluate case-by-case**: 
  - If adding to existing module → Follow existing structure
  - If creating brand new module → Can apply new standards
  - Document rationale in ADR if deviating from standard

### Decision Framework

**When should you follow this standard?**

```
New project from scratch?
├─ YES → ✅ REQUIRED: Full compliance mandatory
└─ NO → Existing project...
    │
    ├─ Documentation changes only?
    │  └─ ✅ RECOMMENDED: Apply standards (low risk)
    │
    ├─ New standalone module/feature?
    │  └─ ✅ RECOMMENDED: Apply standards where possible
    │
    └─ Modifying existing code area?
       └─ ⚠️  RESPECT EXISTING: Match current structure
```

**Risk Assessment:**

| Change Type | Risk Level | Recommendation |
|------------|-----------|----------------|
| Reorganize `docs/` | 🟢 Low | **DO IT** - Improves discoverability |
| Move contracts to `docs/contracts/` | 🟢 Low | **DO IT** - Update imports |
| Restructure existing UI components | 🔴 High | **DON'T** - Risk breaking features |
| Refactor backend layers | 🔴 High | **DON'T** - Complex dependency changes |
| New feature in new folder | 🟢 Low | **DO IT** - Follow standards |
| Add to existing feature folder | 🟡 Medium | **MATCH EXISTING** - Consistency within feature |

## Documentation Folder Structure

### Standard Documentation Layout

```
docs/
├── README.md                    # Documentation index with links to all major sections
├── adr/                        # Architecture Decision Records (ADRs)
│   ├── 0001-decision-name.md
│   ├── 0002-decision-name.md
│   └── template.md
├── architecture/               # Architecture documentation (replaces old "design")
│   ├── overview.md            # High-level system architecture
│   ├── api/                   # API layer specifications
│   │   ├── endpoints/
│   │   └── contracts/         # API contracts (OpenAPI/Swagger)
│   ├── backend/               # Backend architecture
│   │   ├── services/
│   │   ├── business-logic/
│   │   └── data-access/
│   ├── frontend/              # Frontend architecture
│   │   ├── components/
│   │   ├── state-management/
│   │   └── routing/
│   ├── database/              # Database design
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── erd/
│   ├── integration/           # Integration patterns
│   │   └── layer-communication/
│   ├── security/              # Security architecture
│   │   ├── authentication/
│   │   ├── authorization/
│   │   └── encryption/
│   └── deployment/            # Deployment architecture
│       ├── infrastructure/
│       └── ci-cd/
├── contracts/                 # CANONICAL LOCATION for all contracts
│   ├── api/                   # API contracts (DTOs, interfaces)
│   │   ├── schemas/           # JSON schemas, TypeScript interfaces
│   │   └── examples/          # Example requests/responses
│   ├── events/                # Event schemas (if event-driven)
│   └── database/              # Database contracts (table schemas)
├── specs/                     # Feature specifications
│   ├── PROJ-001-feature.md
│   ├── PROJ-002-feature.md
│   └── archive/               # Completed/deprecated specs
├── test/                      # Test documentation
│   ├── test-plans/
│   ├── test-cases/
│   └── test-reports/
├── dev/                       # Development guides
│   ├── setup.md
│   ├── coding-standards.md
│   └── troubleshooting.md
├── release/                   # Release documentation
│   ├── planning/
│   ├── q1/, q2/, q3/, q4/    # Quarterly releases
│   └── compliance/
└── ops-template/              # Synced ops-template rules (managed by sync)
    ├── rules/
    ├── scripts/
    └── templates/
```

### Key Principles

#### 1. Contracts Location (CANONICAL)
**✅ CORRECT:**
```
docs/contracts/api/schemas/user-dto.ts
docs/contracts/api/examples/user-create-request.json
docs/contracts/events/user-registered-event.json
```

**❌ INCORRECT:**
```
docs/design/user-dto.ts                    # Too generic
docs/architecture/api/user-dto.ts          # Duplicates contract location
docs/api/contracts/user-dto.ts             # Non-standard hierarchy
```

**Why?**
- Contracts are cross-cutting concerns used by multiple layers
- Centralized location makes them easy to find
- Architects and Devs know exactly where to look

#### 2. Architecture vs Design
- Use `architecture/` instead of `design/`
- "Architecture" is more precise and professional
- Organize by architectural layers (API, Backend, Frontend, Database, Integration)

#### 3. Separation by Concern
```
docs/architecture/api/          # API layer only
docs/architecture/backend/      # Backend business logic only
docs/architecture/frontend/     # Frontend UI only
docs/architecture/database/     # Database schema only
docs/architecture/integration/  # How layers communicate
```

Don't mix concerns in a single document or folder.

### Migration from Old Structure

If you have old structure:
```
docs/design/contracts/          ← Move to docs/contracts/api/
docs/design/database/           ← Move to docs/architecture/database/
docs/design/api/                ← Move to docs/architecture/api/
docs/design/security/           ← Move to docs/architecture/security/
```

## Code Folder Structure

### Frontend Code Structure

#### Component Library Pattern (RECOMMENDED)

```
client/
├── src/
│   ├── app/                           # Application shell
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx
│   ├── libs/                          # Reusable component libraries
│   │   ├── ui-components/             # Pure UI components (no business logic)
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── index.ts               # Export all UI components
│   │   ├── form-components/           # Form-specific components
│   │   │   ├── FormField/
│   │   │   ├── FormValidation/
│   │   │   └── index.ts
│   │   ├── layout-components/         # Layout components
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   └── index.ts
│   │   └── data-components/           # Data display components
│   │       ├── Table/
│   │       ├── Chart/
│   │       └── index.ts
│   ├── features/                      # Feature-specific code (business logic allowed)
│   │   ├── auth/
│   │   │   ├── components/            # Feature-specific components
│   │   │   ├── hooks/                 # Custom hooks for this feature
│   │   │   ├── services/              # API calls for this feature
│   │   │   └── types.ts               # Feature-specific types
│   │   ├── dashboard/
│   │   ├── users/
│   │   └── reports/
│   ├── services/                      # API layer (data fetching)
│   │   ├── api/
│   │   │   ├── client.ts              # HTTP client setup
│   │   │   ├── endpoints.ts           # API endpoint definitions
│   │   │   └── interceptors.ts        # Request/response interceptors
│   │   ├── auth/                      # Auth service
│   │   ├── users/                     # User service
│   │   └── index.ts
│   ├── store/                         # State management
│   │   ├── slices/                    # Redux slices (or equivalent)
│   │   ├── hooks.ts                   # Typed hooks
│   │   └── index.ts
│   ├── hooks/                         # Shared custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── types/                         # Shared TypeScript types
│   │   ├── api.types.ts               # API DTOs
│   │   ├── domain.types.ts            # Domain models
│   │   └── common.types.ts            # Common types
│   ├── utils/                         # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   ├── constants/                     # Constants
│   │   ├── routes.ts
│   │   ├── config.ts
│   │   └── index.ts
│   └── styles/                        # Global styles
│       ├── theme.ts
│       ├── globals.css
│       └── variables.css
└── public/                            # Static assets
    ├── images/
    └── fonts/
```

#### Key Principles for Frontend

**1. UI Component Libraries (`libs/ui-components/`)**
- **Pure presentation components only**
- No business logic
- No API calls
- No state management (except local UI state)
- Accept data via props
- Reusable across features

**Example:**
```typescript
// ✅ CORRECT: Pure UI component
export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant 
}) => {
  return <button className={variant} onClick={onClick}>{label}</button>;
};

// ❌ INCORRECT: Business logic in UI component
export const UserButton: React.FC = () => {
  const user = useAuth(); // ❌ Business logic
  const { data } = useUserApi(); // ❌ API call
  return <button onClick={saveUser}>{user.name}</button>; // ❌ Not reusable
};
```

**2. Feature Components (`features/`)**
- Can use business logic
- Can make API calls (via services)
- Can use state management
- Feature-specific, not reusable

**3. Layer Separation**
```
libs/ui-components/     → Presentation layer (UI only)
features/               → Feature layer (UI + business logic)
services/               → Data layer (API calls)
store/                  → State layer (state management)
```

**DO NOT MIX:**
- ❌ Business logic in `libs/ui-components/`
- ❌ API calls in `libs/ui-components/`
- ❌ UI components mixed with data components
- ❌ State management in pure UI components

### Backend Code Structure

```
server/
├── src/
│   ├── api/                           # API/Presentation layer
│   │   ├── routes/                    # Route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── index.ts
│   │   ├── controllers/               # Request handlers
│   │   │   ├── AuthController.ts
│   │   │   ├── UserController.ts
│   │   │   └── index.ts
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── index.ts
│   │   └── dto/                       # Data Transfer Objects
│   │       ├── requests/
│   │       ├── responses/
│   │       └── index.ts
│   ├── domain/                        # Business logic layer
│   │   ├── services/                  # Business services
│   │   │   ├── AuthService.ts
│   │   │   ├── UserService.ts
│   │   │   └── index.ts
│   │   ├── entities/                  # Domain entities
│   │   │   ├── User.ts
│   │   │   ├── Organization.ts
│   │   │   └── index.ts
│   │   ├── interfaces/                # Service interfaces (ports)
│   │   │   ├── IAuthService.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── index.ts
│   │   └── validators/                # Business validation
│   │       ├── userValidator.ts
│   │       └── index.ts
│   ├── infrastructure/                # Data access layer
│   │   ├── database/
│   │   │   ├── repositories/          # Repository implementations
│   │   │   │   ├── UserRepository.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/            # Database migrations
│   │   │   ├── seeds/                 # Database seeds
│   │   │   └── models/                # ORM models
│   │   ├── external/                  # External API clients
│   │   │   ├── EmailService.ts
│   │   │   ├── PaymentGateway.ts
│   │   │   └── index.ts
│   │   └── cache/                     # Caching layer
│   │       ├── RedisClient.ts
│   │       └── index.ts
│   ├── shared/                        # Shared utilities
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── types/
│   │   └── errors/
│   └── config/                        # Configuration
│       ├── database.config.ts
│       ├── app.config.ts
│       └── index.ts
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

#### Key Principles for Backend

**1. Layer Separation (Ports & Adapters)**
```
api/           → Presentation layer (HTTP handlers)
domain/        → Business logic layer (services, entities)
infrastructure/→ Data access layer (repositories, external APIs)
```

**2. Dependencies Flow**
```
api/ → domain/ → infrastructure/
```
- API depends on domain
- Domain defines interfaces (ports)
- Infrastructure implements interfaces (adapters)
- Domain NEVER depends on infrastructure

**3. No Mixed Concerns**
- ❌ Database calls in controllers
- ❌ Business logic in repositories
- ❌ HTTP concerns in domain services

## Architect Checklist Addition

When creating architecture documentation, architects MUST follow this structure:

### Documentation Structure Verification
- [ ] ✅ **Contracts in canonical location**: All contracts in `docs/contracts/` (NOT scattered)
  - [ ] API contracts: `docs/contracts/api/schemas/`
  - [ ] Event contracts: `docs/contracts/events/`
  - [ ] Database contracts: `docs/contracts/database/`

- [ ] ✅ **Architecture organized by layer**:
  - [ ] API layer: `docs/architecture/api/`
  - [ ] Backend: `docs/architecture/backend/`
  - [ ] Frontend: `docs/architecture/frontend/`
  - [ ] Database: `docs/architecture/database/`
  - [ ] Integration: `docs/architecture/integration/`
  - [ ] Security: `docs/architecture/security/`

- [ ] ✅ **No mixed concerns**: Each folder contains only one architectural concern

- [ ] ✅ **Documentation index updated**: `docs/README.md` links to all new documents

### Code Structure Specification
- [ ] ✅ **Frontend component library specified**:
  - [ ] Pure UI components in `libs/ui-components/`
  - [ ] Feature components in `features/`
  - [ ] Services in `services/`
  - [ ] Clear separation of presentation/business/data layers

- [ ] ✅ **Backend layer separation specified**:
  - [ ] API layer: `api/routes/`, `api/controllers/`, `api/dto/`
  - [ ] Domain layer: `domain/services/`, `domain/entities/`
  - [ ] Infrastructure layer: `infrastructure/database/`, `infrastructure/external/`

## Dev Checklist Addition

When implementing features, developers MUST follow this structure:

### Frontend Implementation Structure
- [ ] ✅ **Reusable UI components in libs**: Pure UI components placed in `client/src/libs/ui-components/`
  - [ ] No business logic in UI components
  - [ ] No API calls in UI components
  - [ ] Components accept data via props only

- [ ] ✅ **Feature-specific code in features**: Business logic in `client/src/features/[feature-name]/`

- [ ] ✅ **API calls in services layer**: Data fetching in `client/src/services/`

- [ ] ✅ **Layer separation maintained**: No mixing of UI/business/data concerns

### Backend Implementation Structure
- [ ] ✅ **API layer**: Controllers, routes, DTOs in `server/src/api/`

- [ ] ✅ **Business logic layer**: Services, entities, validators in `server/src/domain/`

- [ ] ✅ **Data layer**: Repositories, database access in `server/src/infrastructure/`

- [ ] ✅ **Dependencies flow correctly**: API → Domain → Infrastructure (never reverse)

## Migration Guide

### Working with Existing Codebases

**IMPORTANT**: Existing projects (like Airmeez) may have established folder structures that cannot be easily changed without significant risk.

#### Principles for Existing Projects

1. **Respect Working Code**: Don't restructure existing code just for compliance
2. **Documentation First**: Standardize docs structure (low risk, high value)
3. **Incremental Adoption**: Apply standards to new features only
4. **Consistency Within Feature**: Match existing style when modifying existing areas
5. **Document Deviations**: Create ADR explaining why existing structure is maintained

#### Safe Changes for Existing Projects

**✅ LOW RISK - Can Do:**
```bash
# Standardize documentation structure
mkdir -p docs/contracts/api
mkdir -p docs/architecture/{api,backend,frontend,database}
mv docs/design/contracts/* docs/contracts/api/
mv docs/design/* docs/architecture/

# Update documentation references (find and replace in docs)
# Update imports in code that reference moved contract files
```

**⚠️ HIGH RISK - Don't Do (Without Major Refactor Plan):**
```bash
# DON'T restructure existing components
# DON'T move existing business logic between layers
# DON'T reorganize working backend structure
# DON'T change import paths for established code
```

#### Strategy: "Apply to New, Respect Existing"

**When adding NEW features to existing codebase:**

1. **Evaluate Independence**:
   - Is this a completely new module/feature? → Can apply new standards
   - Is this extending existing module? → Match existing structure

2. **Document Decision**:
   ```markdown
   # ADR: Folder Structure for [Feature Name]
   
   ## Decision
   [Applied new standards / Matched existing structure]
   
   ## Rationale
   - New project: Following canonical structure from rules/folder-structure-best-practices.md
   OR
   - Existing codebase: Matching existing structure for consistency within [module name]
   
   ## Impact
   [Describe organization approach]
   ```

3. **Hybrid Approach Example (Airmeez)**:
   ```
   airmeez/
   ├── existing-feature/        ← Keep existing structure
   │   └── components/          ← Don't change
   │       ├── mixed-logic/     ← Don't refactor
   │       └── api-calls/       ← Don't move
   │
   └── new-feature/             ← Apply new standards
       ├── components/          ← Pure UI only
       │   └── Button/
       ├── services/            ← API layer
       │   └── FeatureApi.ts
       └── hooks/               ← Business logic
           └── useFeature.ts
   ```

### For New Projects (Full Migration)

**Step 1: Assess Current Structure**
```bash
# Check current folder structure
tree docs/ -L 3
tree client/src/ -L 3
tree server/src/ -L 3
```

**Step 2: Create New Structure**
```bash
# Create new canonical folders
mkdir -p docs/contracts/{api,events,database}
mkdir -p docs/architecture/{api,backend,frontend,database,integration,security}
mkdir -p client/src/libs/{ui-components,form-components,layout-components}
```

**Step 3: Move Files**
```bash
# Move contracts to canonical location
mv docs/design/contracts/* docs/contracts/api/
mv docs/architecture/api/contracts/* docs/contracts/api/

# Move design docs to architecture
mv docs/design/api/* docs/architecture/api/
mv docs/design/database/* docs/architecture/database/
```

**Step 4: Update References**
- Update all imports in code
- Update all links in documentation
- Update `docs/README.md` index

**Step 5: Verify**
- Run build to catch broken imports
- Check all documentation links
- Update architect specs to reference new locations

## Examples

### Good Examples
✅ **hakim-platform-ops**: Well-organized docs structure with clear separation

### Anti-Patterns to Avoid
❌ Contracts scattered across multiple folders  
❌ Business logic in UI component libraries  
❌ API calls in presentation components  
❌ Database access in domain services  
❌ Mixed concerns in single folder

## Enforcement

- **Architects**: Must specify folder structure in specifications
- **Team Leads**: Must review folder structure during spec review
- **Devs**: Must follow folder structure during implementation
- **QA**: Must verify code organization during testing

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Ports and Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Revision History:**
- v1.0 (2025-10-20): Initial canonical standard based on hakim-platform-ops structure and user requirements
