# ARCH-14 — GHL Limitations and Standalone Feasibility Assessment

Summary
Assess gaps/limitations in GHL for our onboarding and automation needs and estimate the cost/benefit of rebuilding stand-alone capabilities. Use findings to prioritize Phase 1 delivery (template-based onboarding) and inform Phase 2 roadmap.

Scope
- Catalog GHL APIs, webhooks, automations relevant to our onboarding and cross-platform hooks (Retell/n8n/GHL)
- Identify missing capabilities or constraints (rate limits, auth, domain/privacy, embed/component support)
- Estimate complexity to replicate critical pieces in-house (orchestrations, messaging, custom fields mgmt)

Outputs
- Comparison matrix (use/can use/missing/workaround) per onboarding feature
- Decision note: continue with GHL + encapsulation vs partial rebuild, with criteria and costs
- Impacted Phase 1 priorities and Phase 2 items

Acceptance criteria
- L1: Gap analysis document attached with references
- L2: Decision note posted (encapsulation vs rebuild scope)
- L3: Updates applied to release/phase-1.md milestones/priorities if needed

References
- docs/integrations/1prompt/* (imported KB)
- docs/adr/adr-0001-ghl-encapsulation.md
- docs/release/phase-1.md