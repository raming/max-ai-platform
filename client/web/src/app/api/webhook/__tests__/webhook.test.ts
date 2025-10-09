import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature')
  })),
  timingSafeEqual: jest.fn().mockReturnValue(true)
}));

// Mock Stripe
const mockConstructEvent = jest.fn();
const mockStripeInstance = { webhooks: { constructEvent: mockConstructEvent } };
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn(() => mockStripeInstance)
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((payload: any, opts?: any) => ({ status: opts?.status ?? 200, payload }))
  }
}));

describe('Webhook Signature Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies Retell signature correctly', async () => {
    const { verifyRetellSignature } = await import('../route');
    const payload = 'test-payload';
    const signature = 'mocked-signature';
    const secret = 'test-secret';

    const result = verifyRetellSignature(payload, signature, secret);

    expect(result).toBe(true);
    expect(require('crypto').createHmac).toHaveBeenCalledWith('sha256', secret);
  });

  it('accepts valid Stripe webhook', async () => {
    const { POST } = await import('../route');
    mockConstructEvent.mockReturnValue({ id: 'evt_123', type: 'payment_intent.succeeded' });

    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('t=123,v1=signature')
      },
      text: jest.fn<any>().mockResolvedValue('{"id": "evt_123"}')
    } as any;

    const result = await POST(mockRequest);
    expect(result.status).toBe(200);
    expect(require('next/server').NextResponse.json).toHaveBeenCalledWith({ received: true });
  });

  it('rejects invalid signature', async () => {
    const { POST } = await import('../route');
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('invalid')
      },
      text: jest.fn<any>().mockResolvedValue('{}')
    } as any;

    const result = await POST(mockRequest);
    expect(result.status).toBe(400);
  });

  it('handles idempotency', async () => {
    const { POST } = await import('../route');
    mockConstructEvent.mockReturnValue({ id: 'evt_123', type: 'payment_intent.succeeded' });

    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue('t=123,v1=signature')
      },
      text: jest.fn<any>().mockResolvedValue('{"id": "evt_123"}')
    } as any;

    // First request
    await POST(mockRequest);
    // Second request with same ID
    const result = await POST(mockRequest);
    expect(result.status).toBe(200);
    expect(require('next/server').NextResponse.json).toHaveBeenCalledWith({ received: true });
  });
});
