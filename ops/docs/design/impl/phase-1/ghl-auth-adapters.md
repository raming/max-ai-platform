# GHL Auth Adapters — Port and Implementations (Phase 1)

Status: Proposed (Phase 1 foundation)
Related: ARCH-03 — GHL Encapsulation Strategy; ports-and-adapters.md; ghl-token-management-architecture.md

Purpose
Standardize GHL authentication behind a stable port (IGHLAuthPort) with pluggable adapters so we can start with admin-user token seeding and later switch to an agency API key without touching consumers.

Port: IGHLAuthPort
```ts
export interface IGHLAuthPort {
  initiateOAuth(input: { tenantId: string; scopes: string[] }, ctx: RequestCtx): Promise<{ authUrl: string; state: string }>;
  handleCallback(input: { provider: 'ghl'; code: string; state: string }, ctx: RequestCtx): Promise<{ success: boolean; tenantId: string }>;
  refreshToken(input: { tenantId: string }, ctx: RequestCtx): Promise<{ success: boolean; expiresAt: string }>;
  revokeConnection(input: { tenantId: string }, ctx: RequestCtx): Promise<void>;
  getConnectionInfo(input: { tenantId: string }, ctx: RequestCtx): Promise<{ connected: boolean; locationIds?: string[]; expiresAt?: string }>;
}
```

Adapters
- AdminUserSeedAuthAdapter (current)
  - Seed: admin-user session and related tokens captured via human-in-the-loop login
  - Refresh: POST /oauth/2/login/signin/refresh?version=2&location_id=... using session token
  - Storage: TokenVault<TokenSetAdminUser>
  - Contracts: credentials/ghl-admin-user-token.schema.json

- AgencyApiKeyAuthAdapter (future)
  - Seed: agency-level API key
  - Exchange: obtain scoped tokens for location operations where supported
  - Storage: TokenVault<TokenSetAgencyApiKey>
  - Contracts: credentials/ghl-agency-api-key.schema.json

Dependency Injection
- Configuration key: auth.adapters.ghl = "admin-user-seed" | "agency-api-key"
- DI container binds IGHLAuthPort -> chosen adapter at process start
- Per-tenant override: optional, via tenant configuration registry

Usage (consumers)
- API Gateway (integrations endpoints) calls IGHLAuthPort only
- OAuth proxy sequences call port, never concrete adapter
- Webhook handlers and downstream services request tokens via port

Contracts & Validation
- JSON Schemas for credential sets live under docs/contracts/credentials
- CI runs contract tests ensuring adapter I/O matches schemas
- Non-prod runtime validates adapter inputs/outputs against schemas

Migration Plan
1) Phase 1: Ship AdminUserSeedAuthAdapter (default)
2) Phase 2: Implement AgencyApiKeyAuthAdapter in parallel
3) Dark launch: enable per-tenant toggle to agency-api-key
4) Ramp: migrate tenants; monitor metrics (refresh success, error rates)
5) Cleanup: deprecate admin-user seed when fully supported by GHL

Acceptance Criteria
- IGHLAuthPort defined and documented
- AdminUserSeedAuthAdapter implemented and contract-validated
- AgencyApiKeyAuthAdapter interface spec and contract ready (impl optional in P1)
- Consumers limited to the port; no concrete adapter references
- E2E tests pass with the default adapter; feature flag proven for switch-over
