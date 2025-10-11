import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock crypto for signature verification
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(Buffer.from('mock-signature', 'hex'))
  })),
  timingSafeEqual: jest.fn().mockReturnValue(true)
}));

// Mock NextResponse
const mockJsonResponse = { status: 200, payload: {} };
const mockJson = jest.fn().mockReturnValue(mockJsonResponse);

jest.mock('next/server', () => ({
  NextResponse: {
    json: mockJson
  }
}));

// Mock ingress components
const mockVerify = jest.fn().mockResolvedValue({ ok: true });
const mockNormalize = jest.fn().mockResolvedValue({
  eventType: 'test.event',
  occurredAt: new Date().toISOString(),
  tenantId: 'test-tenant',
  clientId: 'test-client',
  provider: 'retell',
  topic: 'webhook',
  payload: { test: 'data' },
  correlationId: 'test-correlation-id',
  idempotencyKey: 'test-key'
});
const mockPublish = jest.fn().mockResolvedValue(undefined);
const mockCheckAndStore = jest.fn().mockReturnValue(true);

jest.mock('../../../lib/ingress/verifier', () => ({
  IngressVerifier: jest.fn().mockImplementation(() => ({
    verify: mockVerify
  }))
}));

jest.mock('../../../lib/ingress/normalizer', () => ({
  EventNormalizer: jest.fn().mockImplementation(() => ({
    normalize: mockNormalize
  }))
}));

jest.mock('../../../lib/ingress/publisher', () => ({
  EventPublisher: jest.fn().mockImplementation(() => ({
    publish: mockPublish
  }))
}));

jest.mock('../../../lib/ingress/idempotency', () => ({
  idempotencyStore: {
    checkAndStore: mockCheckAndStore
  }
}));

describe('Ingress Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJson.mockReturnValue(mockJsonResponse);
  });

  describe('Retell Ingress Endpoint', () => {
    it('should accept valid webhook with signature verification', async () => {
      const { POST } = await import('../retell/route');

      const mockRequest = {
        text: jest.fn().mockResolvedValue(JSON.stringify({ event: 'test' })),
        headers: {
          get: jest.fn((key: string) => {
            const headers: Record<string, string> = {
              'x-retell-signature': 'valid-signature',
              'x-correlation-id': 'test-correlation-id',
              'idempotency-key': 'test-key'
            };
            return headers[key] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['x-retell-signature', 'valid-signature'],
            ['x-correlation-id', 'test-correlation-id'],
            ['idempotency-key', 'test-key']
          ])
        }
      };

      await POST(mockRequest as any);

      expect(mockVerify).toHaveBeenCalledWith('retell', expect.any(Object), expect.any(String));
      expect(mockNormalize).toHaveBeenCalled();
      expect(mockPublish).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(
        { status: 'accepted', correlationId: 'test-correlation-id' },
        { status: 202 }
      );
    });

    it('should reject webhook with invalid signature', async () => {
      mockVerify.mockResolvedValueOnce({ ok: false, reason: 'signature_mismatch' });

      const { POST } = await import('../retell/route');

      const mockRequest = {
        text: jest.fn().mockResolvedValue(JSON.stringify({ event: 'test' })),
        headers: {
          get: jest.fn((key: string) => {
            const headers: Record<string, string> = {
              'x-retell-signature': 'invalid-signature',
              'x-correlation-id': 'test-correlation-id'
            };
            return headers[key] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['x-retell-signature', 'invalid-signature'],
            ['x-correlation-id', 'test-correlation-id']
          ])
        }
      };

      await POST(mockRequest as any);

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Signature verification failed', reason: 'signature_mismatch' },
        { status: 401 }
      );
    });

    it('should handle duplicate idempotency key', async () => {
      mockCheckAndStore.mockReturnValueOnce(false);

      const { POST } = await import('../retell/route');

      const mockRequest = {
        text: jest.fn().mockResolvedValue(JSON.stringify({ event: 'test' })),
        headers: {
          get: jest.fn((key: string) => {
            const headers: Record<string, string> = {
              'x-retell-signature': 'valid-signature',
              'x-correlation-id': 'test-correlation-id',
              'idempotency-key': 'duplicate-key'
            };
            return headers[key] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['x-retell-signature', 'valid-signature'],
            ['x-correlation-id', 'test-correlation-id'],
            ['idempotency-key', 'duplicate-key']
          ])
        }
      };

      await POST(mockRequest as any);

      expect(mockJson).toHaveBeenCalledWith(
        { status: 'duplicate' },
        { status: 200 }
      );
    });
  });

  describe('Stripe Ingress Endpoint', () => {
    it('should accept valid Stripe webhook', async () => {
      const { POST } = await import('../payments/route');

      const mockRequest = {
        text: jest.fn().mockResolvedValue(JSON.stringify({ type: 'payment_intent.succeeded' })),
        headers: {
          get: jest.fn((key: string) => {
            const headers: Record<string, string> = {
              'stripe-signature': 't=1234567890,v1=valid-signature',
              'x-correlation-id': 'test-correlation-id'
            };
            return headers[key] || null;
          }),
          entries: jest.fn().mockReturnValue([
            ['stripe-signature', 't=1234567890,v1=valid-signature'],
            ['x-correlation-id', 'test-correlation-id']
          ])
        }
      };

      await POST(mockRequest as any);

      expect(mockVerify).toHaveBeenCalledWith('stripe', expect.any(Object), expect.any(String));
      expect(mockJson).toHaveBeenCalledWith(
        { status: 'accepted', correlationId: 'test-correlation-id' },
        { status: 202 }
      );
    });
  });
});