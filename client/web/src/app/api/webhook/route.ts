import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const stripeEndpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const processedEvents = new Set<string>();

function verifyRetellSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

function verifyTwilioSignature(payload: string, signature: string, secret: string, url: string): boolean {
  // Twilio signature verification logic
  return true; // Placeholder
}

function verifyGHLSignature(payload: string, signature: string, secret: string): boolean {
  // GHL signature verification logic
  return true; // Placeholder
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || req.headers.get('x-signature') || req.headers.get('authorization');

  let event: any;
  let provider = 'unknown';

  try {
    // Detect provider and verify
    if (req.headers.get('stripe-signature')) {
      provider = 'stripe';
      event = stripe.webhooks.constructEvent(body, sig!, stripeEndpointSecret);
    } else if (req.headers.get('x-retell-signature')) {
      provider = 'retell';
      if (!verifyRetellSignature(body, sig!, process.env.RETELL_WEBHOOK_SECRET!)) {
        throw new Error('Invalid Retell signature');
      }
      event = JSON.parse(body);
    } else if (req.headers.get('x-twilio-signature')) {
      provider = 'twilio';
      if (!verifyTwilioSignature(body, sig!, process.env.TWILIO_AUTH_TOKEN!, req.url)) {
        throw new Error('Invalid Twilio signature');
      }
      event = JSON.parse(body);
    } else if (req.headers.get('x-ghl-signature')) {
      provider = 'ghl';
      if (!verifyGHLSignature(body, sig!, process.env.GHL_WEBHOOK_SECRET!)) {
        throw new Error('Invalid GHL signature');
      }
      event = JSON.parse(body);
    } else {
      throw new Error('Unknown provider');
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check
  const eventId = event.id || event.eventId || event.Id;
  if (processedEvents.has(eventId)) {
    return NextResponse.json({ received: true });
  }

  processedEvents.add(eventId);

  // Process the event based on provider
  console.log(`Processed ${provider} event: ${event.type || event.eventType}`);

  return NextResponse.json({ received: true });
}