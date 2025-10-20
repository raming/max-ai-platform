# GHL Gap Analysis Matrix (ARCH-14)

Purpose
Inventory our current GHL usage for onboarding and automation, map to GHL capabilities, and identify gaps/workarounds to inform the encapsulate vs rebuild decision.

Legend
- Integration modes tracked: API (server-side tokens), browser JWT (user-admin), iFrame/whitelabel (domain privacy)
- ✅ = supported/usable
- ⚠️ = limited/needs workaround
- ❌ = unavailable (candidate for rebuild)

Matrix

0) Integration Modes
- Server-side API (sub-account tokens via proxy)
  - Status: ✅ (preferred)
  - Notes: Implement token proxy; never expose tokens to browser
- Browser JWT (user-admin) in client
  - Status: ❌/⚠️ (avoid)
  - Notes: Security risk and domain exposure; only consider for non-sensitive ops with strict scopes
- iFrame/whitelabel embedding
  - Status: ⚠️
  - Notes: Investigate official support + CSP. Default to proxy encapsulation

1) Triggers & Events
- Contact created/updated → Webhook to ingress → n8n
  - Status: ✅ (webhook action supports external URL)
  - Notes: Confirm payload fields vs ops/docs/contracts/ghl-event.schema.json
- Appointment booked/updated → Webhook
  - Status: ✅
  - Notes: Validate timezone handling and ID correlation
- Inbound DMs / message events
  - Status: ⚠️
  - Notes: Pattern present in 1prompt; verify event source parity vs channels

2) Actions
- Send webhook (to n8n/ingress)
  - Status: ✅
  - Notes: Parameterization via variables; confirm templating constraints
- Update contact (standard/custom fields)
  - Status: ✅
  - Notes: Types: text/large_text/radio/multi; map to our KB field IDs
- Send SMS (via GHL)
  - Status: ⚠️
  - Notes: We may prefer provider-agnostic SMS via IMessagePort; keep GHL path as optional

3) Workflows/Automations API (programmatic)
- Read/export workflows
  - Status: ⚠️
  - Notes: Confirm official API coverage for full export; fallback: manual export + registry
- Create/update workflows programmatically
  - Status: ⚠️/❌
  - Notes: If limited, rely on Template Registry—store webhooks/actions and configure via UI + API combo

4) Webhooks
- External webhook actions (to ingress/n8n)
  - Status: ✅
  - Notes: Confirm retry policy and HMAC/signature options; implement idempotency in ingress
- Payload flexibility (customizable fields)
  - Status: ⚠️
  - Notes: If rigid, adjust in orchestrator; define transform in SolutionPack wiring

5) Contacts & Custom Fields
- Discovery: /locations/{locationId}/customFields
  - Status: ✅
  - Notes: Mapped in KB; build field map by industry
- Update typed fields (radio/multi/etc.)
  - Status: ✅
  - Notes: Ensure validation and fallback for missing fields

6) Privacy / Domain Exposure
- Hide GHL UI from clients (proxy-only)
  - Status: ✅ (encapsulation)
  - Notes: ADR-0001 recommends proxy; avoid embeds unless officially supported and safe
- Whitelabel/embed components
  - Status: ⚠️
  - Notes: Investigate reseller options; default to proxy

7) Reliability / Scale
- Rate limits / quotas
  - Status: ⚠️
  - Notes: Document limits; RM to schedule imports off-peak; implement backoff
- Webhook retries
  - Status: ⚠️
  - Notes: Confirm retry semantics; enforce idempotency keys in ingress

8) Security / Compliance
- Token model / rotation
  - Status: ✅
  - Notes: Store server-side via token proxy; audit token events
- Audit of client actions
  - Status: ✅
  - Notes: Enforce audit at our ingress/orchestrator

Preliminary conclusions (draft)
- Encapsulation viable: Use GHL for contact/field and webhook actions; terminate webhooks at ingress; orchestrate via n8n or internal flows.
- Rebuild candidates: programmatic workflow authoring/export if API coverage proves insufficient. Use Template Registry + manual export or UI automation as stopgap.
- SMS routing: keep GHL path optional; prefer IMessagePort (Twilio) for provider-agnostic messaging.

Next steps
- [ ] Validate exact webhook topics and payloads for our flows vs ghl-event.schema.json
- [ ] Confirm workflow export/update API coverage; list endpoints and limitations
- [ ] Document rate limits and retry semantics with references
- [ ] Update ADR with decision and Phase plan changes

References
- KB: ../integrations/1prompt/1PROMPT-V18-*.md
- Contracts: ../contracts/ghl-event.schema.json
- ADR: ../../adr/adr-0001-ghl-encapsulation.md
