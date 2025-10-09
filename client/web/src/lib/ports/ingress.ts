// Ingress ports for webhook processing

export enum IngressProvider {
  RETELL = 'retell',
  TWILIO = 'twilio',
  STRIPE = 'stripe',
  GHL = 'ghl'
}

export interface IngressVerificationResult {
  ok: boolean;
  reason?: string;
}

export interface IIngressVerifier {
  verify(provider: IngressProvider, headers: Record<string, string>, rawBody: string): Promise<IngressVerificationResult>;
}

export interface NormalizedEvent {
  eventType: string;
  occurredAt: string;
  tenantId: string;
  clientId: string;
  provider: IngressProvider;
  topic: string;
  payload: any;
  correlationId: string;
  idempotencyKey?: string;
}

export interface IEventNormalizer {
  normalize(provider: IngressProvider, topic: string, payload: any, headers: Record<string, string>): Promise<NormalizedEvent>;
}

export interface RoutingKey {
  tenantId: string;
  clientId: string;
  eventType: string;
}

export interface IEventPublisher {
  publish(event: NormalizedEvent, routing: RoutingKey): Promise<void>;
}