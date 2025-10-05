# Declarative Orchestrator & Flow Schema (MVP) — Detailed Spec

Purpose
Execute validated flow specs (triggers, steps, retries, conditionals) and delegate complex branches to n8n through an adapter.

Flow JSON Schema (outline)

Contracts
- See: ../../contracts/flow.schema.json
- flow: { name, version, tenant_id, client_id }
- bindings: { crm, calendar, payments, voice, message }
- triggers: [{ type: webhook|schedule|manual, event: string }]
- steps: [{ name, port, action, input, when, retry{max_attempts, backoff_ms} }]

APIs
- POST /flows — create/update flow (draft)
- POST /flows/{id}/promote — draft → active
- POST /flows/{id}/run — manual trigger (non-prod)

Execution
- Simple steps in-process; when step says delegate: n8n adapter invoked with payload
- Logs include correlation_id, tenant_id, step_name; redaction applied

Acceptance criteria
- Schema exists with validator; 2–3 example flows provided
- One E2E flow runs through orchestrator (Retell → CRM upsert → Calendar booking) with audit
- Unit tests ≥95%