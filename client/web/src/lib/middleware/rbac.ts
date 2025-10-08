// RBAC middleware for Next.js API routes

import { NextRequest, NextResponse } from 'next/server';
import { extractClaims } from '../auth/claims';
import { RBACPolicyEngine, PolicyCheckRequest } from '../rbac/policy-engine';

// Global policy engine instance
let policyEngine: RBACPolicyEngine | null = null;

async function getPolicyEngine(): Promise<RBACPolicyEngine> {
  if (!policyEngine) {
    policyEngine = new RBACPolicyEngine();
    await policyEngine.initialize();
  }
  return policyEngine;
}

export interface RBACOptions {
  resource: string;
  action: string;
  extractResourceId?: (request: NextRequest) => string;
}

/**
 * RBAC middleware factory for Next.js API routes
 * Enforces role-based access control with deny-by-default
 */
export function withRBAC(options: RBACOptions) {
  return async function rbacMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('AUDIT: Missing or invalid authorization header', {
          correlationId,
          outcome: 'unauthorized'
        });

        return NextResponse.json(
          { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
          { status: 401, headers: { 'x-correlation-id': correlationId } }
        );
      }

      const token = authHeader.substring(7);

      // Extract claims from token
      const claims = extractClaims(token);

      // Build policy check request
      const resourceId = options.extractResourceId ? options.extractResourceId(request) : 'default';
      const policyRequest: PolicyCheckRequest = {
        subject: claims.subject,
        resource: {
          type: options.resource,
          id: resourceId,
          ownerTenant: claims.subject.tenant
        },
        action: options.action
      };

      // Check policy
      const engine = await getPolicyEngine();
      const policyResponse = await engine.check(policyRequest, correlationId);

      if (policyResponse.decision === 'deny') {
        console.log('AUDIT: Access denied', {
          correlationId,
          subject: claims.subject.id,
          tenant: claims.subject.tenant,
          resource: options.resource,
          action: options.action,
          reason: policyResponse.reason,
          outcome: 'forbidden'
        });

        return NextResponse.json(
          { error: 'Forbidden', message: policyResponse.reason || 'Access denied' },
          { status: 403, headers: { 'x-correlation-id': correlationId } }
        );
      }

      // Attach claims to request for handler use
      (request as any).claims = claims;
      (request as any).correlationId = correlationId;

      // Call the handler
      return await handler(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('RBAC middleware error', { error, correlationId });

      return NextResponse.json(
        { error: 'Internal Server Error', message: errorMessage },
        { status: 500, headers: { 'x-correlation-id': correlationId } }
      );
    }
  };
}

/**
 * Helper to check if a request has a specific role
 */
export function requireRole(role: string) {
  return withRBAC({
    resource: 'any',
    action: 'access',
    extractResourceId: () => 'default'
  });
}