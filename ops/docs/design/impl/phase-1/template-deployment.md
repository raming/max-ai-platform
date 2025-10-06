# Templates & Deployment (MVP) — Extreme Detail Spec

Purpose
Provide implementation-ready guidance to deliver the template registry, customization, and deployment mechanism with strict contracts, idempotency, observability, and auditability.

Ports (interfaces)
- ITemplateRegistry: importArtifact(meta, contentRef) → templateId; get(templateId)
- ITemplateCustomizer: customize(templateId, variables, kbRefs?, useLlm?) → instanceId
- IDeploymentPlanner: plan(instanceId, targets, variables) → planId
- IResourcePlanner: generateResources(instanceId) → ResourceInitializationPlan
- IDeploymentExecutor: deploy(planId) → DeploymentRecord
- IProviderLinkRegistry: upsertLinks(planId, links[]) → void; list(templateId|planId)

APIs
- POST /templates/import — 201 {templateId}; 400 on schema error
- POST /templates/{id}/customize — 201 {instanceId}; 422 on variable validation error
- POST /templates/{id}/plan — 201 {planId}; targets: retell|n8n|ghl; variables merged
- POST /templates/{id}/resources — 201 {planId, resourcePlanId} (idempotent)
- POST /templates/{id}/deploy — 202 {recordId}; async execution; provider links persisted
- GET  /templates/{id}/links — 200 [{provider, external_id, url}]

Data model (constraints)
- template_artifacts(
  id PK, kind ENUM(retell,n8n,ghl), name, content_ref, meta JSONB,
  UNIQUE(name, kind)
)
- deployment_plans(
  id PK, template_id FK, client_id FK, targets TEXT[], variables JSONB,
  created_by, created_at, UNIQUE(template_id, client_id, array_sort(targets))
)
- deployment_records(
  id PK, plan_id FK, status ENUM(queued,running,success,failed), logs_ref,
  started_at, finished_at, correlation_id
)
- provider_links(
  id PK, plan_id FK, provider, external_id, url,
  UNIQUE(plan_id, provider, external_id)
)

Contracts (JSON Schemas)
- ../../contracts/template-artifact.schema.json
- ../../contracts/deployment-plan.schema.json
- ../../contracts/deployment-record.schema.json
- ../../contracts/provider-link.schema.json
- ../../contracts/resource-initialization-plan.schema.json

Behavior & idempotency
- Import: dedupe by (name, kind) unless force=true; return existing templateId
- Customize: deterministic rendering for given (templateId, variables) → instanceId; provide dryRun=true
- Plan: idempotent for (templateId, clientId, targets, variablesHash)
- Resources: produce ResourceInitializationPlan for Supabase prompts/documents; reruns overwrite stage-by-stage with audit
- Deploy: async fan-out to adapters (Retell/n8n/GHL) with per-provider retries and DLQs via messaging backbone

Security & compliance
- RBAC: only roles [owner, admin, operator] may import/plan/deploy
- Redaction: do not log rendered secrets or provider tokens; keep provider links but hide access tokens
- Audit: record actor, action, subject_id, correlation_id for import/customize/plan/deploy

Observability
- Logs: template_id, instance_id, plan_id, provider, correlation_id, status
- Metrics: deployments_total{provider,status}, deployment_duration_ms, resource_plan_steps_total
- Traces: pipeline spans (import→customize→plan→deploy); annotate provider external IDs

NFRs
- Deployment P95: retell < 10s, n8n < 5s, GHL < 15s (excluding cold starts)
- Reliability: retries with exponential backoff; success ratio > 99% with retry
- Consistency: provider links reflect latest successful deployment; reconcile on next deploy

Error taxonomy
- 400.artifact_schema_invalid | 422.variables_invalid
- 404.template_not_found | 404.instance_not_found | 404.plan_not_found
- 409.plan_exists (idempotent plan) | 409.deployment_in_progress
- 502.provider_error_{retell|n8n|ghl}

Test strategy
- Unit: registry/customizer/planner; variables validation; ≥95% coverage
- Integration: deploy mock adapters; verify provider links; resource plan generation
- Contract: JSON Schemas for artifacts, plans, records, provider links; negative cases
- E2E: full pipeline (import→deploy) across all three providers against sandboxes

Acceptance criteria
- Import, customize, plan, resources, deploy endpoints behave as specified with idempotency and audit
- Provider links persisted with stable URLs and external IDs; reconciliation tested
- Metrics and traces capture pipeline timings and outcomes
- Performance meets NFRs; retries and DLQs demonstrated for provider errors

References
- Knowledge base: ../../integrations/1prompt/README.md
- LLM: ../../llm-and-automation.md
- Orchestrator/Ingress: ./orchestrator.md, ./webhook-ingress.md
- Examples: ../../design/examples/resource-init-plan-acme.json
