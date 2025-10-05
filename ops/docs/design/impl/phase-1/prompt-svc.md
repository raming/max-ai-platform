# Prompt Service (MVP) — Detailed Spec

Purpose
Manage base templates and per-client prompt instances with versioning, diffs, rollout, and delivery to adapters (Retell/n8n).

APIs
- POST /prompt/templates — create/update template (MD/JSON)
- POST /prompt/instances — create client instance from template + variables
- POST /prompt/instances/{id}/publish — promote draft → active
- GET  /prompt/instances/{id}/diff — show template vs instance

Data model
- templates(id, name, content_md, content_json, version)
- instances(id, template_id, client_id, variables, content_materialized, status)
- audits(id, at, actor_id, action, subject_id)

Contracts
- JSON Schemas: Template, Instance, PublishRequest
- See: ../../contracts/prompt-template.schema.json
- See: ../../contracts/prompt-instance.schema.json
- Validation: non-prod runtime validation against adapter contracts

Acceptance criteria
- Create template → instance → publish flow works; audit recorded
- Contracts validated; coverage ≥95%
