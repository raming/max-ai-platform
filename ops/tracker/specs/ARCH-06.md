# ARCH-06 — Declarative Orchestration and Plugin Framework

Summary
Define a validated declarative flow spec (triggers, steps, retries, conditionals, adapter bindings) and a plugin registry; delegate complex branches to n8n.

Scope
- Flow JSON Schema with validation and promotion (draft→active)
- Adapter capability matrix; binding rules per tenant/client
- Execution: orchestrator for simple flows; n8n delegation via adapter when flagged

Outputs
- Flow schema and 2–3 sample flows
- ADR for declarative-first with n8n fallback
- Deployment/rollback strategy for flow versions

Acceptance criteria
- D1: Schema and examples approved
- D2: Capability matrix compiled for CRM/Calendar/Payments/Message
- D3: Version deployment/rollback strategy documented

References
- docs/adr/adr-0005-declarative-flows.md
- docs/design/architecture-overview.md
- docs/release/phase-1.md