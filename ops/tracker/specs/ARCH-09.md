# ARCH-09 — LLM Provider and Content Automation

Summary
Introduce ILlmPort, provider adapters, and a governed content-generation pipeline for prompts, flow specs, and webhook mappings with human review and non-prod validation before activation.

Scope
- ILlmPort contracts and OpenRouter adapter; design for additional providers
- Generation workflow: draft → validate (schemas/contracts) → human review → promote → push via adapters
- Provenance: record model, parameters, prompt hash; audit all changes

Outputs
- Schemas for GeneratedArtifact and EvaluationReport
- Adapter design for OpenRouter; plan for direct model APIs
- Non-prod validation checklist and promotion policy

Acceptance criteria
- L1: ILlmPort contracts and OpenRouter adapter design
- L2: Draft-to-promote workflow documented and demoed with one artifact
- L3: Provenance/audit fields defined; redaction policy applied

References
- docs/design/llm-and-automation.md
- docs/adr/adr-0006-llm-provider-agnostic.md
- docs/release/phase-1.md