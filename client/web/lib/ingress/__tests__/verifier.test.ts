/// <reference types="jest" />

// Mock crypto for signature verification
const mockTimingSafeEqual = jest.fn();
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(Buffer.from('mock-signature', 'utf8'))
  })),
  timingSafeEqual: mockTimingSafeEqual
}));

import { IngressVerifier } from '../verifier';
import { IngressProvider } from '../../ports/ingress';

describe('IngressVerifier', () => {
  let verifier: IngressVerifier;

  beforeEach(() => {
    verifier = new IngressVerifier();
    // Set up environment variables for all tests
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    process.env.RETELL_WEBHOOK_SECRET = 'retell_test_secret';
    process.env.TWILIO_AUTH_TOKEN = 'twilio_test_token';
    process.env.GHL_WEBHOOK_SECRET = 'test-ghl-secret';
    // Reset mocks
    mockTimingSafeEqual.mockReturnValue(true);
  });

  describe('Stripe verification', () => {
    it('should accept valid Stripe signature', async () => {
      // Mock environment variable
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const payload = '{"id": "evt_test", "type": "payment_intent.succeeded"}';
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;

      // Create valid signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', 'whsec_test_secret')
        .update(signedPayload, 'utf8')
        .digest('hex');

      const headers = {
        'stripe-signature': `t=${timestamp},v1=${expectedSignature}`
      };

      const result = await verifier.verify(IngressProvider.STRIPE, headers, payload);

      expect(result.ok).toBe(true);
    });

    it('should reject invalid Stripe signature', async () => {
      // Mock timingSafeEqual to return false for invalid signature
      mockTimingSafeEqual.mockReturnValueOnce(false);

      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const payload = '{"id": "evt_test", "type": "payment_intent.succeeded"}';
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const signature = 'invalid-signature';

      const headers = {
        'stripe-signature': `t=${timestamp},v1=${signature}`
      };

      const result = await verifier.verify(IngressProvider.STRIPE, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('signature_mismatch');
    });

    it('should reject Stripe signature with timestamp skew', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

      const payload = '{"id": "evt_test", "type": "payment_intent.succeeded"}';
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const headers = {
        'stripe-signature': `t=${oldTimestamp},v1=some_signature`
      };

      const result = await verifier.verify(IngressProvider.STRIPE, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('timestamp_skew');
    });

    it('should reject missing Stripe signature', async () => {
      const payload = '{"id": "evt_test"}';
      const headers = {};

      const result = await verifier.verify(IngressProvider.STRIPE, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_signature');
    });
  });

  describe('Retell verification', () => {
    it('should reject missing Retell signature', async () => {
      const payload = '{"event": "call_started"}';
      const headers = {};

      const result = await verifier.verify(IngressProvider.RETELL, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_signature');
    });

    it('should accept Retell webhook with valid signature', async () => {
      const payload = '{"event": "call_started"}';
      const headers = {
        'x-retell-signature': '6d6f636b2d7369676e6174757265' // hex of 'mock-signature'
      };

      const result = await verifier.verify(IngressProvider.RETELL, headers, payload);

      expect(result.ok).toBe(true);
    });
  });

  describe('Twilio verification', () => {
    it('should reject missing Twilio signature', async () => {
      const payload = 'From=%2B1234567890&To=%2B0987654321&Body=Hello';
      const headers = {};

      const result = await verifier.verify(IngressProvider.TWILIO, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_signature');
    });

    it('should reject Twilio verification (not implemented)', async () => {
      process.env.TWILIO_AUTH_TOKEN = 'twilio_token';

      const payload = 'From=%2B1234567890&To=%2B0987654321&Body=Hello';
      const headers = {
        'x-twilio-signature': 'some_signature',
        'host': 'example.com'
      };

      const result = await verifier.verify(IngressProvider.TWILIO, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('not_implemented');
    });
  });

  describe('GHL verification', () => {
    beforeEach(() => {
      process.env.GHL_WEBHOOK_SECRET = 'test-ghl-secret';
    });

    it('should accept GHL payload with valid signature and timestamp', async () => {
      const payload = JSON.stringify({
        event: 'contact_created',
        timestamp: new Date().toISOString()
      });
      const headers = {
        'x-ghl-signature': '6d6f636b2d7369676e6174757265' // hex of 'mock-signature'
      };

      const result = await verifier.verify(IngressProvider.GHL, headers, payload);

      expect(result.ok).toBe(true);
    });

    it('should reject GHL payload with invalid signature', async () => {
      mockTimingSafeEqual.mockReturnValueOnce(false);

      const payload = JSON.stringify({
        event: 'contact_created',
        timestamp: new Date().toISOString()
      });
      const headers = {
        'x-ghl-signature': 'invalid-signature'
      };

      const result = await verifier.verify(IngressProvider.GHL, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('signature_mismatch');
    });

    it('should reject GHL payload with old timestamp', async () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      const payload = JSON.stringify({
        event: 'contact_created',
        timestamp: oldTimestamp
      });
      const headers = {
        'x-ghl-signature': '6d6f636b2d7369676e6174757265' // hex of 'mock-signature'
      };

      const result = await verifier.verify(IngressProvider.GHL, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('timestamp_skew');
    });

    it('should reject GHL payload without signature', async () => {
      const payload = JSON.stringify({
        event: 'contact_created',
        timestamp: new Date().toISOString()
      });
      const headers = {};

      const result = await verifier.verify(IngressProvider.GHL, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_signature');
    });

    it('should reject invalid GHL JSON', async () => {
      const payload = 'invalid json';
      const headers = {
        'x-ghl-signature': '6d6f636b2d7369676e6174757265'
      };

      const result = await verifier.verify(IngressProvider.GHL, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid_payload');
    });
  });

  describe('Unsupported provider', () => {
    it('should reject unsupported provider', async () => {
      const payload = '{"test": "data"}';
      const headers = {};

      const result = await verifier.verify('unsupported' as any, headers, payload);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unsupported_provider');
    });
  });
});