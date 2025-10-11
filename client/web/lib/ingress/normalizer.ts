// Event normalizer for webhook ingress

import { IEventNormalizer, IngressProvider, NormalizedEvent } from '../ports/ingress';

export class EventNormalizer implements IEventNormalizer {
  async normalize(
    provider: IngressProvider,
    topic: string,
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedEvent> {
    const correlationId = this.extractCorrelationId(payload, headers);
    const idempotencyKey = headers['idempotency-key'];

    // Extract tenant and client IDs based on provider
    const { tenantId, clientId } = this.extractTenantClientInfo(provider, payload, headers);

    return {
      eventType: this.mapEventType(provider, topic, payload),
      occurredAt: this.extractTimestamp(payload),
      tenantId,
      clientId,
      provider,
      topic,
      payload,
      correlationId,
      idempotencyKey
    };
  }

  private extractCorrelationId(payload: unknown, headers: Record<string, string>): string {
    // Try to extract correlation ID from various sources
    const payloadObj = payload as Record<string, unknown>;
    return (
      headers['x-correlation-id'] ||
      payloadObj.correlationId as string ||
      payloadObj.correlation_id as string ||
      payloadObj.id as string ||
      crypto.randomUUID()
    );
  }

  private extractTenantClientInfo(
    provider: IngressProvider,
    payload: unknown,
    headers: Record<string, string>
  ): { tenantId: string; clientId: string } {
    // Default values - in production, these would be extracted from auth context
    // or provider-specific fields
    return {
      tenantId: headers['x-tenant-id'] || 'default-tenant',
      clientId: headers['x-client-id'] || 'default-client'
    };
  }

  private mapEventType(provider: IngressProvider, topic: string, payload: unknown): string {
    // Map provider-specific events to normalized types
    const payloadObj = payload as Record<string, unknown>;
    switch (provider) {
      case IngressProvider.RETELL:
        return `voice.call.${payloadObj.type as string || 'unknown'}`;
      case IngressProvider.TWILIO:
        return `sms.${topic}`;
      case IngressProvider.STRIPE:
        return `payment.${payloadObj.type as string || 'unknown'}`;
      case IngressProvider.GHL:
        return `ghl.${topic}`;
      default:
        return 'unknown';
    }
  }

  private extractTimestamp(payload: unknown): string {
    // Extract timestamp from various possible fields
    const payloadObj = payload as Record<string, unknown>;
    const timestamp = (
      payloadObj.timestamp ||
      payloadObj.created ||
      payloadObj.occurred_at ||
      payloadObj.event_timestamp
    );

    if (timestamp) {
      // If it's already an ISO string, use it
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        return timestamp;
      }
      // If it's a number (Unix timestamp), convert to ISO
      if (typeof timestamp === 'number') {
        return new Date(timestamp * 1000).toISOString();
      }
      // Try to parse as date
      try {
        return new Date(timestamp as string | number).toISOString();
      } catch {
        // Fall back to current time
      }
    }

    return new Date().toISOString();
  }
}