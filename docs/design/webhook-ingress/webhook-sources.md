# Webhook Ingress - Webhook Sources

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Status**: Specification  

## Purpose

This document defines platform-specific webhook schemas, signature verification methods, and event types for each external webhook source.

## GoHighLevel (GHL)

### Authentication

**Method**: HMAC SHA-256 signature

**Signature Location**: `X-GHL-Signature` header

**Algorithm**:
```typescript
function verifyGHLSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Configuration**:
```typescript
interface GHLWebhookConfig {
  webhook_secret: string;  // From GHL app settings
  location_id: string;     // GHL location identifier
}
```

### Event Types

#### Contact Created
```json
{
  "type": "ContactCreate",
  "location_id": "abc123",
  "id": "contact_456",
  "contact": {
    "id": "contact_456",
    "location_id": "abc123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "tags": ["lead", "interested"],
    "custom_fields": {
      "company": "Acme Corp",
      "industry": "Technology"
    },
    "date_added": "2025-10-21T10:30:00Z"
  }
}
```

#### Contact Updated
```json
{
  "type": "ContactUpdate",
  "location_id": "abc123",
  "id": "contact_456",
  "contact": {
    "id": "contact_456",
    "location_id": "abc123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "tags": ["lead", "interested", "qualified"],
    "custom_fields": {
      "company": "Acme Corp",
      "industry": "Technology",
      "budget": "50000"
    },
    "date_updated": "2025-10-21T11:45:00Z"
  }
}
```

#### Opportunity Status Changed
```json
{
  "type": "OpportunityStatusUpdate",
  "location_id": "abc123",
  "id": "opp_789",
  "opportunity": {
    "id": "opp_789",
    "contact_id": "contact_456",
    "pipeline_id": "pipeline_1",
    "pipeline_stage_id": "stage_2",
    "name": "Enterprise Deal",
    "status": "won",
    "monetary_value": 50000,
    "date_updated": "2025-10-21T12:00:00Z"
  }
}
```

#### Appointment Created
```json
{
  "type": "AppointmentCreate",
  "location_id": "abc123",
  "id": "appt_101",
  "appointment": {
    "id": "appt_101",
    "contact_id": "contact_456",
    "calendar_id": "cal_1",
    "title": "Discovery Call",
    "start_time": "2025-10-22T14:00:00Z",
    "end_time": "2025-10-22T15:00:00Z",
    "assigned_user_id": "user_1",
    "status": "confirmed"
  }
}
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GHL Webhook Event",
  "type": "object",
  "required": ["type", "location_id", "id"],
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "ContactCreate",
        "ContactUpdate",
        "ContactDelete",
        "OpportunityCreate",
        "OpportunityStatusUpdate",
        "AppointmentCreate",
        "AppointmentUpdate",
        "TaskCreate",
        "TaskUpdate",
        "NoteCreate"
      ]
    },
    "location_id": {
      "type": "string"
    },
    "id": {
      "type": "string"
    },
    "contact": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "location_id": { "type": "string" },
        "first_name": { "type": "string" },
        "last_name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "custom_fields": { "type": "object" },
        "date_added": { "type": "string", "format": "date-time" },
        "date_updated": { "type": "string", "format": "date-time" }
      }
    },
    "opportunity": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "contact_id": { "type": "string" },
        "pipeline_id": { "type": "string" },
        "pipeline_stage_id": { "type": "string" },
        "name": { "type": "string" },
        "status": { "type": "string" },
        "monetary_value": { "type": "number" },
        "date_updated": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### Normalization Rules

```typescript
function normalizeGHLWebhook(webhook: GHLWebhook): CanonicalWebhookEvent {
  const eventTypeMap = {
    'ContactCreate': 'contact.created',
    'ContactUpdate': 'contact.updated',
    'ContactDelete': 'contact.deleted',
    'OpportunityCreate': 'opportunity.created',
    'OpportunityStatusUpdate': 'opportunity.status_changed',
    'AppointmentCreate': 'appointment.created',
    'AppointmentUpdate': 'appointment.updated'
  };
  
  return {
    event_id: generateUUID(),
    source: 'ghl',
    event_type: eventTypeMap[webhook.type],
    received_at: new Date().toISOString(),
    tenant_id: resolveTenantId(webhook.location_id),
    customer_id: webhook.contact?.id,
    data: {
      location_id: webhook.location_id,
      resource_id: webhook.id,
      resource: webhook.contact || webhook.opportunity || webhook.appointment
    },
    original: webhook,
    metadata: {
      signature_verified: true,
      schema_valid: true
    }
  };
}
```

