import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const stripeEndpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: any;
  let provider = 'unknown';

  try {
    // Only handle Stripe webhooks for now
    if (req.headers.get('stripe-signature')) {
      if (!stripe || !stripeEndpointSecret) {
        return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
      }
      provider = 'stripe';
      event = stripe.webhooks.constructEvent(body, sig!, stripeEndpointSecret);
    } else {
      // For other providers, suggest using ingress endpoints
      return NextResponse.json({ 
        error: 'Use ingress endpoints for non-Stripe webhooks',
        ingress: {
          retell: '/ingress/retell',
          twilio: '/ingress/twilio', 
          stripe: '/ingress/payments',
          ghl: '/ingress/ghl'
        }
      }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check
  const eventId = event.id;
  if (processedEvents.has(eventId)) {
    return NextResponse.json({ received: true });
  }

  processedEvents.add(eventId);

  // Process the event based on provider
  console.log(`Processed ${provider} event: ${event.type}`);

  return NextResponse.json({ received: true });
}