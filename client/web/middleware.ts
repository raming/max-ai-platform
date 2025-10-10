import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Logger } from '@/lib/logger/logger';

// Conditionally import AuditWriter only when not in Edge Runtime
const isEdgeRuntime = typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;
let AuditWriter: any = null;

if (!isEdgeRuntime) {
  try {
    const auditModule = require('@/lib/audit/audit-writer');
    AuditWriter = auditModule.AuditWriter;
  } catch (error) {
    console.warn('AuditWriter not available in Edge Runtime');
  }
}

export function middleware(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || request.headers.get('x-request-id') || `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Only create AuditWriter when available (not in Edge Runtime)
  const auditWriter = AuditWriter ? new AuditWriter() : null;
  
  const logger = new Logger(correlationId);
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  // Attach to request for use in handlers (only if available)
  if (auditWriter) {
    (request as any).auditWriter = auditWriter;
  }
  
  const response = NextResponse.next();
  response.headers.set('x-correlation-id', correlationId);
  return response;
}