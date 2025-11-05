# Usage Collectors

## Purpose

Collect billable usage from external provider APIs (Retell, Twilio, OpenRouter) via webhook push and scheduled polling, normalize to canonical schema, and store with idempotency guarantees.

## Collection Strategy

### Dual-Path Collection

| Method | Latency | Completeness | Use Case |
|--------|---------|--------------|----------|
| **Webhooks** | < 1 min | Best-effort | Real-time dashboards, operational alerts |
| **API Polling** | < 15 min | Guaranteed | Billing calculations (authoritative source) |

**Reconciliation**: Compare webhook vs. polling counts daily. Alert if discrepancy > 1%.

## Retell AI Collector

### Overview

Collect voice call usage (duration, LLM tokens, cost) from Retell AI.

### Data Sources

**Webhooks**:
- Endpoint: `POST /webhooks/retell`
- Events: `call.completed`, `call.analyzed`
- Payload: Call metadata, duration, LLM usage

**API Polling**:
- Endpoint: `GET https://api.retellai.com/v2/calls`
- Method: Cursor-based pagination
- Schedule: Every 15 minutes (`*/15 * * * *`)

### Webhook Handler

```typescript
@Controller('/billing/collect')
export class RetellWebhookController {
  @Post('/retell')
  @HttpCode(200)
  async handleRetellWebhook(
    @Body() body: any,
    @Headers('x-retell-signature') signature: string,
  ): Promise<void> {
    // 1. Verify signature (HMAC SHA-256)
    const isValid = this.retellAdapter.verifySignature(body, signature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    // 2. Store raw event
    await this.rawEventRepo.save({
      source: 'retell',
      payload: body,
      received_at: new Date(),
      correlation_id: body.call_id,
    });
    
    // 3. Enqueue for normalization (async)
    await this.queue.add('normalize-retell-event', {
      raw_event_id: body.call_id,
    });
    
    // 4. Return 200 OK immediately (idempotent)
    return;
  }
}
```

### API Poller

```typescript
@Injectable()
export class RetellPollerService {
  @Cron('*/15 * * * *')  // Every 15 minutes
  async pollRetellUsage() {
    // 1. Load last checkpoint
    const state = await this.collectorStateRepo.findOne({
      where: { provider_name: 'retell' },
    });
    
    const cursor = state?.cursor || null;
    let hasMore = true;
    let collected = 0;
    
    while (hasMore) {
      try {
        // 2. Fetch page from Retell API
        const response = await this.retellAdapter.listCalls({
          cursor,
          limit: 100,
          status: 'completed',
          created_after: state?.last_run_at,
        });
        
        // 3. Store raw events (batch)
        const rawEvents = response.calls.map(call => ({
          source: 'retell',
          payload: call,
          received_at: new Date(),
          correlation_id: call.call_id,
        }));
        
        await this.rawEventRepo.insert(rawEvents);
        
        // 4. Enqueue normalization
        for (const call of response.calls) {
          await this.queue.add('normalize-retell-event', {
            raw_event_id: call.call_id,
          });
        }
        
        collected += response.calls.length;
        hasMore = !!response.next_cursor;
        cursor = response.next_cursor;
        
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limit: wait and retry
          await this.sleep(60000);  // 1 minute backoff
          continue;
        }
        
        this.logger.error('Retell polling failed', error);
        throw error;
      }
    }
    
    // 5. Update checkpoint
    await this.collectorStateRepo.upsert({
      provider_name: 'retell',
      cursor,
      last_run_at: new Date(),
    }, ['provider_name']);
    
    this.logger.info(`Retell polling complete: ${collected} calls`);
  }
}
```

### Normalization

