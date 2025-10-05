# STORY-ONB-08 — Import SolutionPack from Providers (Sync)

Summary
Scan a source environment (GHL/Retell/n8n) for a selected client or sandbox tenant, pull artifacts (workflows/agents) into the registry as base templates, and assemble/update a SolutionPack reference.

Inputs/Outputs
- Input: provider credentials (server-side), source identifiers (locationId, agentIds, n8n base URL)
- Output: TemplateArtifacts created/updated; SolutionPack updated

Ports/Adapters
- integrations-crm (GHL), integrations-voice (Retell), integrations-workflow (n8n)

Error handling
- Missing permissions → surface and skip; partial success allowed
- Rate limits → backoff and resume; idempotent imports

Observability
- Correlation ID; audit imports with diffs vs previous version

Test plan
- E2E: import from a test environment to create/update a 1Prompt pack in registry

Acceptance criteria
- Artifacts imported; SolutionPack updated and validated; audit recorded
