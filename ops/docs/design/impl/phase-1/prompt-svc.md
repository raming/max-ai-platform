# Prompt Service (MVP) — Extreme Detail Spec

Purpose
Manage base templates and per-client prompt instances with versioning, diffs, rollout, and delivery to adapters with validation, audit, and observability.

Ports (interfaces)
- IPromptRegistry: createOrUpdateTemplate(md|json) → templateId; getTemplate(id)
- IPromptInstanceService: createInstance(templateId, variables) → instanceId; publish(instanceId) → versionId
- IPromptDiffService: diff(instanceId) → {added, removed, changed}
- IAdapterPublisher: publishToAdapters(instanceId, targets) → Result

APIs
- POST /prompt/templates — 201 {templateId}; dedupe by (name, version) when provided
- POST /prompt/instances — 201 {instanceId}; 422 on variable validation error
- POST /prompt/instances/{id}/publish — 200 {versionId}; draft → active; idempotent
- GET  /prompt/instances/{id}/diff — 200 diff result

Data model
- templates(id PK, name, content_md, content_json, version, UNIQUE(name, version))
- instances(id PK, template_id FK, client_id FK, variables JSONB, content_materialized, status ENUM(draft,active))
- audits(id PK, at, actor_id, action, subject_id, metadata JSONB, correlation_id)

Contracts (JSON Schemas)
- ../../contracts/prompt-template.schema.json
- ../../contracts/prompt-instance.schema.json
- PublishRequest schema; validation against adapter contracts prior to publish

Security & compliance
- RBAC on mutate endpoints; redact variables that contain secrets in logs
- Audit on template/instance changes and publish events

Observability
- Logs: template_id, instance_id, client_id, correlation_id, action
- Metrics: publishes_total{status,target}, publish_duration_ms
- Traces: publish pipeline spans; annotate adapter outcomes

NFRs
- Publish P95 < 2s excluding adapter latency; draft creation P95 < 200ms
- Reliability: publish success ratio > 99% with retries

Error taxonomy
- 400.template_schema_invalid | 422.variables_invalid
- 404.template_or_instance_not_found | 409.version_conflict
- 502.adapter_publish_error_{retell|n8n}

Test strategy
- Unit: template/instance CRUD, diff; ≥95% coverage
- Integration: publish to mocked adapters; verify materialized content and audit
- Contract: schemas and adapter contract validation

Acceptance criteria
- Create template → instance → publish works with validation and audit
- Metrics/traces present for publish; retries for adapter errors with DLQ via backbone
