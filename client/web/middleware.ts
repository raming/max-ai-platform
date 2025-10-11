import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || request.headers.get('x-request-id') || `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // TODO: Re-enable logging and audit when Edge Runtime compatible versions are available
  // Logger and AuditWriter require Node.js modules not available in Edge Runtime
  
  const response = NextResponse.next();
  response.headers.set('x-correlation-id', correlationId);
  return response;
}