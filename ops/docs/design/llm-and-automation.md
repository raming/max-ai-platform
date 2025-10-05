# LLM and Automation

Purpose
Define how LLMs are used to generate and refine prompts, flow specs, and webhook mappings, with provider-agnostic abstraction.

Provider abstraction
- ILlmPort with adapters: OpenRouter (default), direct model APIs (e.g., OpenAI, Anthropic) as needed
- Capabilities: content generation, critique/evaluation, (optional) embeddings
- Model selection: per task via config/flags; caching and temperature presets

Workflow
1) Author requests generation (prompt, flow spec, webhook map) via portal or CLI
2) ILlmPort generates draft → saved as a draft Template/Flow in prompt-svc/orchestrator
3) Non-prod validation: JSON Schema validation, contract tests, lint/evaluator critiques
4) Human review/edits; track diffs; iterate as needed
5) Promote to active: orchestrator/adapters push to n8n, GHL, Retell with upsert semantics
6) Revisions: edit and re-push; full audit trail maintained

Guardrails
- No secrets in prompts or logs; redaction rules enforced
- Validation and canary in non-prod before activation
- Telemetry: correlation IDs; store model, parameters, and prompt hashes for traceability

References
- docs/design/ports-and-adapters.md (ILlmPort)
- docs/adr/adr-0006-llm-provider-agnostic.md
- docs/release/phase-1.md