```typescript
@Processor('usage-normalization')
export class RetellNormalizerConsumer {
  @Process('normalize-retell-event')
  async normalizeRetellEvent(job: Job<{ raw_event_id: string }>) {
    const rawEvent = await this.rawEventRepo.findOne({
      where: { correlation_id: job.data.raw_event_id },
    });
    
    const call = rawEvent.payload as RetellCallPayload;
    
    // 1. Extract usage metrics
    const durationMinutes = call.duration_seconds / 60;
    const llmTokens = call.llm_usage?.total_tokens || 0;
    
    // 2. Calculate vendor cost
    const voiceCost = durationMinutes * 3;  // $0.03/min (Retell pricing)
    const llmCost = llmTokens * 0.00001;    // $0.01/1k tokens
    const totalCostCents = Math.round((voiceCost + llmCost) * 100);
    
    // 3. Attribution (call_id → deployment → client/agent)
    const attribution = await this.attributionService.attributeCall(call.call_id);
    
    // 4. Create usage events (idempotent insert)
    const events: UsageEvent[] = [];
    
    // Voice minutes
    if (durationMinutes > 0) {
      events.push({
        source: 'retell',
        metric_key: 'voice_minutes',
        quantity: durationMinutes,
        vendor_cost_cents: Math.round(voiceCost * 100),
        currency: 'USD',
        occurred_at: new Date(call.completed_at),
        client_id: attribution.client_id,
        agent_id: attribution.agent_id,
        idempotency_key: `retell:call.ended:${call.call_id}`,
        metadata: {
          call_id: call.call_id,
          duration_seconds: call.duration_seconds,
        },
      });
    }
    
    // LLM tokens
    if (llmTokens > 0) {
      events.push({
        source: 'retell',
        metric_key: 'llm_tokens',
        quantity: llmTokens,
        vendor_cost_cents: Math.round(llmCost * 100),
        currency: 'USD',
        occurred_at: new Date(call.completed_at),
        client_id: attribution.client_id,
        agent_id: attribution.agent_id,
        idempotency_key: `retell:llm_tokens:${call.call_id}`,
        metadata: {
          call_id: call.call_id,
          model: call.llm_usage?.model,
        },
      });
    }
    
    // 5. Insert events (skip if duplicate)
    for (const event of events) {
      try {
        await this.usageEventRepo.insert(event);
      } catch (error) {
        if (error.code === '23505') {  // Unique constraint violation
          this.logger.debug(`Duplicate event skipped: ${event.idempotency_key}`);
        } else {
          throw error;
        }
      }
    }
    
    // 6. Mark raw event as processed
    await this.rawEventRepo.update(rawEvent.id, { processed_at: new Date() });
  }
}
```

### Retell API Reference

**List Calls**:
```http
GET https://api.retellai.com/v2/calls?cursor={cursor}&limit=100&status=completed
Authorization: Bearer {RETELL_API_KEY}

Response:
{
  "calls": [
    {
      "call_id": "call_abc123",
      "duration_seconds": 450,
      "status": "completed",
      "completed_at": "2025-10-15T10:30:00Z",
      "llm_usage": {
        "total_tokens": 5000,
        "model": "gpt-4-turbo"
      }
    }
  ],
  "next_cursor": "eyJsYXN0X2lkIjogImNhbGxfYWJjMTIzIn0="
}
```

## Twilio Collector

### Overview

Collect SMS and voice usage from Twilio (message count, call duration, costs).

### Data Sources

**Webhooks**:
- Endpoint: `POST /webhooks/twilio`
- Events: `message-sent`, `call-completed`
- Verification: Twilio SDK signature validation

