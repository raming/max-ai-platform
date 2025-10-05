# GHL Integration Adapter — Implementation Notes

Purpose
Provide concrete guidance for developers implementing the GHL (LeadConnector) adapters, including validated endpoints, required headers, token strategies, and near-term OAuth2 migration plan.

Scope
- Hosts covered: services.leadconnectorhq.com (public API), backend.leadconnectorhq.com (UI-tier workflow API observed in practice)
- Authentication modes observed:
  - Subaccount (Location) API Key for services host
  - Admin JWT + Token-Id + browser-like headers for backend host
  - Planned: OAuth2 via GHL App Marketplace for multi-tenant production usage

Key findings (validated live)
1) Backend host (workflows) — works
- Base: https://backend.leadconnectorhq.com
- Example: GET /workflow/{locationId}/list?parentId=root&limit=10&offset=0&sortBy=name&sortOrder=asc&includeCustomObjects=true&includeObjectiveBuilder=true
- Required headers:
  - Authorization: Bearer <admin JWT>
  - Token-Id: <token id JWT>  (exact casing with hyphen)
  - Version: 2021-07-28
  - Source: WEB_USER
  - Channel: APP
  - Cache-Control: no-cache
  - Origin: https://app.1prompt.com
  - Referer: https://app.1prompt.com/
  - Accept: application/json, text/plain, */*
- Notes:
  - This path is suitable as a stopgap to read workflow structures. Treat as UI-tier; not guaranteed as a stable partner API.
  - We added a helper: ops/scripts/ghl-backend-probes.sh to reproduce.

2) Services host (public API) — subaccount key pending
- Base: https://services.leadconnectorhq.com
- Typical headers (per docs and industry practice):
  - Authorization: Bearer <subaccount API key>
  - Version: 2021-04-15 (or 2021-07-28, tenant-specific)
  - Accept: application/json
  - Content-Type: application/json
- Endpoints to validate for ICRMPort:
  - GET /users/me
  - GET /locations/{locationId}
  - GET /locations/{locationId}/customFields
  - PATCH /contacts/{contactId}
  - GET /contacts?locationId={locationId}&limit=1
  - Webhooks: GET /locations/{locationId}/webhooks
- Status:
  - In our environment, current subaccount key returned 401/404 across tested permutations. Probable causes: wrong location binding, invalid/expired key, or tenant-specific header/version.
  - Action: regenerate subaccount key for the exact target location and re-validate the three “quick checks” above.
  - Helper: ops/scripts/ghl-subaccount-probes.sh (non-destructive GETs; header permutations).

3) Token refresh observations
- Backend token refresh (observed):
  - POST https://backend.leadconnectorhq.com/appengine/api/token/update  → 200 in browser context
  - Authorization header in capture was an opaque GUID (not a JWT); likely a browser session token; requires earlier session mint step
  - We deliberately did not automate this without the body schema; treat as UI-only flow. If we must support, capture the request body shape from DevTools and add a safe helper.
- services host generally expects static subaccount keys for server-to-server calls (no refresh). If your environment issues JWT-like keys with expiry, we need the official exchange endpoint from GHL docs.

Design guidance (adapter usage)
- Prefer services.leadconnectorhq.com for production adapters:
  - Use subaccount API keys per tenant/location (short-term)
  - Migrate to OAuth2 via Marketplace (long-term) for refresh tokens and consented scopes
- If workflows must be read pre-OAuth, encapsulate backend calls behind a server-side token proxy that:
  - Injects required headers
  - Uses strict allowlists and auditing
  - Never exposes admin JWTs to the client

OAuth2 via Marketplace (recommended path)
- Rationale: multi-tenant, consented scopes, durable refresh tokens; eliminates manual/admin JWT handling.
- Flow:
  - User consents at /authorize → backend exchanges code at /oauth/token → stores access + refresh per tenant/location
  - Token proxy: on 401 or pre-expiry, refreshes via /oauth/token (grant_type=refresh_token)
- Adapter headers with OAuth access token:
  - Authorization: Bearer <access_token>
  - Version: 2021-04-15 (or 2021-07-28)
- Storage & security:
  - Store tokens encrypted at rest; redact in logs; RBAC-protected access; audit token events

Adapter contracts and validation
- Map to ICRMPort operations:
  - upsertContact/updateCustomFields → contacts endpoints, customFields discovery
  - listWebhooks/registerWebhook → webhooks endpoints (or post-Phase 1)
- Contract validation:
  - Use ops/docs/contracts/ghl-event.schema.json for webhook payload normalization (non-prod runtime + CI)
  - Include correlation_id and idempotency in ingress

Risks and mitigations
- Backend endpoint reliance:
  - Treat as temporary; document deviations; plan to replace with services endpoints or Marketplace APIs
- Subaccount key 401s:
  - Regenerate keys for the precise location ID; confirm Version header; test users/me first
- Rate limiting/quotas:
  - Implement retry with backoff, DLQ at orchestrator; schedule imports off-peak

Developer helpers
- ops/scripts/ghl-backend-probes.sh — backend workflows (admin JWT + Token-Id + browser headers)
- ops/scripts/ghl-probes.sh — services host probes; supports Version header and basic calls
- ops/scripts/ghl-subaccount-probes.sh — exhaustive non-destructive checks for subaccount key (GET only)
- QA readiness & test plan: ../../qa/ghl-qa-readiness.md

Acceptance criteria (for adapter readiness)
- services host: users/me, customFields read, and contact patch validated with subaccount key (or OAuth access token)
- backend workflows (if needed): folders/list endpoints read behind server-side proxy; no client exposure of admin JWT
- Contract tests: CI validates adapter contracts; non-prod runtime checks map to schemas

References
- ADR-0001 GHL Encapsulation: ops/docs/adr/adr-0001-ghl-encapsulation.md
- Live testing results: ops/docs/design/assessments/ghl-live-testing-results.md
- Decision framework: ops/docs/design/assessments/ghl-decision-framework.md
- Contracts: ops/docs/contracts/ghl-event.schema.json
