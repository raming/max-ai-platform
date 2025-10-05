# 1Prompt v1.8 System Architecture Analysis

Reference source: `/Users/rayg/projects/MaxAiAssistant/1prompt/documentation/`

## System Understanding

Based on analysis of n8n workflows, Retell AI agents, and custom fields flow patterns:

## Core System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Customer/Client   │    │   GoHighLevel       │    │      n8n            │
│                     │───▶│   (CRM/Workflows)   │◀──▶│   (Processing)      │
│   • Phone Calls     │    │                     │    │                     │
│   • Web Forms       │    │   • Contact Mgmt    │    │   • Data Transform  │
│   • Chat Messages   │    │   • Custom Fields   │    │   • API Calls       │
└─────────────────────┘    │   • Triggers        │    │   • Webhook Routes  │
           │                └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           │                           ▼                           ▼
           │                ┌─────────────────────┐    ┌─────────────────────┐
           └───────────────▶│   Retell AI         │    │    Supabase         │
                            │   (Voice Agent)     │    │   (Database)        │
                            │                     │    │                     │
                            │   • Call Handling   │    │   • Data Storage    │
                            │   • Post-call Data  │    │   • Analytics       │
                            │   • Custom Fields   │    │   • Audit Trail     │
                            └─────────────────────┘    └─────────────────────┘
```

## Critical Integration Points

**Key webhook patterns:**

1. **Inbound Call Processing**
   - Retell Webhook: `https://n8n-1prompt.99players.com/webhook/c1025914-8ede-42c7-8a0d-184265c49338`
   - Purpose: post-call data + custom fields
   - Flow: Retell → n8n → GHL contact updates

2. **Outbound Call Results**  
   - GHL Webhook: `https://services.leadconnectorhq.com/hooks/dzTOfajR3YuQKAqE1myz/webhook-trigger/7MHbwPBCqpRowJkAkvUq`
   - Purpose: campaign results and call outcomes
   - Flow: GHL → n8n → agent triggers

## n8n Workflows & Custom Fields

| Workflow | Purpose | Custom Fields Role |
|----------|---------|-------------------|
| **booking-function** | Appointment booking | ✅ booking preferences, time slots, service type |
| **text-engine** | Text/chat processing | ✅ conversation context extraction |
| **get-contact-detail-hl** | Contact lookup | 🔍 existing custom fields for context |
| **campaign-make-call-retel** | Voice calls initiate | 📤 custom fields to Retell for personalization |
| **make-call-retel** | Direct call execution | 📤 custom fields in call context |

## GHL Custom Fields Configuration Example

```json
{
  "custom_fields": {
    "field_mapping": {
      "inquiry_type": "cf_inquiry_type",
      "service_interest": "cf_service_interest", 
      "budget_range": "cf_budget_range",
      "contact_preference": "cf_contact_preference",
      "lead_score": "cf_lead_score",
      "call_outcome": "cf_call_outcome"
    },
    "field_types": {
      "cf_inquiry_type": "dropdown",
      "cf_service_interest": "multi_select",
      "cf_budget_range": "dropdown",
      "cf_contact_preference": "radio",
      "cf_lead_score": "number",
      "cf_call_outcome": "text"
    }
  }
}
```

## API Endpoints (GHL)

- **Custom Fields Discovery**: `GET /locations/{locationId}/customFields`
- **Contact Management**: Standard GHL contact APIs
- **Workflow Management**: Various GHL workflow endpoints

## Links

- [../../design/integrations-crm.md](../../design/integrations-crm.md) — ICRMPort design
- [../../design/integrations-voice.md](../../design/integrations-voice.md) — Voice agent integration
- [1PROMPT-V18-AUTOMATION-MAPPING.md](1PROMPT-V18-AUTOMATION-MAPPING.md) — Workflow automation patterns