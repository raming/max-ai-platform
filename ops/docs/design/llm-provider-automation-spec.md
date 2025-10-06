# LLM Provider and Content Automation — Extreme Detail Spec

Purpose
Define a provider-agnostic LLM integration and content automation pipeline for generating/editing prompts, flow specs, webhook mappings, and deployment artifacts with strict controls, validation, and observability.

Ports (interfaces)
- ILlmPort: generate({task, input, modelHints, policy}) → {content, tokens, modelId}
- IContentValidator: validate({type, content}) → {ok, errors[]}
- IContentRegistry: saveDraft({type, content, meta}) → draftId; promote(draftId) → versionId
- IProvenanceStore: record({artifactId, modelId, params, promptHash, cost, tokens})

Artifacts (types)
- prompt_template, prompt_instance
- flow_spec (JSON Schema governed)
- webhook_mapping
- deployment_plan (links to template deployment)

Policies & safety
- Guardrails: prohibited content categories, PII/PHI leakage filters
- Determinism where required: temperature <= 0.2 for schema-bound generation
- Rate/Cost controls: per-tenant quotas; budget alerts via metrics

Workflow
1) Authoring request (human → API): choose artifact type, inputs, constraints
2) ILlmPort runs with modelHints; retries on provider errors with backoff
3) IContentValidator validates against canonical JSON Schemas
4) Save as draft (IContentRegistry) with provenance recorded; human review required
5) Promote to active only after contract tests pass in CI/non-prod runtime

Contracts (JSON Schemas)
- Reuse existing schemas (prompt-template.schema.json, prompt-instance.schema.json, flow.schema.json)
- Add webhook-mapping.schema.json (provider→internal mapping rules)

Observability
- Logs: artifact_type, artifact_id, tenant_id, model_id, tokens, cost_cents, correlation_id
- Metrics: llm_requests_total{provider,model}, llm_tokens_total{direction}, llm_failures_total{reason}, content_validation_failures_total
- Traces: span around ILlmPort calls; annotate provider/model, tokens

NFRs
- P95 generation latency < 3s for 4k-token prompts; retry budget ≤ 2
- Validation failure rate < 2% for schema-bound tasks in non-prod
- Cost guard: enforce per-tenant budgets with alerting

Error taxonomy
- 400.validation_error | 422.policy_violation
- 429.rate_limited
- 502.provider_error_{provider}

Test strategy
- Unit: ILlmPort adapter mock; policy filters; schema validation; provenance recording
- Integration: end-to-end draft → CI contract tests → promote
- Contract: schema validation for each artifact type; negative tests

Acceptance criteria
- ILlmPort abstraction with at least one provider adapter (OpenRouter)
- Draft → promote pipeline implemented with validation and provenance
- Observability and budget controls in place; basic guardrails enforced

References
- ADR-0006 — LLM Provider Agnostic Abstraction
- ops/docs/design/impl/phase-1/prompt-svc.md
- ops/docs/design/impl/phase-1/template-deployment.md
