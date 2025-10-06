# Webhook Ingress (MVP) — Extreme Detail Spec

Purpose
Terminate external webhooks (Retell, Twilio, Payments, GHL), normalize payloads via JSON Schemas, attach correlation/tenant IDs, enforce signature and idempotency, and forward to orchestrator or n8n via the messaging backbone.

Ports (interfaces)
- IIngressVerifier: verify(provider, headers, rawBody) → { ok, reason? }
- IEventNormalizer: normalize(provider, topic, payload) → NormalizedEvent
- IEventPublisher: publish(event: NormalizedEvent, routing: RoutingKey) → void

Endpoints
- POST /ingress/retell
- POST /ingress/twilio/sms
- POST /ingress/payments/{provider}
- POST /ingress/ghl/{topic}

Endpoint behaviors
- Content-Type: application/json; reject others (415)
- Signature verification: 401 on failure; include reason code (sig.invalid, timestamp.skew)
- Idempotency: header Idempotency-Key supported; duplicates return 200 with {status: duplicate}
- Response codes: 202 accepted on successful enqueue; 400 on schema validation error; 500 on internal errors

Normalization contracts (JSON Schemas)
- ../../contracts/voice-call-event.schema.json
- ../../contracts/sms-event.schema.json
- ../../contracts/payment-event.schema.json
- ../../contracts/ghl-event.schema.json

Event envelope (normalized)
- required: event_type, occurred_at, tenant_id, client_id, provider, topic, payload, correlation_id
- correlation_id rules: from provider if present; else generate UUID v4

Forwarding (messaging backbone)
- Queue: ingress-events; job type: webhook-process; priority by provider/topic
- Routing keys: tenant_id, client_id, event_type
- Retry policy: attempts=5, exponential backoff starting 2s; DLQ on exhaustion
- Idempotency key: tenant_id:provider:topic:hash(payload):5m-window

Security & compliance
- Signature verification per provider:
  - Retell: HMAC from X-Retell-Signature
  - Twilio: X-Twilio-Signature with URL validation
  - Payments: Stripe-style signature verification (clock skew: ±5m)
  - GHL: validate known headers and payload timestamp
- Redaction: remove tokens/PII from logs; never log full rawBody
- PCI posture: SAQ A; hosted UIs; verify payment webhooks signatures; no card data persistence

Observability
- Structured logs with fields: provider, topic, event_type, tenant_id, client_id, correlation_id, request_id
- Metrics: ingress_requests_total{provider,topic}, ingress_verify_failures_total, ingress_enqueue_latency_ms p50/p95/p99
- Traces: span per request; link to downstream orchestrator job via correlation_id

NFRs
- Throughput: ≥100 RPS sustained across providers
- Latency: enqueue P95 < 150ms; P99 < 300ms
- Error budget: <0.5% 4xx due to validation (excluding bad providers); <0.1% 5xx

Error taxonomy
- 400.schema_violation
- 401.signature_invalid | 401.timestamp_skew
- 409.duplicate (idempotency)
- 415.unsupported_media_type
- 500.enqueue_failed

Test strategy
- Unit: signature verifiers and normalizers; ≥95% coverage
- Integration: endpoint → normalize → enqueue; schema validations against JSON Schemas
- Contract: provider sample payloads validated; negative cases for signature/timestamp
- E2E: one path through orchestrator confirms correlation and audit

Acceptance criteria
- Signature verification implemented per provider; invalid signatures/timestamps rejected with clear codes
- JSON Schemas enforced in non-prod runtime; CI contract tests pass
- Ingress events appear in orchestrator/n8n with correlation IDs; metrics and logs present
- Idempotency prevents duplicate enqueue within 5 minutes
- Performance meets NFRs (enqueue P95 <150ms in test)
