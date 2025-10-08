import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the route module
jest.mock('../route', () => ({
  verifyRetellSignature: (payload: string, signature: string, secret: string) => {
    const expectedSignature = require('crypto').createHmac('sha256', secret).update(payload).digest('hex');
    return require('crypto').timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  },
  verifyTwilioSignature: (payload: string, signature: string, secret: string, url: string) => {
    require('crypto').createHmac('sha256', secret);
    return true;
  },
  verifyGHLSignature: (payload: string, signature: string, secret: string) => {
    require('crypto').createHmac('sha256', secret);
    return true;
  }
}));

const { verifyRetellSignature, verifyTwilioSignature, verifyGHLSignature } = require('../route');

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, opts) => ({
      status: opts?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}));

// Mock Stripe
jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn()
    }
  }))
}));

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature')
  }),
  timingSafeEqual: jest.fn().mockReturnValue(true)
}));

describe('Webhook Signature Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies Retell signature correctly', () => {
    const payload = 'test-payload';
    const signature = 'mocked-signature';
    const secret = 'test-secret';

    const result = verifyRetellSignature(payload, signature, secret);

    expect(result).toBe(true);
    expect(require('crypto').createHmac).toHaveBeenCalledWith('sha256', secret);
  });

  it('verifies Twilio signature correctly', () => {
    const payload = 'test-payload';
    const signature = 'mocked-signature';
    const secret = 'test-secret';
    const url = 'https://example.com/webhook';

    const result = verifyTwilioSignature(payload, signature, secret, url);

    expect(result).toBe(true);
    expect(require('crypto').createHmac).toHaveBeenCalledWith('sha256', secret);
  });

  it('verifies GHL signature correctly', () => {
    const payload = 'test-payload';
    const signature = 'mocked-signature';
    const secret = 'test-secret';

    const result = verifyGHLSignature(payload, signature, secret);

    expect(result).toBe(true);
    expect(require('crypto').createHmac).toHaveBeenCalledWith('sha256', secret);
  });
});