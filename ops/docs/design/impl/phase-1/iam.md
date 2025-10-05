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
- roles(id, name) — owner, admin, operator, analyst, client_user
- assignments(user_id, tenant_id, role_id)
- audit(id, at, actor_id, action, resource, metadata)

Policies
- Resource scopes: tenant, client, integration, agent, prompt
- Checks are attribute-based + role-based; requests carry tenant_id/client_id

Contracts
- JSON Schemas: User, Role, Assignment, PolicyCheck, Token
- See: ../../contracts/user.schema.json
- See: ../../contracts/iam-policy-check.schema.json

Acceptance criteria
- Google SSO login working; service tokens mintable; policy check endpoint functional
- Audit events for assignments and token issuance
- Tests: ≥95% coverage across policy evaluation and endpoints
