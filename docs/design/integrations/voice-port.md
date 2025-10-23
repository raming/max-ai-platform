# Voice Port Specification

**Related Issue**: #156 (ARCH-DOC-09: Integration Adapters Architecture Spec)

## Purpose

The Voice Port (`IVoicePort`) provides a vendor-agnostic interface for managing AI-powered voice calls, including call initiation, status tracking, recording retrieval, and real-time event handling. The primary adapter is Retell AI.

## Port Interface

```typescript
export interface IVoicePort {
  // Call Management
  initiateCall(request: InitiateCallRequest): Promise<Call>;
  getCall(callId: string): Promise<Call>;
  listCalls(filter: CallFilter): Promise<PaginatedResult<Call>>;
  endCall(callId: string): Promise<void>;
  
  // Recording & Transcription
  getRecording(callId: string): Promise<Recording>;
  getTranscript(callId: string): Promise<Transcript>;
  
  // Agent Management
  getAgent(agentId: string): Promise<VoiceAgent>;
  listAgents(): Promise<VoiceAgent[]>;
  createAgent(data: CreateVoiceAgentDTO): Promise<VoiceAgent>;
  updateAgent(agentId: string, data: UpdateVoiceAgentDTO): Promise<VoiceAgent>;
  deleteAgent(agentId: string): Promise<void>;
  
  // Phone Number Management
  listPhoneNumbers(): Promise<PhoneNumber[]>;
  provisionPhoneNumber(request: ProvisionPhoneNumberRequest): Promise<PhoneNumber>;
  releasePhoneNumber(phoneNumberId: string): Promise<void>;
  
  // Real-time Events (WebSocket)
  subscribeToCallEvents(callId: string, handler: CallEventHandler): Promise<void>;
  unsubscribeFromCallEvents(callId: string): Promise<void>;
  
  // Provider Metadata
  getProviderName(): string;
  getProviderCapabilities(): VoiceCapabilities;
  isHealthy(): Promise<boolean>;
}
```

## Domain Models

### Call

```typescript
export interface Call {
  id: string;
  agentId: string;
  phoneNumberId: string;
  direction: CallDirection;
  from: string;
  to: string;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  recordingUrl?: string;
  transcriptUrl?: string;
  disconnectReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum CallStatus {
  QUEUED = 'queued',
  RINGING = 'ringing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no_answer',
  CANCELLED = 'cancelled',
}

export interface InitiateCallRequest {
  agentId: string;
  toNumber: string;
  fromNumber?: string; // defaults to agent's configured number
  metadata?: Record<string, unknown>;
}

export interface CallFilter {
  agentId?: string;
  direction?: CallDirection;
  status?: CallStatus;
  startTimeAfter?: Date;
  startTimeBefore?: Date;
  limit?: number;
  offset?: number;
}
```

### Recording & Transcript

```typescript
export interface Recording {
  callId: string;
  url: string;
  duration: number; // seconds
  format: 'mp3' | 'wav';
  size: number; // bytes
  createdAt: Date;
}

export interface Transcript {
  callId: string;
  text: string;
  turns: TranscriptTurn[];
  summary?: string;
  sentiment?: Sentiment;
  language: string;
  createdAt: Date;
}

export interface TranscriptTurn {
  speaker: 'agent' | 'user';
  text: string;
  startTime: number; // seconds from call start
  endTime: number;
  confidence?: number; // 0-1
}

export interface Sentiment {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
}
```

### Voice Agent

```typescript
export interface VoiceAgent {
  id: string;
  name: string;
  voiceId: string;
  llmModel: string;
  systemPrompt: string;
  firstMessage?: string;
  language: string;
  maxCallDuration?: number; // seconds
  enableRecording: boolean;
  enableTranscription: boolean;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoiceAgentDTO {
  name: string;
  voiceId: string; // provider-specific voice ID
  llmModel: string; // e.g., 'gpt-4', 'claude-3.5-sonnet'
  systemPrompt: string;
  firstMessage?: string;
  language?: string; // defaults to 'en-US'
  maxCallDuration?: number;
  enableRecording?: boolean; // defaults to true
  enableTranscription?: boolean; // defaults to true
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateVoiceAgentDTO extends Partial<CreateVoiceAgentDTO> {}
```

### Phone Number

```typescript
export interface PhoneNumber {
  id: string;
  number: string;
  countryCode: string;
  type: PhoneNumberType;
  capabilities: PhoneNumberCapabilities;
  agentId?: string; // if assigned to agent
  status: PhoneNumberStatus;
  createdAt: Date;
}

export enum PhoneNumberType {
  LOCAL = 'local',
  TOLL_FREE = 'toll_free',
  MOBILE = 'mobile',
}

export interface PhoneNumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
}

export enum PhoneNumberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export interface ProvisionPhoneNumberRequest {
  countryCode: string; // e.g., 'US', 'CA'
  areaCode?: string;
  type?: PhoneNumberType;
}
```

