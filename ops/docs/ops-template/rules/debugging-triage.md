# Debugging and triage best practices (canonical)

Purpose
Provide a consistent, safe, and efficient approach for Dev and QA to investigate and resolve issues across local, sandbox/test, staging/pilot, and production environments.

Golden rules
- Reproduce in the lowest environment possible (local → test → staging) before prod.
- Use correlation IDs, structured logs, metrics, and traces as primary signals.
- Never exfiltrate secrets/PHI; follow redaction and data-handling rules.
- Minimize impact in shared environments; coordinate via issues and labels.

Signals and tools
- Logs: structured JSON with correlation_id; search by request_id/order_id (no PHI).
- Metrics: latency (p50/p95/p99), error rates, resource utilization.
- Traces: OTEL spans around inbound requests and external calls (DB/HTTP/queue).
- Dashboards: standard boards for key services; error budget views.

Local debugging
- Use unit/integration tests to isolate logic; add temporary DEBUG logs behind feature flags.
- Run services with in-memory or containerized dependencies; use seeded datasets.
- Validate failing paths with contract tests for adapters.

Sandbox/test
- Reproduce with test data; never use real PHI/PII.
- Enable DEBUG selectively (flag/env) for the failing component; disable afterward.
- Capture correlation IDs and link logs/traces in the issue.

Staging/pilot
- Coordinate via issues; add labels: seat:<seat>, help:needed if needed; notify TL/human.
- Use WARN for degraded ops, ERROR for actionable failures. Avoid error spam.
- Roll forward with a small, tested change; avoid hot‑patch unless urgent.

Production
- Prefer read‑only access for triage (logs/metrics/traces). No interactive prod debugging without approval.
- Use correlation IDs from user reports or synthetic probes to find impacted requests.
- If mitigation is needed: feature flags, canary, rollback; follow incident playbook.

Safe data handling
- Mask/redact sensitive fields; never copy PHI/PII to external tools.
- Use scrubbed datasets for reproduction; remove temporary data after use.

Issue hygiene
- Always include: environment, steps to reproduce, expected vs actual, correlation_id(s), logs/trace links, version/commit.
- Apply labels: area:*, seat:<seat>, phase:*, and help:needed if human input required.
- Cross‑link related issues/PRs; mark blocked where applicable.

Escalation
- If stuck > agreed SLA: move to needs‑review, tag human:<name> and seat:team_lead.*; summarize findings and next steps.

Close‑out
- Add test coverage for the regression; include a log/trace assertion if applicable.
- Document lessons learned and update runbooks.
