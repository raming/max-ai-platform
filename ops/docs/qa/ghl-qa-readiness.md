# GHL QA Readiness Checklist and Test Plan

Purpose
Define clear prerequisites and a test plan so QA can validate the GHL integration safely and reproducibly.

Scope
- GHL services API (contacts/custom fields/webhooks) via services.leadconnectorhq.com
- Transitional backend workflows access via backend.leadconnectorhq.com (temporary bridge)
- Token proxy and OAuth2 via GHL App Marketplace (preferred production path)

Blocking prerequisites (must be true before QA starts)
1) OAuth2 app registration (preferred path)
   - App registered in GHL Marketplace with scopes for contacts/custom fields/webhooks
   - Redirect URIs configured for dev/qa
   - Client ID/secret stored in secret manager; never committed
2) Token proxy (server-side)
   - Deployed in dev/qa
   - Can exchange authorization_code for access+refresh and refresh tokens on demand
   - Provides a health/readiness endpoint; structured logs with redaction; RBAC enforced
   - Emits audit events on token mint/refresh (correlation_id included)
3) Services API connectivity (OAuth token)
   - Confirm Version header for tenant (2021-04-15 or 2021-07-28)
   - The following succeed with OAuth access token:
     - GET /users/me
     - GET /locations/{locationId}/customFields
     - PATCH /contacts/{contactId} (safe, reversible field)
4) Data and environment
   - Test locationId identified and documented
   - Sample contacts available (or seeded) with at least one custom field target
   - Webhook ingress URL configured for QA; secrets present in secret manager
   - QA .env or runtime env variables configured (never committing secrets)
5) Transitional backend (only if needed for workflows read)
   - Backend access encapsulated behind server-side proxy using:
     - Authorization: Bearer <admin JWT>
     - Token-Id: <token id JWT>
     - Version: 2021-07-28; Source: WEB_USER; Channel: APP; Origin/Referer: https://app.1prompt.com
   - No admin tokens exposed client-side; allowlist endpoints; audit enabled

Nice-to-have (reduces test friction)
- n8n health endpoint returns { status: "ok" }
- Retell test number and agent configured (for end-to-end webhook smoke)
- Rate limiting guidance and a suggested test window provided to QA

Test plan (QA)
A) OAuth consent flow
- Given a test tenant, when QA completes OAuth consent, the backend exchanges code → access+refresh tokens are stored securely
- Validate token proxy can refresh tokens without manual steps

B) Services API (with OAuth access token)
- GET /users/me → 200
- GET /locations/{locationId}/customFields → 200 with a list of fields
- PATCH /contacts/{contactId} to update a non-destructive field (e.g., test_flag) → 2xx; verify GET reflects the change; roll back

C) Webhooks (if in scope)
- Trigger a sample event (contact update or appointment)
- Verify ingress receives payload; validate against ops/docs/contracts/ghl-event.schema.json
- Check idempotency handling and audit trail

D) Backend workflow listing (temporary bridge; optional)
- Call /workflow/{locationId}/list?parentId=root&limit=10... via proxy → 200
- Confirm no admin token exposure client-side; logs are redacted

E) Observability & security checks
- Logs contain correlation IDs and redact tokens/PII
- Audit entries recorded for token mint/refresh and sensitive operations

Data reset & cleanup
- QA documents any data created/modified and uses provided scripts/steps for cleanup
- Confirm test contacts/fields are restored (or removed) post-run

Acceptance criteria (QA sign-off)
- OAuth flows complete; tokens persist and refresh automatically
- Services API calls (users/me, customFields, contacts patch) succeed with OAuth token
- Webhook payloads validate against schema (if in scope)
- No secrets in logs; admin JWT never exposed client-side
- Coverage/tests in CI remain ≥ 95% with zero ESLint warnings

Risks & mitigations
- Token expiry/refresh race conditions → token proxy retries and proactive refresh
- Rate limiting → backoff strategy and scheduled test windows
- Environment drift → lock versions and document Version header expectation

References
- Adapter: ops/docs/design/integrations/ghl-adapter.md
- Live results: ops/docs/design/assessments/ghl-live-testing-results.md
- Decision: ops/docs/design/assessments/ghl-decision-framework.md
- ADR: ops/docs/adr/adr-0001-ghl-encapsulation.md