**API Polling**:
- Endpoints:
  - Messages: `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
  - Calls: `GET https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Calls.json`
- Pagination: Date-based (`DateSent >= {last_run}`)
- Schedule: Every 15 minutes

### API Poller

```typescript
@Injectable()
export class TwilioPollerService {
  @Cron('*/15 * * * *')
  async pollTwilioUsage() {
    const state = await this.collectorStateRepo.findOne({
      where: { provider_name: 'twilio' },
    });
    
    // 1. Poll messages
    const messages = await this.twilioAdapter.listMessages({
      dateSentAfter: state?.last_run_at,
      pageSize: 1000,
    });
    
    for (const msg of messages) {
      await this.normalizeAndStore({
        source: 'twilio',
        type: 'message',
        payload: msg,
      });
    }
    
    // 2. Poll calls
    const calls = await this.twilioAdapter.listCalls({
      startTimeAfter: state?.last_run_at,
      status: 'completed',
      pageSize: 1000,
    });
    
    for (const call of calls) {
      await this.normalizeAndStore({
        source: 'twilio',
        type: 'call',
        payload: call,
      });
    }
    
    // 3. Update checkpoint
    await this.collectorStateRepo.upsert({
      provider_name: 'twilio',
      last_run_at: new Date(),
    }, ['provider_name']);
  }
  
  private async normalizeAndStore(raw: { source: string; type: string; payload: any }) {
    // Extract usage based on type
    if (raw.type === 'message') {
      const msg = raw.payload;
      
      await this.usageEventRepo.insert({
        source: 'twilio',
        metric_key: 'sms_count',
        quantity: 1,
        vendor_cost_cents: Math.round(parseFloat(msg.price) * -100),  // Twilio prices are negative
        currency: 'USD',
        occurred_at: new Date(msg.date_sent),
        client_id: await this.resolveClientId(msg.to),
        idempotency_key: `twilio:message.sent:${msg.sid}`,
        metadata: {
          sid: msg.sid,
          to: msg.to,
          from: msg.from,
          status: msg.status,
        },
      });
    } else if (raw.type === 'call') {
      const call = raw.payload;
      const durationMinutes = parseInt(call.duration) / 60;
      
      await this.usageEventRepo.insert({
        source: 'twilio',
        metric_key: 'voice_minutes',
        quantity: durationMinutes,
        vendor_cost_cents: Math.round(parseFloat(call.price) * -100),
        currency: 'USD',
        occurred_at: new Date(call.start_time),
        client_id: await this.resolveClientId(call.to),
        idempotency_key: `twilio:call.completed:${call.sid}`,
        metadata: {
          sid: call.sid,
          duration_seconds: call.duration,
        },
      });
    }
  }
}
```

## OpenRouter Collector

### Overview

Collect LLM generation usage (tokens, model, cost) from OpenRouter.

### Data Sources

**Webhooks**:
- N/A (OpenRouter does not support webhooks)

**API Polling**:
- Endpoint: `GET https://openrouter.ai/api/v1/generation/logs`
- Pagination: Timestamp-based (`created_after`)
- Schedule: Every 15 minutes

### API Poller

```typescript
@Injectable()
export class OpenRouterPollerService {
  @Cron('*/15 * * * *')
  async pollOpenRouterUsage() {
    const state = await this.collectorStateRepo.findOne({
      where: { provider_name: 'openrouter' },
    });
    
    // 1. Fetch generation logs
    const logs = await this.openRouterAdapter.listGenerations({
      created_after: state?.last_run_at,
      limit: 1000,
    });
    
    for (const log of logs) {
      // 2. Extract token usage and cost
      const totalTokens = log.usage.prompt_tokens + log.usage.completion_tokens;
      const costCents = Math.round(log.total_cost * 100);
      
      // 3. Attribution via correlation_id (from request metadata)
      const attribution = await this.attributionService.attributeRequest(log.id);
      
      // 4. Store usage event
      try {
        await this.usageEventRepo.insert({
          source: 'openrouter',
          metric_key: 'llm_tokens',
          quantity: totalTokens,
          vendor_cost_cents: costCents,
          currency: 'USD',
          occurred_at: new Date(log.created_at),
          client_id: attribution.client_id,
          agent_id: attribution.agent_id,
          idempotency_key: `openrouter:generation:${log.id}`,
          metadata: {
            request_id: log.id,
            model: log.model,
            prompt_tokens: log.usage.prompt_tokens,
            completion_tokens: log.usage.completion_tokens,
          },
        });
      } catch (error) {
        if (error.code === '23505') {
          continue;  // Duplicate, skip
        }
        throw error;
      }
    }
    
    // 5. Update checkpoint
    await this.collectorStateRepo.upsert({
      provider_name: 'openrouter',
      last_run_at: new Date(),
    }, ['provider_name']);
  }
}
```

