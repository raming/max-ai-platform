import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Logger } from './lib/logger/logger';
import { AuditWriter } from './lib/audit/audit-writer';

export function middleware(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || request.headers.get('x-request-id') || `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const auditWriter = new AuditWriter();
  const logger = new Logger(correlationId);
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  // Attach to request for use in handlers
  (request as any).auditWriter = auditWriter;
  const response = NextResponse.next();
  response.headers.set('x-correlation-id', correlationId);
  return response;
}