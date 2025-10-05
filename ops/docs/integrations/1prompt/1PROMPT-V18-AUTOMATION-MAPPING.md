# 1Prompt Version 1.8 - Automation Mapping Analysis

Reference source: `/Users/rayg/projects/MaxAiAssistant/1prompt/documentation/`

## Version 1.8 Workflow Architecture

(See diagram and folders in the original; mapping retained here for developer reference.)

## Automation Flow Mapping

- Inbound DMs: GHL inbound webhook → n8n → agent → update custom fields
- Phone Calls: Retell webhook → n8n analysis → GHL custom fields → follow-up
- Engagement: Form submit → GHL → n8n lead processing → agent assignment
- Followups: Appointment booked → GHL → n8n confirmation → agent prep
- Reactivation: Trigger → agent selection → outreach → tracking

## Webhook Mapping Template (n8n)

```json
{
  "webhook_mappings": {
    "inbound_dms": "https://n8n-1prompt.99players.com/webhook/{client-dm-webhook}",
    "phone_calls": "https://n8n-1prompt.99players.com/webhook/{client-call-webhook}",
    "engagement": "https://n8n-1prompt.99players.com/webhook/{client-lead-webhook}",
    "followups": "https://n8n-1prompt.99players.com/webhook/{client-booking-webhook}",
    "reactivation": "https://n8n-1prompt.99players.com/webhook/{client-reactivation-webhook}"
  }
}
```

## Links

- [1PROMPT-V18-SYSTEM-ANALYSIS.md](1PROMPT-V18-SYSTEM-ANALYSIS.md)
- [../../design/ports-and-adapters.md](../../design/ports-and-adapters.md)
