# Messaging Port Specification

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Purpose

The Messaging Port (`IMessagePort`) provides a vendor-agnostic interface for sending SMS/MMS messages, tracking delivery status, and managing phone numbers. The primary adapter is Twilio.

## Port Interface

```typescript
export interface IMessagePort {
  // Message Management
  sendMessage(request: SendMessageRequest): Promise<Message>;
  getMessage(messageId: string): Promise<Message>;
  listMessages(filter: MessageFilter): Promise<PaginatedResult<Message>>;
  
  // Phone Number Management
  listPhoneNumbers(): Promise<MessagingPhoneNumber[]>;
  getPhoneNumber(phoneNumberId: string): Promise<MessagingPhoneNumber>;
  provisionPhoneNumber(request: ProvisionMessagingNumberRequest): Promise<MessagingPhoneNumber>;
  releasePhoneNumber(phoneNumberId: string): Promise<void>;
  
  // Webhook Handling
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseDeliveryReceipt(payload: unknown): DeliveryReceipt;
  
  // Provider Metadata
  getProviderName(): string;
  getProviderCapabilities(): MessagingCapabilities;
  isHealthy(): Promise<boolean>;
}
```

## Domain Models

### Message

```typescript
export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: MessageDirection;
  status: MessageStatus;
  mediaUrls?: string[];
  numSegments: number;
  numMedia: number;
  price?: number;
  priceUnit?: string;
  errorCode?: string;
  errorMessage?: string;
  sentAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageDirection {
  OUTBOUND = 'outbound',
  INBOUND = 'inbound',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  UNDELIVERED = 'undelivered',
  FAILED = 'failed',
}

export interface SendMessageRequest {
  from: string; // phone number
  to: string;   // phone number
  body: string;
  mediaUrls?: string[]; // for MMS
  statusCallbackUrl?: string; // webhook URL for delivery receipts
}

export interface MessageFilter {
  from?: string;
  to?: string;
  direction?: MessageDirection;
  status?: MessageStatus;
  sentAfter?: Date;
  sentBefore?: Date;
  limit?: number;
  offset?: number;
}
```

### Phone Number

```typescript
export interface MessagingPhoneNumber {
  id: string;
  number: string;
  friendlyName?: string;
  countryCode: string;
  type: MessagingNumberType;
  capabilities: MessagingCapabilities;
  status: MessagingNumberStatus;
  createdAt: Date;
}

export enum MessagingNumberType {
  LOCAL = 'local',
  TOLL_FREE = 'toll_free',
  SHORTCODE = 'shortcode',
}

export interface MessagingCapabilities {
  sms: boolean;
  mms: boolean;
  voice: boolean;
}

export enum MessagingNumberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export interface ProvisionMessagingNumberRequest {
  countryCode: string; // e.g., 'US', 'CA'
  areaCode?: string;
  type?: MessagingNumberType;
  friendlyName?: string;
}
```

### Delivery Receipt

```typescript
export interface DeliveryReceipt {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
}
```

## Twilio Adapter

### Configuration

```typescript
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiUrl: string; // https://api.twilio.com/2010-04-01
  webhookSecret?: string; // for signature validation
  rateLimits: {
    messagesPerSecond: number; // 100 by default
  };
}
```

### Authentication

Twilio uses HTTP Basic Authentication:

```typescript
Authorization: Basic base64(accountSid:authToken)
```

### API Mapping

| Port Operation | Twilio API Endpoint | Method |
|---------------|---------------------|--------|
| `sendMessage` | `/Accounts/{AccountSid}/Messages.json` | POST |
| `getMessage` | `/Accounts/{AccountSid}/Messages/{Sid}.json` | GET |
| `listMessages` | `/Accounts/{AccountSid}/Messages.json` | GET |
| `listPhoneNumbers` | `/Accounts/{AccountSid}/IncomingPhoneNumbers.json` | GET |
| `getPhoneNumber` | `/Accounts/{AccountSid}/IncomingPhoneNumbers/{Sid}.json` | GET |
| `provisionPhoneNumber` | `/Accounts/{AccountSid}/IncomingPhoneNumbers.json` | POST |
| `releasePhoneNumber` | `/Accounts/{AccountSid}/IncomingPhoneNumbers/{Sid}.json` | DELETE |

### Webhook Signature Verification

Twilio signs webhook requests with HMAC-SHA256:

