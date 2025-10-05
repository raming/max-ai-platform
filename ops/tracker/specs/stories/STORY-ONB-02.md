# STORY-ONB-02 — Customize Templates with KB + ILlmPort

Summary
Create client-specific drafts from base templates with variables; optionally use ILlmPort to refine prompts/webhook text; keep diffs and provenance.

Inputs/Outputs
- Input: template_id, client_id, variables, use_llm?: boolean
- Output: client draft artifact (content_materialized) with provenance

Ports/Adapters
- ILlmPort (optional), storage

Error handling
- LLM failure → fall back to template-only variables; log evaluation
- Schema validation failures → 400

Observability
- Correlation IDs; audit changes with model/params hash

Feature flags
- None

Test plan
- Unit: variable substitution; LLM off/on paths
- E2E: produce a client draft for retell inbound agent prompt and n8n workflow

Acceptance criteria
- Draft created; validation passes; provenance stored