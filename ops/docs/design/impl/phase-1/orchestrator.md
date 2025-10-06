# Declarative Orchestrator & Flow Schema (MVP) — Extreme Detail Spec

Purpose
Execute validated flow specs (triggers, steps, retries, conditionals) and delegate complex branches to n8n via adapter, with strict contracts, idempotency, and observability.

Ports (interfaces)
- IFlowRegistryPort: createDraft(flowSpec), promote(flowId), get(flowId)
- IFlowExecutorPort: execute(flowId, input, context) → ExecutionResult
- IAdapterRegistry: resolve(port, tenantBinding) → Adapter
- IN8nWorkflowPort: run(workflowId, payload) → Result

Flow JSON Schema (canonical)
- ../../contracts/flow.schema.json
- flow: { id, name, version, tenant_id, client_id, description? }
- bindings: { crm, calendar, payments, voice, message } mapped to adapter IDs
- triggers: [{ type: webhook|schedule|manual, event: string, filter? }]
- steps: [{ id, name, port, action, input, when?, retry{max_attempts, backoff_ms}, timeout_ms? }]
- on_error: { strategy: fail|continue|compensate, steps?: [] }

APIs
- POST /flows — create/update flow (draft); 201 with flowId; 400 on schema errors
- POST /flows/{id}/promote — 200; 409 if already active; 400 if invalid
- POST /flows/{id}/run — 202 accept (non-prod only); includes correlation_id

Execution semantics
- Step execution order: sequential by default; future: parallel groups allowed with barrier
- Idempotency: flowId:correlationId guard; replay returns prior result when idempotency-key present
- Retry: per-step config; default max_attempts=3, exponential backoff starting 5s
- Timeout: per-step timeout_ms; default 60s; timeout yields retry until max_attempts
- Delegation: steps with port=workflow route to n8n via IN8nWorkflowPort

Observability & audit
- Logs fields: flow_id, step_id, step_name, tenant_id, correlation_id, adapter, duration_ms, outcome
- Metrics: orchestrator_step_duration_ms (histogram), orchestrator_step_retries_total, orchestrator_executions_total
- Traces: span per step; link to ingress via correlation_id; annotate retries and outcomes
- Audit: write flow state changes (draft→active), executions (start/end), and errors with summaries

Security & compliance
- Redact secrets in logs; propagate minimal context (no PII in step logs)
- Enforce RBAC on flow mutation APIs (admin/flow_manager roles)

NFRs
- Execution latency: simple 3-step flow P95 < 1.5s (excluding external provider latency)
- Reliability: step success rate > 99% with retries
- Throughput: ≥100 concurrent executions per instance

Error taxonomy
- 400.flow_schema_invalid | 400.step_invalid
- 404.flow_not_found
- 409.flow_state_conflict (promote already active)
- 408.step_timeout
- 502.adapter_error (with adapter code)

Test strategy
- Unit: step runner, retry/backoff, idempotency guard; ≥95% coverage
- Integration: execute sample flows with mocked adapters; verify traces/metrics
- Contract: flow.schema.json validation (positive/negative cases)
- E2E: Retell → CRM upsert → Calendar booking full path with audit

Acceptance criteria
- Flow schema and validator implemented with examples
- Endpoints enforce schema and RBAC; idempotency guard present; retries honored
- Delegation to n8n verified with callback path and result handling
- Telemetry (logs/metrics/traces) confirms each step and outcomes
