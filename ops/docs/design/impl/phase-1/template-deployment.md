# Templates & Deployment (MVP) — Detailed Spec

Purpose
Provide developer detail to implement the template registry, customization, and deployment mechanism in Phase 1.

APIs
- POST /templates/import — import a base artifact (MD/JSON), provider metadata
- POST /templates/{id}/customize — create client draft using variables + KB + ILlmPort
- POST /templates/{id}/plan — create a DeploymentPlan (targets, mappings)
- POST /templates/{id}/deploy — execute plan; create DeploymentRecord with provider links
- GET  /templates/{id}/links — list provider links (retell/n8n/ghl IDs)

Data model
- template_artifacts(id, kind: retell|n8n|ghl, name, content_ref [DB or object storage], meta)
- deployment_plans(id, template_id, client_id, targets, variables)
- deployment_records(id, plan_id, status, logs_ref, provider_links[])
- provider_links(id, provider, external_id, url)

Contracts
- See: ../../contracts/template-artifact.schema.json
- See: ../../contracts/deployment-plan.schema.json
- See: ../../contracts/deployment-record.schema.json
- See: ../../contracts/provider-link.schema.json

Acceptance criteria
- Import retell/n8n/ghl base artifacts; customize with variables; validate with schemas
- Deploy to all three providers; store external IDs and links; auditable
- Callback URLs wired from our ingress and propagated to providers

Developer checklist (MVP)
- [ ] Define TemplateArtifact and ProviderLink models
- [ ] Implement POST /templates/import (store content to DB or object storage)
- [ ] Implement POST /templates/{id}/customize (apply variables, call ILlmPort if requested)
- [ ] Implement POST /templates/{id}/plan (targets=retell|n8n|ghl, variables)
- [ ] Implement POST /templates/{id}/deploy (call adapters; persist DeploymentRecord+ProviderLinks)
- [ ] Populate Retell webhooks, n8n webhook node paths, and GHL webhook actions with our ingress URLs
- [ ] Write contract tests for template/deployment schemas

References
- Knowledge base: ../../integrations/1prompt/README.md
- LLM: ../../llm-and-automation.md
- Orchestrator/Ingress: ./orchestrator.md, ./webhook-ingress.md