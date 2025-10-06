# Logging and observability (canonical)

Purpose
Define consistent logging, metrics, and tracing practices so coders and SREs can reliably operate the system without noise or blind spots.

Structured logging
- JSON logs only; no free‑form strings. Always include: timestamp, level, service, environment, correlation_id (request_id), user/seat if available.
- Never log secrets, tokens, PHI/PII. Mask/redact known fields at the edge (middleware/interceptors).
- Log keys, not essays: prefer {"event":"order.created","order_id":"…","store":"…"} over long messages.

Levels and guidance
- TRACE: extremely verbose internal steps; off in prod.
- DEBUG: developer diagnostics; off in prod by default (enable per incident).
- INFO: business‑relevant events (state transitions: created/submitted/ready), lifecycle milestones (start/stop), configuration load.
- WARN: unusual but recoverable conditions (retry scheduled, fallback path). Actionable but not necessarily errors.
- ERROR: actual failures that need attention (request failed, data corruption detected). Should be tied to alerts/SLOs.
- FATAL: process‑ending conditions. Rare.

Rules of thumb
- Do not log ERROR for expected domain outcomes (e.g., invalid input validation); use INFO or WARN with context and return 4xx.
- One ERROR per failure path: avoid cascades that flood logs. Include cause chain.
- Use WARN for degraded operations (e.g., provider timeout with retry), include retry count/backoff.

Correlation and context
- Propagate correlation_id/request_id across services; inject into every log line for a request.
- Include domain IDs sparingly: order_id, patient_id, store_id (no PHI).

Metrics & alerts
- Emit counters for success/failure by route; histograms for latency (p50/p95/p99); gauges for in‑flight requests.
- Tie ERROR rates and p95 latency to SLO alerts with sensible burn‑rate policies.

Tracing
- OpenTelemetry spans around inbound requests, external calls (DB, HTTP, queue), and critical domain operations.
- Attach attributes (route, status_code, retry_count) and link correlation_id to trace_id.

NestJS/Node implementation hints
- Use a request logging interceptor/middleware to:
  - assign request_id (if absent), add to context
  - log inbound (INFO) with route, method; outbound (INFO) with status, latency
  - mask sensitive fields (password, tokens, card proxies)
- Use pino/winston transports with severity mapping to OTEL/log sinks.
- Centralize error handler to log ERROR once with stack (non‑sensitive) and a safe error code.

Testing logging
- Unit: assert key events are logged at the right level (use in‑memory transports).
- Integration: verify request logging and error logging on failure paths.

Review checklist (maintainers)
- Are levels appropriate (no error‑spam; actionable WARN/ERROR)?
- Are correlation IDs and key context present? PII redaction in place?
- Are logs structured and sparse (no walls of text)?
- Are metrics/traces emitted for critical paths?
