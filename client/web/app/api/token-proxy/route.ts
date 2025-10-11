// API route for token proxy requests

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseProviderAdapter } from '../../../lib/adapters/supabase-provider';

// Feature flag
const TOKEN_PROXY_ENABLED = process.env.FEATURE_TOKEN_PROXY === 'true';

export async function POST(request: NextRequest) {
  if (!TOKEN_PROXY_ENABLED) {
    return NextResponse.json({ error: 'Token proxy not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

    const { tenantId, clientId, provider, method, path, headers, body: requestBody } = body;

    if (!tenantId || !clientId || !provider || !method || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseProvider = new SupabaseProviderAdapter();

    const response = await supabaseProvider.proxyRequest(
      tenantId,
      clientId,
      provider,
      { method, path, headers, body: requestBody },
      correlationId
    );

    return new NextResponse(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        ...response.headers
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Token proxy error', { error });

    return NextResponse.json(
      { error: 'Token proxy request failed', message: errorMessage },
      { status: 500 }
    );
  }
}