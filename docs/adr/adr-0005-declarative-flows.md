# ADR-0005: Declarative Flows with n8n Fallback

Status: Proposed

Context
We want most flows to be declared in a validated spec (triggers, steps, adapters) and use n8n for complex branches.

Decision
- Define a Flow JSON Schema; store, version, and validate flows
- services/orchestrator executes simple flows; integrations-workflow adapter delegates to n8n when flagged
- Bindings choose adapters per tenant/client (crm/calendar/payments)

Consequences
- Platform-agnostic, swappable integrations; visual power of n8n where needed
- Requires schema governance and promotion pipeline (draft→active)

References
- docs/design/architecture-overview.md
- docs/design/ports-and-adapters.md
- docs/release/phase-1.md