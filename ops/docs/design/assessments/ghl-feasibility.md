# GHL Feasibility Assessment (ARCH-14)

Purpose
Evaluate GoHighLevel (GHL) limitations affecting onboarding and cross-platform automation so we can decide where to encapsulate vs. rebuild stand‑alone capabilities. Outcome informs Phase 1 onboarding priorities and Phase 2 roadmap.

Inputs
- Imported knowledge base (1prompt):
  - ../integrations/1prompt/1PROMPT-V18-SYSTEM-ANALYSIS.md
  - ../integrations/1prompt/1PROMPT-V18-AUTOMATION-MAPPING.md
  - ../integrations/1prompt/GHL-CUSTOM-FIELDS-ANALYSIS.md
- Provider import design: ../provider-artifact-import.md (normalized meta)
- ADR-0001 (GHL encapsulation): ../../adr/adr-0001-ghl-encapsulation.md

Scope (areas to assess)
1) API coverage for onboarding flows
   - Workflows/automations: triggers/actions parity; programmatic create/update; exports
   - Webhooks: topics, payload flexibility, latency/ordering, idempotency
   - Contacts and custom fields: discovery, type safety, batch ops, search
2) Privacy/domain exposure
   - Ability to hide GHL UI/domain from clients; whitelabel/embed options; SSO/consent flows
3) Reliability/scale
   - Rate limits, quotas, backoff behaviors; error surfaces; webhook retries
4) Extensibility
   - Ability to connect Retell/n8n/Twilio cleanly; limitations in templating/variables; migration tooling
5) Security/compliance
   - Token model; least privilege; audit; secret rotation
6) Cost/operational impact
   - Engineering effort to keep encapsulation vs. rebuild portions; support burden; incident patterns

Methodology
- Inventory current usage from KB: triggers, actions, webhooks, fields used
- Map usage to GHL APIs and note gaps or pain points
- Validate webhook topics and payloads vs. our normalized event schemas
- Evaluate options for domain privacy (embed/whitelabel) and feasibility
- Quantify rate limits/quotas that affect onboarding bursts
- Draft alternatives for critical gaps (encapsulate vs. rebuild)

Deliverables
- Gap analysis matrix (use/can use/missing/workaround) with references
- Decision note: continue encapsulation vs. partial rebuild (scope + cost + criteria)
- Phase plan impact: any changes to Phase 1/2 milestones

Checklist
- [ ] Confirm API topics used by our onboarding flows (contacts, workflows, webhooks)
- [ ] Validate webhook topics and payload mapping to our GhlEvent schema
- [ ] Document custom fields discovery and update constraints
- [ ] Evaluate domain privacy (embed/whitelabel) options and risks
- [ ] Compile rate limit/quotas and retry strategies
- [ ] Produce alternatives for gaps (encapsulate vs. rebuild) with rough effort
- [ ] Publish gap matrix and decision note; propose plan updates

Timeline (Phase 1 — M1)
- Day 1–2: Inventory + mapping + webhook validation
- Day 3: Privacy + rate limits assessment
- Day 4: Alternatives and draft decision
- Day 5: Finalize decision note + plan updates

Risks
- Limited public documentation on embed/whitelabel; mitigate by encapsulation default
- Rate limit variability; mitigate by RM‑controlled import/validation windows

Coordination & Access
- Release Manager: schedule sandbox imports off‑peak; provide locationId(s) and sub‑account API keys (server‑side only)
- Team Lead: prep quick probes via provider adapters per the import guide

Status
- Owner: seat:architect.morgan-lee
- Milestone: Phase 1 — M1
