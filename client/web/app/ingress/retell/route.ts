// Retell webhook ingress endpoint

import { NextRequest, NextResponse } from 'next/server';
import { IngressVerifier } from '../../../lib/ingress/verifier';
import { EventNormalizer } from '../../../lib/ingress/normalizer';
import { EventPublisher } from '../../../lib/ingress/publisher';
import { idempotencyStore } from '../../../lib/ingress/idempotency';
import { IngressProvider } from '../../../lib/ports/ingress';

const verifier = new IngressVerifier();
const normalizer = new EventNormalizer();
const publisher = new EventPublisher();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // Verify signature
    const verification = await verifier.verify(IngressProvider.RETELL, headers, rawBody);
    if (!verification.ok) {
      console.warn('[INGRESS-VERIFY-FAIL]', {
        provider: 'retell',
        reason: verification.reason,
        correlationId: headers['x-correlation-id'] || 'unknown'
      });

      return NextResponse.json(
        { error: 'Signature verification failed', reason: verification.reason },
        { status: 401 }
      );
    }

    // Check idempotency if key provided
    const idempotencyKey = headers['idempotency-key'];
    if (idempotencyKey) {
      const isValid = idempotencyStore.checkAndStore(idempotencyKey);
      if (!isValid) {
        return NextResponse.json(
          { status: 'duplicate' },
          { status: 200 }
        );
      }
    }

    // Parse and validate payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Normalize event
    const normalizedEvent = await normalizer.normalize(
      IngressProvider.RETELL,
      'webhook',
      payload,
      headers
    );

    // Publish event
    const routingKey = {
      tenantId: normalizedEvent.tenantId,
      clientId: normalizedEvent.clientId,
      eventType: normalizedEvent.eventType
    };

    await publisher.publish(normalizedEvent, routingKey);

    return NextResponse.json(
      { status: 'accepted', correlationId: normalizedEvent.correlationId },
      { status: 202 }
    );

  } catch (error) {
    console.error('[INGRESS-ERROR]', {
      provider: 'retell',
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: 'unknown'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}