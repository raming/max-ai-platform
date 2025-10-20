# Notifications and SMS Strategy

Purpose
Define when to use internal notifications vs n8n, and how SMS is delivered in AI agent conversations with contingency paths.

Channels
- Internal notifications service (critical): billing, auth/security, SLA alerts
- n8n (business/process): onboarding reminders, multi-branch ops flows

SMS delivery in agent conversations (contingency options)
1) Direct via IMessagePort (Twilio adapter)
   - Pros: control, observability, retries; provider-agnostic routing later
   - Cons: we own throughput and compliance
2) Via GHL API
   - Pros: leverage client’s CRM context and opt-outs
   - Cons: depends on GHL API availability/limits
3) Via n8n Twilio node
   - Pros: rapid build; visual branching; credential store
   - Cons: adds another hop; ensure idempotency and rate limits

Design guidance
- For critical SLA messaging, prefer internal IMessagePort; for campaign-like flows, n8n; for CRM-bound SMS, consider GHL adapter
- Always log message attempts with correlation_id; redact PII
- Rate limiting and retries on all paths; DLQ for failures

References
- architecture-overview.md
- ports-and-adapters.md