## Retell AI

### Authentication

**Method**: Bearer token or custom signature

**Signature Location**: `Authorization` header or `X-Retell-Signature`

**Algorithm**:
```typescript
function verifyRetellSignature(
  payload: string,
  signature: string,
  apiKey: string
): boolean {
  // Retell uses API key validation
  return signature === `Bearer ${apiKey}`;
}
```

**Configuration**:
```typescript
interface RetellWebhookConfig {
  api_key: string;        // Retell API key
  agent_id?: string;      // Optional agent filter
}
```

### Event Types

#### Call Started
```json
{
  "event": "call_started",
  "call_id": "call_abc123",
  "agent_id": "agent_456",
  "call_type": "inbound",
  "from_number": "+1234567890",
  "to_number": "+0987654321",
  "metadata": {
    "customer_id": "cust_789",
    "campaign_id": "camp_101"
  },
  "started_at": "2025-10-21T10:00:00Z"
}
```

#### Call Ended
```json
{
  "event": "call_ended",
  "call_id": "call_abc123",
  "agent_id": "agent_456",
  "call_type": "inbound",
  "from_number": "+1234567890",
  "to_number": "+0987654321",
  "duration_seconds": 180,
  "end_reason": "completed",
  "transcript": "Hello, how can I help you today?...",
  "metadata": {
    "customer_id": "cust_789",
    "sentiment": "positive",
    "intent": "support"
  },
  "started_at": "2025-10-21T10:00:00Z",
  "ended_at": "2025-10-21T10:03:00Z"
}
```

#### Recording Ready
```json
{
  "event": "recording_ready",
  "call_id": "call_abc123",
  "recording_url": "https://storage.retellai.com/recordings/call_abc123.mp3",
  "duration_seconds": 180,
  "format": "mp3",
  "created_at": "2025-10-21T10:05:00Z"
}
```

#### Transcript Available
```json
{
  "event": "transcript_available",
  "call_id": "call_abc123",
  "transcript": {
    "segments": [
      {
        "speaker": "agent",
        "text": "Hello, how can I help you today?",
        "timestamp": 0.5
      },
      {
        "speaker": "customer",
        "text": "I need help with my order",
        "timestamp": 3.2
      }
    ],
    "full_text": "Agent: Hello, how can I help you today?\nCustomer: I need help with my order...",
    "language": "en-US"
  },
  "created_at": "2025-10-21T10:05:00Z"
}
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Retell Webhook Event",
  "type": "object",
  "required": ["event", "call_id"],
  "properties": {
    "event": {
      "type": "string",
      "enum": [
        "call_started",
        "call_ended",
        "call_analyzed",
        "recording_ready",
        "transcript_available"
      ]
    },
    "call_id": { "type": "string" },
    "agent_id": { "type": "string" },
    "call_type": { "type": "string", "enum": ["inbound", "outbound"] },
    "from_number": { "type": "string" },
    "to_number": { "type": "string" },
    "duration_seconds": { "type": "number" },
    "transcript": { "type": "string" },
    "recording_url": { "type": "string", "format": "uri" },
    "metadata": { "type": "object" },
    "started_at": { "type": "string", "format": "date-time" },
    "ended_at": { "type": "string", "format": "date-time" },
    "created_at": { "type": "string", "format": "date-time" }
  }
}
```

### Normalization Rules

```typescript
function normalizeRetellWebhook(webhook: RetellWebhook): CanonicalWebhookEvent {
  return {
    event_id: generateUUID(),
    source: 'retell',
    event_type: `call.${webhook.event.replace('call_', '')}`,
    received_at: new Date().toISOString(),
    customer_id: webhook.metadata?.customer_id,
    data: {
      call_id: webhook.call_id,
      agent_id: webhook.agent_id,
      call_type: webhook.call_type,
      duration_seconds: webhook.duration_seconds,
      transcript: webhook.transcript,
      recording_url: webhook.recording_url,
      metadata: webhook.metadata
    },
    original: webhook,
    metadata: {
      signature_verified: true,
      schema_valid: true
    }
  };
}
```

## Twilio

### Authentication

**Method**: Request signature validation (HMAC SHA-1)

**Signature Location**: `X-Twilio-Signature` header

**Algorithm**:
```typescript
import { validateRequest } from 'twilio';

function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  return validateRequest(authToken, signature, url, params);
}
```

