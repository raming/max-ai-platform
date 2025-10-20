# ADR-0006: LLM Provider Agnostic Abstraction

Status: Proposed

Context
We will use LLMs to prepare prompts, flow specs, webhook mappings, and other client-specific content. We must remain provider-agnostic although OpenRouter is the default.

Decision
- Introduce ILlmPort and adapters (OpenRouter first; allow direct providers later)
- Store generated artifacts as drafts; validate via schemas/contract tests before activation
- Track provenance (model, params, prompt hash); require human approval for activation

Consequences
- Flexibility to switch models/providers per task
- Better governance and reproducibility for generated content

References
- docs/design/llm-and-automation.md
- docs/design/ports-and-adapters.md