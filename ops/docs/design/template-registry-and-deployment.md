# Template Registry and Deployment Pipeline

Purpose
Manage prebuilt Retell, n8n, and GHL templates in a central registry, customize them per client using knowledge base + LLM, and deploy to providers with audit and rollbacks.

Template sources
- Retell: agent configs (inbound/outbound), post-call analysis fields, webhooks
- n8n: workflow JSON (exported), nodes/credentials placeholders
- GHL: workflows/automations and webhook destinations, custom fields mapping
- Knowledge base: prompt text, field mappings, provider endpoints, environment variables

Artifact storage
- DB for small/structured artifacts (JSON/MD)
- Object storage (e.g., GCS/S3) for large exports (n8n workflow JSON, media)

Lifecycle
1) Import base template → store as TemplateArtifact with provider metadata
2) Customize draft using ILlmPort + variables (from client config and KB)
3) Validate (JSON Schemas, contract tests) and human review
4) Create DeploymentPlan linking artifacts to target provider accounts and mapping IDs
5) Deploy (upsert) to providers via adapters; record DeploymentRecord with provider links
6) Revisions: edit, re-validate, re-deploy; maintain versioned history and rollback

Provider customization checklist (per client)
- Retell
  - Set voice config (voice_id/model/temp/speed/volume)
  - Populate post_call_analysis fields
  - Configure inbound/outbound webhook URLs (our ingress or n8n)
  - Link phone numbers (Twilio) if applicable
- n8n
  - Import workflow JSON; replace credential placeholders with tenant-scoped creds
  - Update webhook node paths to client-specific IDs; store mapping in provider_links
  - Verify nodes for GHL/Retell/Twilio/Supabase connectivity
- GHL
  - Map required custom fields to client’s actual field IDs (see 1prompt KB)
  - Configure webhook actions pointing to our ingress (or n8n proxy) endpoints
  - Link automations/workflows to appropriate triggers

Callbacks and IDs
- Ensure callback URLs (between Retell↔n8n↔GHL) are generated from our ingress endpoints then propagated
- Record provider links: { provider: "retell|n8n|ghl", externalId, url }

References
- Solution Packs: ./solution-packs.md (umbrella bundling and wiring)
- 1prompt imports: ../../docs/integrations/1prompt/README.md
- ILlmPort: ../llm-and-automation.md
- Contracts: ../../contracts/solution-pack.schema.json, ../../contracts/template-artifact.schema.json, ../../contracts/deployment-plan.schema.json, ../../contracts/deployment-record.schema.json, ../../contracts/provider-link.schema.json
