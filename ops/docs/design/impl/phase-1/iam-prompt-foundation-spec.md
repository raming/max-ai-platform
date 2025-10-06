# IAM and Prompt Management Foundation Implementation Specification

**Status**: Approved  
**Issue**: [#54 - ARCH-04 IAM and Prompt Management Foundation](https://github.com/raming/max-ai-platform/issues/54)  
**Phase**: Phase 1  
**Priority**: P0 (Foundation)

## Summary

This specification defines the foundational multi-tenant RBAC (IAM) and Prompt Management services required for Phase 1 implementation. These services provide secure access control and managed prompt deployment workflows that all other Phase 1 components depend on.

## Architecture Overview

### IAM Service (`apps/iam`)
- **Multi-tenant RBAC**: Role-based access control with tenant and client scoping
- **Authentication**: Google SSO integration with service token support
- **Authorization**: Policy checks and permission enforcement
- **Audit**: Comprehensive audit logging for security events

### Prompt Service (`apps/prompt-svc`)
- **Template Registry**: Versioned prompt templates with variables
- **Instance Management**: Client-specific prompt instances
- **Deployment Pipeline**: Safe rollout to providers (Retell, n8n)
- **Contract Validation**: JSON schema validation before activation

## Data Models

### IAM Entities

#### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Primary identifier
  displayName: string;
  tenantId: string;              // Tenant association
  status: 'active' | 'suspended' | 'pending' | 'disabled';
  provider: 'google' | 'internal';
  providerUserId?: string;
  lastLoginAt?: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
  metadata?: Record<string, any>;
}
```

#### Role
```typescript
interface Role {
  id: string;
  name: string;                  // kebab-case, unique within tenant
  displayName: string;
  description?: string;
  tenantId: string;
  permissions: string[];         // format: "action:resource"
  isSystemRole: boolean;         // cannot be modified if true
  createdAt: DateTime;
  updatedAt: DateTime;
  metadata?: Record<string, any>;
}
```

#### RoleAssignment
```typescript
interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  clientId?: string;             // null = tenant-wide
  scope: {
    type: 'tenant' | 'client' | 'resource';
    resourceType?: string;       // when type = 'resource'
    resourceId?: string;         // when type = 'resource'
  };
  assignedBy: string;
  assignedAt: DateTime;
  expiresAt?: DateTime;
  isActive: boolean;
  metadata?: Record<string, any>;
}
```

### Prompt Management Entities

#### PromptTemplate
```typescript
interface PromptTemplate {
  id: string;
  name: string;                  // kebab-case, unique within tenant
  displayName: string;
  description?: string;
  tenantId: string;
  category: 'agent' | 'system' | 'workflow' | 'notification';
  provider: 'retell' | 'n8n' | 'internal';
  version: string;               // semantic version
  content: string;               // template with variables
  variables: TemplateVariable[];
  schema?: JSONSchema;           // for validation
  status: 'draft' | 'published' | 'deprecated' | 'archived';
  publishedAt?: DateTime;
  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  metadata?: Record<string, any>;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}
