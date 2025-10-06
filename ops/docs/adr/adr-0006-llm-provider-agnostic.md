# ADR-0006: LLM Provider Agnostic Abstraction

Status: Accepted
Date: 2025-10-06
Deciders: Architecture Team

## Context
We will use LLMs to prepare prompts, flow specs, webhook mappings, and other client-specific content. We must remain provider-agnostic although OpenRouter is the default, and enforce controls for validation, provenance, and cost.

## Decision
- Introduce ILlmPort and adapters (OpenRouter first; allow direct providers later)
- Store generated artifacts as drafts; validate via JSON Schemas/contract tests in CI and non-prod runtime before activation
- Track provenance (model, params, prompt hash, tokens, cost); require human approval for activation
- Enforce policy/guardrails (prohibited content, PII/PHI filters), determinism for schema-bound tasks, and per-tenant budget controls

## Consequences
- Flexibility to switch models/providers per task; stronger governance and reproducibility
- Predictable cost and safer automation via validation and policy enforcement

## References
- ops/docs/design/llm-provider-automation-spec.md
- ops/docs/design/llm-and-automation.md
- ops/docs/design/ports-and-adapters.md
