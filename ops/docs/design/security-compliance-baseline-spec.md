# Security & Compliance Baseline — Extreme Detail Spec

Purpose
Define platform-wide security and compliance baselines for Phase 1 with concrete, testable requirements and operational procedures.

Scope
- Authentication/Authorization (gateway and services)
- Logging redaction and sensitive data handling
- Audit logging (events, schema, retention)
- Secrets and token management
- Webhook and API request integrity
- Incident response and breach handling (runbooks)
- PCI SAQ A posture, consent/privacy safeguards

Non-functional requirements (NFRs)
- Availability ≥ 99.9% for gateway; audit pipeline loss rate < 0.01%
- Latency budget impact: security checks add ≤ 10ms P95 per request
- Retention: audit events ≥ 180 days (non-prod: 30 days) with tamper-evidence

Architecture
- Gateway enforces JWT/OIDC auth; service tokens for machine-to-machine
- RBAC at gateway; services verify claims and enforce tenant/client scopes
- Logger middleware applies redaction; tracing propagates correlation_id
- Audit writer writes to append-only log store with checksum

Audit event schema (JSON Schema)
- $ref: ops/docs/contracts/meta/audit-event.schema.json
- fields: id, at, actor_id, tenant_id, client_id, action, resource, outcome, severity, metadata, correlation_id, checksum

Redaction policy
- Default deny for secrets in logs
- Regex filters: tokens (JWT-like), API keys, emails when unnecessary
- Structured logs ensure fields-only redaction; no raw bodies printed

Token & secrets management
- Store tokens/keys in a secrets manager; rotate quarterly or per provider policy
- Never expose provider tokens to browser (token proxy); only server-side usage

Webhook integrity
- Signature verification per provider; reject on invalid signature or timestamp skew
- Idempotency keys to avoid duplicate processing

Incident response (runbooks)
- ops/docs/runbooks/incident-response.md — classification, triage, containment, eradication, recovery, postmortem
- ops/docs/runbooks/breach-notification.md — thresholds, roles, notifications, timelines

Compliance baseline
- PCI SAQ A: hosted UIs only; verify payment webhooks signatures; no cardholder data storage
- Privacy: minimize PII in logs; consent records for data processing where applicable

Observability
- Metrics: auth_failures_total, redaction_events_total, audit_write_failures_total
- Traces: include auth decision annotations and audit write spans

Test strategy
- Unit: redaction filters; audit writer checksum; webhook signature validators
- Integration: gateway auth + RBAC; audit write durably recorded; tokens rotated (mock)
- Contract: audit-event.schema.json; security response codes; negative tests

Acceptance criteria
- Logger redaction enabled in all services; configuration committed
- Audit events present for RBAC changes, token mint/revoke, webhook failures, and admin actions
- Webhook signature verification enforced across providers; idempotency implemented
- Incident runbooks committed and linked; dry-run exercise documented

References
- ADR-0008 — Security/Compliance Baseline
- ops/docs/design/impl/phase-1/iam.md
- ops/docs/docs/design/impl/phase-1/webhook-ingress.md
