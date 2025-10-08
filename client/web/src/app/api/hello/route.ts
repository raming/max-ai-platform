// Example protected API route using RBAC middleware

import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '../../../lib/middleware/rbac';

async function handler(request: NextRequest) {
  // Access claims from request (attached by middleware)
  const claims = (request as any).claims;
  const correlationId = (request as any).correlationId;

  return NextResponse.json({
    message: 'Hello from protected route',
    user: claims.subject.id,
    tenant: claims.subject.tenant
  }, {
    headers: { 'x-correlation-id': correlationId }
  });
}

// Wrap handler with RBAC middleware
export const GET = (request: NextRequest) => {
  return withRBAC({
    resource: 'hello',
    action: 'read'
  })(request, handler);
};
