# IAM Foundation Spec — Keycloak + Casbin

Tracker: ARCH-04 — IAM and Prompt Management (Issue #4)
References: ADR-0002 (iam foundation), docs/design/adapter-contracts.md, docs/adr/*

Purpose
Define the IAM foundation to gate all API work with AuthN (OIDC) and AuthZ (Casbin), ensuring portability, auditability, and CI enforcement.

Scope
- Identity model (tenants, users, service accounts, roles/permissions)
- Ports/adapters: IdP (Keycloak), AuthZ (Casbin)
- Middleware chain and cross-cutting concerns (validation, audit, telemetry)
- Contracts (JSON Schemas) for token claims and authorization requests
- Definition of Ready gates and CI checks

Canonical identity and authorization model
- Tenant: organization/workspace context; maps to Keycloak realm or client-scoped role sets
- Subject: user or service account; includes subject ID, tenant ID, roles/groups, scopes
- Resource: domain object identifier and type
- Action: verb (read, write, update, delete, admin, etc.)
- Context: optional attributes (ownership, record tenant, flags)

Ports and adapters
- AuthN Port (IdP):
  - Verify JWT from Keycloak via discovery and JWKS; validate iss/aud/exp/nbf and required claims (sub, tenant)
  - Extract subject context (sub, tenant, roles/groups, scopes)
- AuthZ Port (Policy):
  - Interface: allow = enforce(subject, resource, action, context)
  - Default adapter: Casbin with RBAC model; policies versioned in repo; per-tenant policy sets supported

Middleware sequence (request lifecycle)
1) Request ID and correlation context
2) Security headers and CORS
3) Rate limiting (per user/tenant/service account)
4) AuthN: OIDC token verification (fail-closed)
5) AuthZ: enforce() via Casbin; deny with 403 and audit event
6) JSON Schema validation (non-prod runtime; CI always)
7) Handler
8) Audit log emission (subject, resource, action, decision, reason) and telemetry spans

Contracts (summary; see schemas in ops/docs/contracts/iam)
- keycloak-token-claims.schema.json: issuer, audience, subject, tenant, roles/groups, scopes, expiry
- authz-request.schema.json: subject, resource, action, context
- authz-response.schema.json: decision (allow/deny), reason, policyRef, obligations

Definition of Ready (IAM gates for any API PR)
- OIDC token verification enabled with Keycloak discovery and JWKS
- Authorization check via Casbin enforce() for protected resources
- Input/Output schemas present and validated (runtime in non-prod; CI always)
- Structured logs with correlation ID; audit for sensitive operations
- CI: ESLint warnings-as-errors, coverage >=95%, contract tests green

Test strategy (linked, separate doc)
- Unit tests for middleware and policy checks
- Contract tests for token claims and authz req/resp against JSON Schemas
- Integration tests with sample protected route

Non-functional requirements
- Performance: <2ms median overhead per request for AuthZ; <10ms p95 for AuthN (cached JWKS)
- Reliability: fail-closed for invalid tokens; clear error types; policy reload safety
- Security: no secrets in logs; tenant isolation; minimal scopes for service accounts

Open questions / Phase transitions
- Exact tenant mapping to Keycloak realms vs client roles (evaluate during integration)
- Policy storage backend for Casbin (file vs DB) per environment
- Future PDP introduction (Cerbos/OPA) if cross-service centralization is needed