**Configuration**:
```typescript
interface TwilioWebhookConfig {
  auth_token: string;      // Twilio auth token
  account_sid: string;     // Twilio account SID
  webhook_url: string;     // Full webhook URL for signature validation
}
```

### Event Types

#### Message Sent
```json
{
  "MessageSid": "SM1234567890abcdef",
  "AccountSid": "AC1234567890abcdef",
  "MessagingServiceSid": "MG1234567890abcdef",
  "From": "+1234567890",
  "To": "+0987654321",
  "Body": "Hello, this is a test message",
  "NumMedia": "0",
  "MessageStatus": "sent",
  "ApiVersion": "2010-04-01",
  "DateCreated": "2025-10-21T10:00:00Z",
  "DateSent": "2025-10-21T10:00:05Z"
}
```

#### Message Delivered
```json
{
  "MessageSid": "SM1234567890abcdef",
  "MessageStatus": "delivered",
  "ErrorCode": null,
  "DateUpdated": "2025-10-21T10:00:10Z"
}
```

#### Call Initiated
```json
{
  "CallSid": "CA1234567890abcdef",
  "AccountSid": "AC1234567890abcdef",
  "From": "+1234567890",
  "To": "+0987654321",
  "CallStatus": "initiated",
  "Direction": "outbound-api",
  "ApiVersion": "2010-04-01",
  "Timestamp": "2025-10-21T10:00:00Z"
}
```

#### Call Completed
```json
{
  "CallSid": "CA1234567890abcdef",
  "AccountSid": "AC1234567890abcdef",
  "From": "+1234567890",
  "To": "+0987654321",
  "CallStatus": "completed",
  "CallDuration": "125",
  "RecordingUrl": "https://api.twilio.com/recordings/RE1234.mp3",
  "Timestamp": "2025-10-21T10:02:05Z"
}
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Twilio Webhook Event",
  "type": "object",
  "oneOf": [
    {
      "title": "Message Event",
      "required": ["MessageSid", "AccountSid", "MessageStatus"],
      "properties": {
        "MessageSid": { "type": "string" },
        "AccountSid": { "type": "string" },
        "MessagingServiceSid": { "type": "string" },
        "From": { "type": "string" },
        "To": { "type": "string" },
        "Body": { "type": "string" },
        "MessageStatus": {
          "type": "string",
          "enum": ["queued", "sent", "delivered", "failed", "undelivered"]
        }
      }
    },
    {
      "title": "Call Event",
      "required": ["CallSid", "AccountSid", "CallStatus"],
      "properties": {
        "CallSid": { "type": "string" },
        "AccountSid": { "type": "string" },
        "From": { "type": "string" },
        "To": { "type": "string" },
        "CallStatus": {
          "type": "string",
          "enum": ["queued", "initiated", "ringing", "in-progress", "completed", "failed"]
        },
        "CallDuration": { "type": "string" }
      }
    }
  ]
}
```

### Normalization Rules

```typescript
function normalizeTwilioWebhook(webhook: TwilioWebhook): CanonicalWebhookEvent {
  const isMessage = 'MessageSid' in webhook;
  const isCall = 'CallSid' in webhook;
  
  let event_type: string;
  let resource_id: string;
  
  if (isMessage) {
    event_type = `message.${webhook.MessageStatus}`;
    resource_id = webhook.MessageSid;
  } else if (isCall) {
    event_type = `call.${webhook.CallStatus}`;
    resource_id = webhook.CallSid;
  }
  
  return {
    event_id: generateUUID(),
    source: 'twilio',
    event_type,
    received_at: new Date().toISOString(),
    data: {
      resource_id,
      account_sid: webhook.AccountSid,
      from: webhook.From,
      to: webhook.To,
      status: webhook.MessageStatus || webhook.CallStatus,
      body: webhook.Body,
      duration: webhook.CallDuration ? parseInt(webhook.CallDuration) : undefined,
      recording_url: webhook.RecordingUrl
    },
    original: webhook,
    metadata: {
      signature_verified: true,
      schema_valid: true
    }
  };
}
```

## Stripe

### Authentication

**Method**: Webhook signature verification (HMAC SHA-256)

**Signature Location**: `Stripe-Signature` header

**Algorithm**:
```typescript
import Stripe from 'stripe';

function verifyStripeSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    secret
  );
}
```

**Configuration**:
```typescript
interface StripeWebhookConfig {
  webhook_secret: string;  // From Stripe webhook settings (whsec_...)
  api_key: string;         // Stripe secret key
}
```

