# IAM (MVP) — Implementation Spec

> **📖 Detailed Documentation**: See [IAM Component Architecture](../../../iam/) for comprehensive specifications including diagrams, data model, API contracts, and security controls.

Purpose
Provide multi-tenant identity, SSO, service tokens, RBAC policy checks, and audit with strict contracts and operational guardrails.

Ports (interfaces)
- IIdentityProviderPort: exchangeAuthCode(provider, code) → UserProfile
- ITokenService: mintServiceToken(actor, scopes) → {token, exp}; verify(token) → Claims
- IPolicyEnginePort: check({subject, action, resource, attrs}) → {allow|deny, reason}
- IAuditWriter: write(event) → void

APIs (REST)
- POST /iam/sessions/google/callback — 302 to portal with session; 401 on failure
- GET  /iam/me — 200 {user, roles, assignments}; requires session or service token
- POST /iam/tokens — 201 {token, exp}; admin-only; scopes validated
- POST /iam/policies/check — 200 {allow, reason}; request includes tenant_id/client_id

Data model
- users(id PK, email UNIQUE, name, provider ENUM(google,local))
- tenants(id PK, name UNIQUE)
- clients(id PK, tenant_id FK, name)
- groups(id PK, tenant_id FK, client_id?, name)
- roles(id PK, name UNIQUE)
- permissions(id PK, action, resource, UNIQUE(action, resource))
- role_assignments(id PK, user_id FK, role_id FK, tenant_id FK, client_id?)
- audit(id PK, at, actor_id, action, resource, metadata JSONB, correlation_id)

Contracts (JSON Schemas)
- ../../contracts/user.schema.json
- ../../contracts/tenant.schema.json
- ../../contracts/client.schema.json
- ../../contracts/group.schema.json
- ../../contracts/role.schema.json
- ../../contracts/permission.schema.json
- ../../contracts/role-assignment.schema.json
- ../../contracts/iam-policy-check.schema.json

Security & compliance
- SSO: server-side OAuth flow; anti-CSRF state param; PKCE when applicable
- Tokens: JWT HS/RS signed; short-lived; rotate keys; store only hashes where needed
- RBAC: enforce at gateway and service layers; deny-by-default
- Redaction: no PII in logs; audit sensitive actions (role assignment, token mint)

Observability
- Logs: actor_id, tenant_id, client_id, action, resource, correlation_id
- Metrics: policy_checks_total{decision}, token_mints_total, sso_logins_total{provider}
- Traces: session creation and policy checks linked via correlation_id

NFRs
- Policy check latency P95 < 20ms; token mint P95 < 100ms
- Availability ≥ 99.9%; audit write must be durable (retry on failure)

Error taxonomy
- 400.invalid_request | 401.unauthorized | 403.forbidden
- 409.role_assignment_conflict | 422.validation_error
- 500.identity_provider_error | 500.audit_write_failed

Test strategy
- Unit: policy evaluation matrix; token mint/verify; ≥95% coverage
- Integration: SSO code exchange with mocked IdP; audit persistence; RBAC enforcement
- Contract: JSON Schemas for IAM entities and policy check; negative cases

Acceptance criteria
- Google SSO login working; service tokens mintable with scopes; gateway RBAC enforced
- Policy check endpoint returns allow/deny with reason; audit present for all sensitive actions
- CI shows ≥95% coverage for IAM services