## Error Handling

### Retry Strategy

```typescript
@Injectable()
export class CollectorRetryService {
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 5,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        if (error.response?.status === 429) {
          // Rate limit: exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 60000);
          this.logger.warn(`Rate limited, retrying in ${backoffMs}ms`);
          await this.sleep(backoffMs);
        } else if (error.response?.status >= 500) {
          // Server error: retry with backoff
          await this.sleep(5000 * attempt);
        } else {
          // Client error: don't retry
          throw error;
        }
      }
    }
  }
}
```

### Error Types

| Error | HTTP Status | Strategy |
|-------|-------------|----------|
| **Invalid API Key** | 401 | Alert ops, halt collector |
| **Rate Limit** | 429 | Exponential backoff (max 60s) |
| **Server Error** | 500-599 | Retry 5×, alert if all fail |
| **Network Timeout** | - | Retry 3×, alert if persistent |
| **Attribution Failure** | - | Store with `client_id = null`, flag for manual review |

## Idempotency Guarantees

### Database Constraint

```sql
CREATE UNIQUE INDEX idx_usage_idempotency ON usage_events(idempotency_key);
```

### Insert Pattern

```typescript
try {
  await this.usageEventRepo.insert(event);
} catch (error) {
  if (error.code === '23505') {  // Unique constraint violation
    this.logger.debug(`Duplicate event skipped: ${event.idempotency_key}`);
    return;  // Idempotent: no-op on duplicate
  }
  throw error;
}
```

## Metrics & Monitoring

```typescript
// Collection metrics
usage.collector.events_collected{provider=retell,method=webhook}
usage.collector.events_collected{provider=retell,method=api_poll}
usage.collector.poll_duration_ms{provider=retell}
usage.collector.errors{provider=retell,error_type=rate_limit}

// Normalization metrics
usage.normalizer.events_normalized{provider=retell}
usage.normalizer.normalization_errors{provider=retell,error=attribution_failed}
usage.normalizer.duplicates_skipped{provider=retell}
```

## Testing

### Unit Tests

```typescript
describe('RetellNormalizer', () => {
  it('should normalize voice call to usage events', async () => {
    const rawCall = {
      call_id: 'call_abc123',
      duration_seconds: 450,
      completed_at: '2025-10-15T10:30:00Z',
      llm_usage: { total_tokens: 5000 },
    };
    
    const events = await normalizer.normalize(rawCall);
    
    expect(events).toHaveLength(2);
    expect(events[0].metric_key).toBe('voice_minutes');
    expect(events[0].quantity).toBe(7.5);  // 450 / 60
    expect(events[1].metric_key).toBe('llm_tokens');
    expect(events[1].quantity).toBe(5000);
  });
});
```

### Integration Tests

```typescript
describe('RetellPoller', () => {
  it('should poll and store usage events', async () => {
    // Mock Retell API
    nock('https://api.retellai.com')
      .get('/v2/calls')
      .reply(200, {
        calls: [{ call_id: 'call_test', duration_seconds: 300 }],
        next_cursor: null,
      });
    
    await poller.pollRetellUsage();
    
    const events = await usageEventRepo.find({ where: { source: 'retell' } });
    expect(events.length).toBeGreaterThan(0);
  });
});
```

## Next Steps

Refer to:
- [Aggregation](./aggregation.md) - Daily rollup pipeline
- [Data Model](./data-model.md) - Usage event schema
- [Reporting](./reporting.md) - Query collected usage