### Event Types

#### Payment Intent Succeeded
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1729508400,
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "amount": 5000,
      "currency": "usd",
      "customer": "cus_1234567890",
      "description": "Subscription payment",
      "metadata": {
        "tenant_id": "tenant_123",
        "subscription_id": "sub_456"
      },
      "status": "succeeded",
      "created": 1729508300
    }
  }
}
```

#### Customer Subscription Updated
```json
{
  "id": "evt_0987654321",
  "object": "event",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "object": "subscription",
      "customer": "cus_1234567890",
      "status": "active",
      "current_period_start": 1729508400,
      "current_period_end": 1732186800,
      "plan": {
        "id": "plan_premium",
        "amount": 5000,
        "currency": "usd",
        "interval": "month"
      },
      "metadata": {
        "tenant_id": "tenant_123"
      }
    }
  }
}
```

#### Invoice Payment Failed
```json
{
  "id": "evt_invoice_failed",
  "object": "event",
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_1234567890",
      "object": "invoice",
      "customer": "cus_1234567890",
      "subscription": "sub_1234567890",
      "amount_due": 5000,
      "amount_paid": 0,
      "status": "open",
      "attempted": true,
      "attempt_count": 1,
      "metadata": {
        "tenant_id": "tenant_123"
      }
    }
  }
}
```

### JSON Schema

Stripe provides official TypeScript types. Use `@types/stripe` for schema validation.

```typescript
import type { Stripe } from 'stripe';

type StripeWebhookEvent = Stripe.Event;
```

### Normalization Rules

```typescript
function normalizeStripeWebhook(event: Stripe.Event): CanonicalWebhookEvent {
  const eventTypeMap = {
    'payment_intent.succeeded': 'payment.succeeded',
    'payment_intent.payment_failed': 'payment.failed',
    'customer.subscription.created': 'subscription.created',
    'customer.subscription.updated': 'subscription.updated',
    'customer.subscription.deleted': 'subscription.cancelled',
    'invoice.payment_failed': 'invoice.failed'
  };
  
  const tenant_id = (event.data.object as any).metadata?.tenant_id;
  const customer_id = (event.data.object as any).customer;
  
  return {
    event_id: event.id,
    source: 'stripe',
    event_type: eventTypeMap[event.type] || event.type,
    received_at: new Date().toISOString(),
    tenant_id,
    customer_id,
    data: {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      resource: event.data.object,
      previous_attributes: event.data.previous_attributes
    },
    original: event,
    metadata: {
      signature_verified: true,
      schema_valid: true
    }
  };
}
```

## Platform Comparison

| Feature | GHL | Retell | Twilio | Stripe |
|---------|-----|--------|--------|--------|
| **Signature Method** | HMAC SHA-256 | Bearer Token | HMAC SHA-1 | HMAC SHA-256 |
| **Signature Header** | X-GHL-Signature | Authorization | X-Twilio-Signature | Stripe-Signature |
| **Retry Policy** | 3 attempts | 5 attempts | 3 attempts | Built-in retries |
| **Timeout** | 10s | 30s | 15s | 10s |
| **Event Ordering** | Not guaranteed | Not guaranteed | Not guaranteed | Not guaranteed |
| **Idempotency** | event ID | call_id | MessageSid/CallSid | event.id |
| **SDK Available** | No | No | Yes (twilio) | Yes (stripe) |

## Testing Webhooks

### Local Development

**Using ngrok**:
```bash
# Start ngrok tunnel
ngrok http 3000

# Configure webhook URL in platform
# GHL: https://<ngrok-id>.ngrok.io/webhooks/ghl
# Retell: https://<ngrok-id>.ngrok.io/webhooks/retell
# Twilio: https://<ngrok-id>.ngrok.io/webhooks/twilio
# Stripe: https://<ngrok-id>.ngrok.io/webhooks/stripe
```

### Test Payloads

```bash
# Test GHL webhook
curl -X POST http://localhost:3000/webhooks/ghl \
  -H "Content-Type: application/json" \
  -H "X-GHL-Signature: <computed-signature>" \
  -d @test/fixtures/ghl-contact-created.json

# Test Stripe webhook (using Stripe CLI)
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger payment_intent.succeeded
```

## Related Documentation

- [Overview](./overview.md) - Component architecture
- [Validation](./validation.md) - Security and schema validation
- [Routing](./routing.md) - Event routing logic
- [Error Handling](./error-handling.md) - Resilience strategies