```typescript
private verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', this.config.authToken)
    .update(payload)
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Delivery Receipt Handling

Twilio sends delivery receipts via webhooks:

```typescript
// Inbound webhook payload
{
  "MessageSid": "SM...",
  "MessageStatus": "delivered",
  "To": "+15558675309",
  "From": "+15551234567",
  "Body": "Message text",
  "NumSegments": "1",
  "NumMedia": "0"
}

// Parsed to domain model
private parseDeliveryReceipt(payload: any): DeliveryReceipt {
  return {
    messageId: payload.MessageSid,
    status: this.mapTwilioStatusToDomain(payload.MessageStatus),
    timestamp: new Date(),
    errorCode: payload.ErrorCode,
    errorMessage: payload.ErrorMessage,
  };
}
```

### Usage Tracking Integration

All messaging operations report usage to Billing-Usage component:

```typescript
// After message sent
await billingService.recordUsage({
  tenantId: message.tenantId,
  provider: 'twilio',
  resourceType: 'sms',
  quantity: message.numSegments, // SMS segments
  unitPrice: 0.0075, // per segment
  metadata: {
    messageId: message.id,
    from: message.from,
    to: message.to,
    direction: message.direction,
  },
});

// For MMS
if (message.numMedia > 0) {
  await billingService.recordUsage({
    tenantId: message.tenantId,
    provider: 'twilio',
    resourceType: 'mms',
    quantity: message.numMedia,
    unitPrice: 0.02, // per media attachment
    metadata: {
      messageId: message.id,
    },
  });
}
```

### SMS Segmentation

Twilio automatically segments long messages:

| Message Type | Max Length | Segment Length |
|-------------|-----------|----------------|
| GSM-7 (basic) | 160 chars | 153 chars (if multi-part) |
| UCS-2 (Unicode) | 70 chars | 67 chars (if multi-part) |

```typescript
// Calculate segment count
private calculateSegments(body: string): number {
  const isUnicode = /[^\x00-\x7F]/.test(body);
  const maxLength = isUnicode ? 70 : 160;
  const segmentLength = isUnicode ? 67 : 153;
  
  if (body.length <= maxLength) {
    return 1;
  }
  
  return Math.ceil(body.length / segmentLength);
}
```

## Error Handling

### Rate Limiting

- **Limit**: 100 messages/second per account
- **Response**: HTTP 429
- **Strategy**: Token bucket with exponential backoff

### Common Errors

| Twilio Error Code | HTTP Status | Domain Error |
|-------------------|-------------|--------------|
| 20003 (Auth failure) | 401 | `AuthenticationError` |
| 21211 (Invalid number) | 400 | `ValidationError` |
| 21408 (Unsubscribed) | 400 | `OptOutError` |
| 21610 (Blocked number) | 400 | `BlockedNumberError` |
| 30003 (Unreachable) | 400 | `UnreachableError` |
| 30008 (Unknown error) | 500 | `IntegrationError` |

### Retry Logic

Only retry on transient errors:

```typescript
const retryableErrors = [
  '30001', // Queue overflow
  '30002', // Account suspended (temporary)
  '30004', // Message blocked (temporary)
  '30005', // Unknown destination handset
];

private shouldRetry(errorCode: string): boolean {
  return retryableErrors.includes(errorCode);
}
```

## Phone Number Provisioning

### Search for Available Numbers

```typescript
// Twilio API call
GET /AvailablePhoneNumbers/{CountryCode}/Local.json?AreaCode=415

// Returns available numbers
[
  {
    "friendly_name": "(415) 555-0001",
    "phone_number": "+14155550001",
    "capabilities": {
      "SMS": true,
      "MMS": true,
      "Voice": true
    }
  }
]
```

### Provision Number

```typescript
POST /IncomingPhoneNumbers.json
{
  "PhoneNumber": "+14155550001",
  "FriendlyName": "MAX AI Platform",
  "SmsUrl": "https://platform.example.com/webhooks/twilio-sms",
  "SmsMethod": "POST",
  "StatusCallback": "https://platform.example.com/webhooks/twilio-status"
}
```

## Testing Strategy

### Unit Tests
- Mock Twilio HTTP responses for each operation
- Test webhook signature verification
- Validate SMS segmentation calculation
- Test error mapping and retry logic

### Integration Tests
- Use Twilio test credentials
- Test full message lifecycle (send → delivered)
- Validate delivery receipt parsing
- Test phone number provisioning

### Contract Tests
- Verify adapter implements all IMessagePort methods
- Validate domain model structure
- Test webhook payload parsing

---

**Related**: See [overview.md](./overview.md) for ports & adapters pattern details.
