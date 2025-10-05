# Webhook Ingress (MVP) — Detailed Spec

Purpose
Terminate external webhooks (Retell, Twilio, Payments, GHL as applicable), normalize payloads via JSON Schemas, attach correlation/tenant IDs, and forward to orchestrator or n8n.

Endpoints
- POST /ingress/retell — signature verify, normalize VoiceCallEvent
- POST /ingress/twilio/sms — signature verify, normalize SmsEvent
- POST /ingress/payments/{provider} — signature verify, normalize PaymentEvent
- POST /ingress/ghl/{topic} — as available, normalize GhlEvent

Normalization contracts
- VoiceCallEvent, SmsEvent, PaymentEvent, GhlEvent

Contracts
- See: ../../contracts/voice-call-event.schema.json
- See: ../../contracts/sms-event.schema.json
- See: ../../contracts/payment-event.schema.json
- See: ../../contracts/ghl-event.schema.json

Forwarding
- Publish normalized events to internal queue with routing keys (tenant_id, client_id, event_type)

Acceptance criteria
- Signature verification implemented; invalid signatures rejected
- Schemas enforced in non-prod runtime; unit tests ≥95%
- Events observed in orchestrator/n8n with correlation IDs