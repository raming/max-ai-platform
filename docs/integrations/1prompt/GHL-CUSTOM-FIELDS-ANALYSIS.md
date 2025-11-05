# GHL Custom Fields Analysis

Reference source: `/Users/rayg/projects/MaxAiAssistant/1prompt/documentation/`

## Live Custom Fields Discovered

- **Location**: MaxAi Assistant (`yrMl7UtmMqo31qLMP76W`)
- **Total Fields**: 44 custom fields

## Field Categories

### Agent System Fields (1Prompt-specific)
- `Agent Type` → `agent_type_new` (SINGLE_OPTIONS: Website Agent, Engagement Agent, Followup Agent, Webinar Agent)
- `Communication` (SMS, WhatsApp, Email)
- `Channel` (SMS, WhatsApp, Live Chat, Instagram, Email, Facebook Messenger)

### Conversation Management
- `chatHistory` (LARGE_TEXT) - Complete chat transcripts
- `Call History 1/2/3` (LARGE_TEXT) - Call transcripts and notes
- `Response1/2/3/4/5` (LARGE_TEXT) - Agent responses
- `MasterMessage` (TEXT) - Primary message template
- `Personalized Message` → `personalized_first_message` (TEXT)

### Business Data Fields
- `Business Name` → `business_name` (TEXT)
- `Company Description` → `company_description` (LARGE_TEXT)
- `Company LinkedIn` → `company_linkedin` (TEXT)
- `LinkedIn` → `linkedin` (TEXT)
- `Meeting Link` → `meeting_link` (TEXT)

## Field Key Patterns

System uses pattern: `contact.{field_name_with_underscores}`

Examples:
- `contact.agent_type_new`
- `contact.personalized_first_message` 
- `contact.call_history_1`
- `contact.business_name`

## API Endpoints for Discovery

- `GET /locations/{locationId}/customFields` — Discover fields
- Standard GHL Contact APIs for field updates

## Links

- [../../design/integrations-crm.md](../../design/integrations-crm.md) — ICRMPort implementation
- [1PROMPT-V18-SYSTEM-ANALYSIS.md](1PROMPT-V18-SYSTEM-ANALYSIS.md) — System overview