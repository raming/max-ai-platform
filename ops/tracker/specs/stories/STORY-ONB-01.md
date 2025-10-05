# STORY-ONB-01 — Import Base Templates (Retell/n8n/GHL)

Summary
Import prebuilt templates from our KB into the Template Registry as TemplateArtifacts (small JSON/MD in DB; large in object storage) with provider metadata.

Inputs/Outputs
- Input: provider kind (retell|n8n|ghl), name, content (MD or JSON), storage preference
- Output: TemplateArtifact with contentRef and provider meta

Ports/Adapters
- Storage (DB/Object)

Error handling
- Invalid content → 400 with schema violations
- Storage failure → retry/backoff; DLQ entry

Observability
- Correlation IDs; audit entry for import

Feature flags
- None

Test plan
- Unit: schema validation; repository writes
- E2E: import a retell JSON and an n8n export; verify registry lists artifact

Acceptance criteria
- Artifact saved with contentRef and provider meta
- Contract tests pass