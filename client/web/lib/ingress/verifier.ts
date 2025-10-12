// Ingress signature verifier implementation

import { IIngressVerifier, IngressProvider, IngressVerificationResult } from '../ports/ingress';
import crypto from 'crypto';

export class IngressVerifier implements IIngressVerifier {
  async verify(provider: IngressProvider, headers: Record<string, string>, rawBody: string): Promise<IngressVerificationResult> {
    switch (provider) {
      case IngressProvider.RETELL:
        return this.verifyRetell(headers, rawBody);
      case IngressProvider.TWILIO:
        return this.verifyTwilio(headers, rawBody);
      case IngressProvider.STRIPE:
        return this.verifyStripe(headers, rawBody);
      case IngressProvider.GHL:
        return this.verifyGHL(headers, rawBody);
      default:
        return { ok: false, reason: 'unsupported_provider' };
    }
  }

  private verifyRetell(headers: Record<string, string>, rawBody: string): IngressVerificationResult {
    const signature = headers['x-retell-signature'];
    if (!signature) {
      return { ok: false, reason: 'missing_signature' };
    }

    const secret = process.env.RETELL_WEBHOOK_SECRET;
    if (!secret) {
      return { ok: false, reason: 'webhook_secret_not_configured' };
    }

    try {
      // Retell uses HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

      // Compare signatures using constant-time comparison
      const signatureMatch = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      return signatureMatch
        ? { ok: true }
        : { ok: false, reason: 'signature_mismatch' };

    } catch (_error) {
      return { ok: false, reason: 'verification_error' };
    }
  }

  private verifyTwilio(_headers: Record<string, string>, _rawBody: string): IngressVerificationResult {
    const signature = _headers['x-twilio-signature'];
    if (!signature) {
      return { ok: false, reason: 'missing_signature' };
    }

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return { ok: false, reason: 'webhook_secret_not_configured' };
    }

    // TODO: Implement proper Twilio signature verification with URL validation
    // Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
    return { ok: false, reason: 'not_implemented' };
  }

  private getRequestUrl(headers: Record<string, string>): string | null {
    // Reconstruct URL from headers for Twilio verification
    const host = headers['host'] || headers['x-forwarded-host'];
    const proto = headers['x-forwarded-proto'] || 'https';
    const path = headers['x-original-uri'] || headers['request-uri'] || '/ingress/twilio';

    if (!host) return null;

    return `${proto}://${host}${path}`;
  }

  private verifyStripe(headers: Record<string, string>, rawBody: string): IngressVerificationResult {
    const signature = headers['stripe-signature'];
    if (!signature) {
      return { ok: false, reason: 'missing_signature' };
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return { ok: false, reason: 'webhook_secret_not_configured' };
    }

    try {
      // Parse the signature header: t=1492774577,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd,v0=...
      const elements = signature.split(',');
      const sigElements: Record<string, string> = {};

      for (const element of elements) {
        const [key, value] = element.split('=', 2);
        if (key && value) {
          sigElements[key] = value;
        }
      }

      const timestamp = sigElements.t;
      const v1Signature = sigElements.v1;

      if (!timestamp || !v1Signature) {
        return { ok: false, reason: 'invalid_signature_format' };
      }

      // Check timestamp skew (±5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const sigTimestamp = parseInt(timestamp, 10);
      const skew = Math.abs(now - sigTimestamp);

      if (skew > 300) { // 5 minutes
        return { ok: false, reason: 'timestamp_skew' };
      }

      // Construct the signed payload
      const signedPayload = `${timestamp}.${rawBody}`;

      // Compute expected signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      // Compare signatures using constant-time comparison
      try {
        const signatureMatch = crypto.timingSafeEqual(
          Buffer.from(v1Signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );

        return signatureMatch
          ? { ok: true }
          : { ok: false, reason: 'signature_mismatch' };
      } catch {
        // Buffer lengths don't match or invalid hex
        return { ok: false, reason: 'signature_mismatch' };
      }

    } catch (_error) {
      return { ok: false, reason: 'verification_error' };
    }
  }

  // GHL signature verification
  private verifyGHL(headers: Record<string, string>, rawBody: string): IngressVerificationResult {
    try {
      const signature = headers['x-ghl-signature'];
      if (!signature) {
        return { ok: false, reason: 'missing_signature' };
      }

      const secret = process.env.GHL_WEBHOOK_SECRET;
      if (!secret) {
        return { ok: false, reason: 'webhook_secret_not_configured' };
      }

      const payload = JSON.parse(rawBody);

      // Check if payload has a timestamp and validate it's recent
      if (payload.timestamp) {
        const timestamp = new Date(payload.timestamp).getTime();
        const now = Date.now();
        const skew = Math.abs(now - timestamp);

        // Allow 5 minute skew
        if (skew > 300000) {
          return { ok: false, reason: 'timestamp_skew' };
        }
      }

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const signatureMatch = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      return signatureMatch
        ? { ok: true }
        : { ok: false, reason: 'signature_mismatch' };

    } catch (_error) {
      return { ok: false, reason: 'invalid_payload' };
    }
  }
}