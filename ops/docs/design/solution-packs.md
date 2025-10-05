# Solution Packs (Umbrella Bundles)

Purpose
Group multiple provider templates (Retell agents, n8n workflows, GHL automations, prompts) into a single, versioned pack (e.g., "1Prompt v1.8") so onboarding can select one pack, customize variables once, wire callbacks across artifacts, and deploy consistently.

Concepts
- SolutionPack: named, versioned umbrella that references TemplateArtifacts across providers
- Artifacts: the individual templates (retell/n8n/ghl/prompt) tracked in the registry
- Variables: pack-level defaults + artifact-level overrides
- Wiring: cross-artifact connections (e.g., Retell → n8n webhook; GHL → our ingress → n8n)

Composition (example: 1Prompt v1.8)
- Retell agents (2): inbound-agent, outbound-agent
- n8n workflows (8):
  - original - booking-function
  - original - campaign-make-call-retel
  - original - knowledgebase-update
  - original - get-contact-detail-hl
  - original - campaign-start
  - original - text-engine
  - original - prompt-update
  - original - make-call-retel
- GHL workflows: categories (Inbound DMs, Phone Calls, Engagement, Followups, Database Reactivation) with webhook actions to our ingress (see 1prompt KB)
- Prompts: retel-inbound-agent.md, retel-outbound-agent.md base templates

Variables and mapping
- Pack variables: client_name, client_slug, webhook IDs, phone numbers, GHL field mappings, endpoints
- Artifact variables: subset relevant to the artifact (e.g., n8n webhook IDs, Retell voice settings)
- Validation: pack and artifacts validated via JSON Schemas prior to deployment

Wiring
- Directed edges describe callback flows and inputs among artifacts
  - Example: retell.inbound → n8n.webhook(retel_inbound_webhook_id)
  - Example: ghl.automation(contact_created) → ingress.ghl.contact_created → n8n.webhook(contact_webhook_id)
- Wiring rules ensure our ingress URLs populate correctly and artifacts reference each other’s IDs

Lifecycle
1) Import a SolutionPack (1Prompt v1.8) → registry stores references to artifacts
   - Import modes:
     - From Providers: scan a source environment (GHL/Retell/n8n) and pull artifacts into the registry as base templates
     - From Client: derive a new pack from an existing client’s deployed set (e.g., a "Plumbers" pack)
2) Customize for a client → apply pack variables (optionally use ILlmPort for prompt refinement)
3) Validate → schemas + contract tests
4) Resource Initialization → provision per-client resources (e.g., Supabase project) and initialize required tables (prompts, documents)
5) DeploymentPlan → includes target providers and per-artifact variables and resources
6) Deploy → upsert artifacts in providers; record providerLinks; wire callbacks
7) Validate callbacks → trigger test events; confirm end-to-end behavior
8) Maintain → update pack version; re-run customize→plan→deploy for clients if needed; audit trail

Resources
- Some packs require platform resources initialized per client (e.g., Supabase):
  - Project URL/keys stored via token proxy; created via guided/manual step or API (when enabled)
  - Initialize DB schema for prompts and documents tables for client KB
  - ResourceInitializationPlan captured and executed alongside deployment

Extensibility per client
- Add new workflows or prompts and append to the client’s deployed set without changing the base pack
- Use the same Wiring model for new edges and endpoints

References
- Contracts: ../contracts/solution-pack.schema.json, ../contracts/resource-initialization-plan.schema.json, ../contracts/template-artifact.schema.json
- Templates & Deployment: ./template-registry-and-deployment.md
- Knowledge Base: ../integrations/1prompt/README.md
- DB Portability: ../design/db-portability.md