```

#### PromptInstance
```typescript
interface PromptInstance {
  id: string;
  templateId: string;
  templateVersion: string;
  clientId: string;
  tenantId: string;
  name: string;                  // unique within client
  displayName: string;
  values: Record<string, any>;   // variable values
  renderedContent: string;       // content with variables rendered
  status: 'draft' | 'active' | 'inactive' | 'archived';
  deploymentStatus: 'pending' | 'deployed' | 'failed' | 'rollback';
  providerConfig?: Record<string, any>;
  providerInstanceId?: string;
  lastDeployedAt?: DateTime;
  createdBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  metadata?: Record<string, any>;
}
```

## RBAC Matrix

### System Roles

| Role | Permissions | Scope | Description |
|------|-------------|-------|-------------|
| `platform-admin` | `*:*` | tenant | Full platform access |
| `tenant-admin` | `manage:tenant`, `manage:users`, `manage:roles`, `manage:clients` | tenant | Tenant administration |
| `client-admin` | `manage:client/*`, `read:client/*`, `manage:prompts/*` | client | Client administration |
| `client-operator` | `read:client/*`, `manage:prompt-instances`, `read:templates` | client | Day-to-day operations |
| `client-user` | `read:client/dashboard`, `read:prompt-instances` | client | Read-only access |

### Resource Permissions

#### IAM Resources
- `manage:users` - Create, update, delete users
- `read:users` - List and view users
- `manage:roles` - Create, update, delete custom roles
- `read:roles` - List and view roles
- `manage:assignments` - Assign/revoke roles
- `read:assignments` - View role assignments
- `read:audit` - View audit logs

#### Client Resources
- `manage:client/*` - Full client management
- `read:client/*` - Read client information
- `manage:client/settings` - Update client settings
- `manage:client/integrations` - Manage integrations

#### Prompt Resources
- `manage:templates` - Create, update, delete templates
- `read:templates` - List and view templates
- `publish:templates` - Publish template versions
- `manage:prompt-instances` - Create, update, delete instances
- `read:prompt-instances` - List and view instances
- `deploy:prompts` - Deploy prompts to providers

## Database Schema (ERD)

### IAM Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'suspended', 'pending', 'disabled')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'internal')),
  provider_user_id VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  INDEX idx_users_tenant_email (tenant_id, email),
  INDEX idx_users_provider (provider, provider_user_id)
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  permissions TEXT[] NOT NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  UNIQUE (tenant_id, name),
  INDEX idx_roles_tenant (tenant_id),
  INDEX idx_roles_system (is_system_role)
);

-- Role assignments table
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID REFERENCES clients(id),
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('tenant', 'client', 'resource')),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB,
  
  INDEX idx_assignments_user (user_id),
  INDEX idx_assignments_role (role_id),
  INDEX idx_assignments_tenant_client (tenant_id, client_id),
  INDEX idx_assignments_active (is_active, expires_at)
);
```

### Prompt Management Tables

```sql
-- Prompt templates table
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category VARCHAR(20) NOT NULL CHECK (category IN ('agent', 'system', 'workflow', 'notification')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('retell', 'n8n', 'internal')),
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  schema JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'deprecated', 'archived')),
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  UNIQUE (tenant_id, name, version),
  INDEX idx_templates_tenant_status (tenant_id, status),
  INDEX idx_templates_provider (provider),
  INDEX idx_templates_category (category)
);

-- Prompt instances table
CREATE TABLE prompt_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES prompt_templates(id),
  template_version VARCHAR(20) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  values JSONB NOT NULL DEFAULT '{}',
  rendered_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  deployment_status VARCHAR(20) NOT NULL CHECK (deployment_status IN ('pending', 'deployed', 'failed', 'rollback')),
  provider_config JSONB,
  provider_instance_id VARCHAR(255),
  last_deployed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  UNIQUE (client_id, name),
  INDEX idx_instances_template (template_id),
  INDEX idx_instances_client_status (client_id, status),
  INDEX idx_instances_deployment (deployment_status)
);
```

## Prompt Rollout Workflow

### Template Publishing Process

1. **Template Creation**
   - Author creates template in `draft` status
   - Define variables and validation schema
   - Test template with sample data

2. **Template Review**
   - Requires `publish:templates` permission
   - Validate schema and content
   - Run contract validation tests
   - Update status to `published`

3. **Instance Creation**
   - Client admin creates instance from published template
   - Provide variable values
   - Render and validate content
   - Instance starts in `draft` status

4. **Instance Deployment**
   - Requires `deploy:prompts` permission
   - Validate instance against template schema
   - Deploy to target provider (Retell/n8n)
   - Update deployment status and provider ID
   - Set instance status to `active`

### Audit Events

All prompt operations generate audit events:

```typescript
interface AuditEvent {
  id: string;
  tenantId: string;
  clientId?: string;
  userId: string;
  action: string;              // e.g., "template.publish", "instance.deploy"
  resourceType: string;        // e.g., "prompt_template", "prompt_instance" 
  resourceId: string;
  details: Record<string, any>;
  timestamp: DateTime;
  ipAddress?: string;
  userAgent?: string;
}
```

**Key audit actions:**
- `template.create`, `template.update`, `template.publish`, `template.deprecate`
- `instance.create`, `instance.update`, `instance.deploy`, `instance.rollback`
- `role.assign`, `role.revoke`, `permission.check`

### Rollback Strategy

1. **Automatic Rollback**: Failed deployments automatically rollback
2. **Manual Rollback**: Operators can rollback to previous version
3. **Version History**: All template and instance versions preserved
4. **Provider Cleanup**: Failed deployments cleaned up at provider

## Service Integration

### IAM Service APIs

```typescript
// Authentication
POST /iam/auth/google/callback
POST /iam/auth/token/refresh

// User management
GET /iam/users
POST /iam/users
PUT /iam/users/{id}
DELETE /iam/users/{id}

// Role management
GET /iam/roles
POST /iam/roles
PUT /iam/roles/{id}
DELETE /iam/roles/{id}

// Role assignments
GET /iam/assignments
POST /iam/assignments
DELETE /iam/assignments/{id}

// Authorization
POST /iam/authorize
GET /iam/permissions/{userId}
```

### Prompt Service APIs

```typescript
// Template management
GET /prompts/templates
POST /prompts/templates
PUT /prompts/templates/{id}
DELETE /prompts/templates/{id}
POST /prompts/templates/{id}/publish

// Instance management
GET /prompts/instances
POST /prompts/instances
PUT /prompts/instances/{id}
DELETE /prompts/instances/{id}
POST /prompts/instances/{id}/deploy
POST /prompts/instances/{id}/rollback

// Deployment status
GET /prompts/instances/{id}/status
GET /prompts/deployments/{id}/logs
```

## Quality Gates

### Lint/Type/Test Requirements

#### TypeScript Configuration
- Strict type checking enabled
- No implicit any
- Unused variable detection
- Import/export validation

#### ESLint Rules
- No warnings policy (--max-warnings 0)
- Security rules enabled
- Best practices enforced
- Import sorting required

#### Test Coverage
- Minimum 95% line coverage
- Minimum 95% branch coverage
- Integration tests for all APIs
- Contract validation tests

#### CI/CD Pipeline
```yaml
# .github/workflows/iam-service.yml
name: IAM Service CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint -- --max-warnings 0
      - run: npm run type-check
      - run: npm run test -- --coverage --coverageThreshold='{"global":{"lines":95,"branches":95}}'
      - run: npm run test:integration
      - run: npm run test:contracts
```

### Contract Validation

All API endpoints validate input/output against JSON schemas:
- Request validation middleware
- Response validation in tests
- Schema evolution compatibility
- Breaking change detection

### Security Requirements

- All endpoints require authentication
- RBAC checks on all operations
- Audit logging for sensitive actions
- Rate limiting on auth endpoints
- OWASP security headers
- Input sanitization

## Implementation Plan

### Phase 1.1 - Core IAM (Week 1-2)
- [ ] Database schema and migrations
- [ ] User entity and Google SSO
- [ ] Basic role and permission system
- [ ] Authentication middleware

### Phase 1.2 - RBAC System (Week 2-3)
- [ ] Role assignment system
- [ ] Permission checking middleware
- [ ] Multi-tenant scoping
- [ ] Audit logging

### Phase 1.3 - Prompt Management (Week 3-4)
- [ ] Template entity and versioning
- [ ] Instance management
- [ ] Variable rendering system
- [ ] Contract validation

### Phase 1.4 - Integration (Week 4)
- [ ] Provider adapters (Retell, n8n)
- [ ] Deployment workflows
- [ ] Error handling and rollback
- [ ] End-to-end testing

## Dependencies

This specification unblocks:
- **#49** - OIDC verify middleware (requires IAM authentication)
- **#50** - Casbin policy integration (requires RBAC system)  
- **#52** - Audit logging + OpenTelemetry (requires audit events)
- All client/tenant-scoped features

## References

- [ADR-0003: IAM and Prompt Services](../../../adr/adr-0003-iam-and-prompt-services.md)
- [IAM Entities and Tenancy](../../iam-entities-and-tenancy.md)
- [Architecture Overview](../../architecture-overview.md)
- [Phase 1 Plan](../../../release/phase-1.md)

## JSON Schema Contracts

- [IAM User Schema](../../../contracts/iam/user.schema.json)
- [IAM Role Schema](../../../contracts/iam/role.schema.json) 
- [IAM Role Assignment Schema](../../../contracts/iam/role-assignment.schema.json)
- [Prompt Template Schema](../../../contracts/prompt/template.schema.json)
- [Prompt Instance Schema](../../../contracts/prompt/instance.schema.json)