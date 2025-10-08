import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';

describe('Webhook Signature Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts valid Stripe webhook', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({ id: 'evt_123', type: 'payment_intent.succeeded' });
    require('stripe').webhooks.constructEvent = mockConstructEvent;

    const req = {
      headers: {
        get: jest.fn().mockReturnValue('t=123,v1=signature')
      },
      text: jest.fn().mockResolvedValue('{"id": "evt_123"}')
    } as any;

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it('rejects invalid signature', async () => {
    const mockConstructEvent = jest.fn().mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    require('stripe').webhooks.constructEvent = mockConstructEvent;

    const req = {
      headers: {
        get: jest.fn().mockReturnValue('invalid')
      },
      text: jest.fn().mockResolvedValue('{}')
    } as any;

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('handles idempotency', async () => {
    const mockConstructEvent = jest.fn().mockReturnValue({ id: 'evt_123', type: 'payment_intent.succeeded' });
    require('stripe').webhooks.constructEvent = mockConstructEvent;

    const req = {
      headers: {
        get: jest.fn().mockReturnValue('t=123,v1=signature')
      },
      text: jest.fn().mockResolvedValue('{"id": "evt_123"}')
    } as any;

    // First request
    await POST(req);
    // Second request with same ID
    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });
});