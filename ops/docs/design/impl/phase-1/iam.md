# IAM (MVP) — Detailed Spec

Purpose
Provide multi-tenant RBAC with Google SSO, service tokens, policy checks, and audit events.

APIs (REST, initial)
- POST /iam/sessions/google/callback — exchange code for session (server-side OAuth)
- GET  /iam/me — return user, roles, tenant assignments
- POST /iam/tokens — mint service token (admin-only)
- POST /iam/policies/check — evaluate {subject, action, resource}

Data model (MVP)
- users(id, email, name, provider)
- tenants(id, name)
- clients(id, tenant_id, name)
- groups(id, tenant_id, client_id?, name)
- roles(id, name) — owner, admin, operator, analyst, client_user
- permissions(id, action, resource)
- role_assignments(id, user_id, role_id, tenant_id, client_id?)
- audit(id, at, actor_id, action, resource, metadata)

Contracts (entities)
- See: ../../contracts/tenant.schema.json
- See: ../../contracts/client.schema.json
- See: ../../contracts/group.schema.json
- See: ../../contracts/role.schema.json
- See: ../../contracts/permission.schema.json
- See: ../../contracts/role-assignment.schema.json

Policies
- Resource scopes: tenant, client, integration, agent, prompt
- Checks are attribute-based + role-based; requests carry tenant_id/client_id

SSO and token proxy
- Portal SSO: Google (Phase 1), Microsoft (Phase 2); optional SAML/OIDC in later phases
- Provider token proxy: store provider tokens server-side; api-gateway performs operations on behalf of users; never expose provider tokens to browser
- Token rotation: secrets manager; audit token issuance and revocation

Contracts
- JSON Schemas: User, Role, Assignment, PolicyCheck, Token
- See: ../../contracts/user.schema.json
- See: ../../contracts/iam-policy-check.schema.json

Acceptance criteria
- Google SSO login working; service tokens mintable; policy check endpoint functional
- Audit events for assignments and token issuance
- Tests: ≥95% coverage across policy evaluation and endpoints