### Real-time Events

```typescript
export type CallEventHandler = (event: CallEvent) => void;

export interface CallEvent {
  type: CallEventType;
  callId: string;
  timestamp: Date;
  data: unknown;
}

export enum CallEventType {
  CALL_STARTED = 'call_started',
  CALL_ENDED = 'call_ended',
  CALL_ANALYZED = 'call_analyzed',
  TRANSCRIPT_UPDATE = 'transcript_update',
  AGENT_SPEAKING = 'agent_speaking',
  USER_SPEAKING = 'user_speaking',
  ERROR = 'error',
}
```

## Retell AI Adapter

### Configuration

```typescript
export interface RetellConfig {
  apiKey: string;
  apiUrl: string; // https://api.retellai.com
  websocketUrl: string; // wss://api.retellai.com
  webhookSecret: string;
  rateLimits: {
    requestsPerSecond: number; // 10 by default
    concurrentCalls: number; // 100 by default
  };
}
```

### Authentication

Retell uses API key authentication:

```typescript
Authorization: Bearer <api-key>
```

### API Mapping

| Port Operation | Retell API Endpoint | Method |
|---------------|---------------------|--------|
| `initiateCall` | `/create-phone-call` | POST |
| `getCall` | `/get-call/{call_id}` | GET |
| `listCalls` | `/list-calls` | GET |
| `endCall` | `/stop-call` | POST |
| `getAgent` | `/get-agent/{agent_id}` | GET |
| `listAgents` | `/list-agents` | GET |
| `createAgent` | `/create-agent` | POST |
| `updateAgent` | `/update-agent/{agent_id}` | PATCH |
| `deleteAgent` | `/delete-agent/{agent_id}` | DELETE |
| `listPhoneNumbers` | `/list-phone-numbers` | GET |
| `provisionPhoneNumber` | `/create-phone-number` | POST |
| `releasePhoneNumber` | `/delete-phone-number/{number_id}` | DELETE |

### WebSocket Integration

Retell provides real-time call events via WebSocket:

```typescript
// Connect to WebSocket
const ws = new WebSocket('wss://api.retellai.com/call-events', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
});

// Subscribe to call
ws.send(JSON.stringify({
  type: 'subscribe',
  call_id: callId,
}));

// Receive events
ws.on('message', (data) => {
  const event = JSON.parse(data);
  handler(mapRetellEventToDomain(event));
});
```

### Usage Tracking Integration

All call operations report usage to Billing-Usage component:

```typescript
// After call completes
await billingService.recordUsage({
  tenantId: call.tenantId,
  provider: 'retell',
  resourceType: 'voice_call',
  quantity: call.duration, // seconds
  unitPrice: 0.05, // per minute
  metadata: {
    callId: call.id,
    agentId: call.agentId,
    direction: call.direction,
  },
});

// For recording storage
await billingService.recordUsage({
  tenantId: call.tenantId,
  provider: 'retell',
  resourceType: 'voice_recording',
  quantity: recording.size, // bytes
  unitPrice: 0.001, // per MB per month
  metadata: {
    callId: call.id,
    format: recording.format,
  },
});
```

## Error Handling

### Rate Limiting

- **Limit**: 10 requests/second, 100 concurrent calls
- **Response**: HTTP 429 with `Retry-After` header
- **Strategy**: Token bucket with exponential backoff

### Common Errors

| Retell Error | HTTP Status | Domain Error |
|--------------|-------------|--------------|
| Invalid API key | 401 | `AuthenticationError` |
| Agent not found | 404 | `NotFoundError` |
| Call in progress | 409 | `ConflictError` |
| Concurrent call limit | 429 | `RateLimitError` |
| Invalid phone number | 400 | `ValidationError` |
| Insufficient balance | 402 | `PaymentRequiredError` |

## Testing Strategy

### Unit Tests
- Mock Retell HTTP responses for each operation
- Test WebSocket event handling
- Validate usage tracking integration
- Test error mapping and retry logic

### Integration Tests
- Use Retell sandbox environment
- Test full call lifecycle (initiate → in-progress → completed)
- Validate recording/transcript retrieval
- Test WebSocket reconnection

### Contract Tests
- Verify adapter implements all IVoicePort methods
- Validate domain model structure
- Test real-time event types

---

**Related**: See [overview.md](./overview.md) for ports & adapters pattern details.
