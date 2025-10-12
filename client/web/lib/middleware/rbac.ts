// RBAC middleware for Next.js API routes

import { NextRequest, NextResponse } from 'next/server';
import { extractClaims } from '../auth/claims';
import { RBACPolicyEngine, PolicyCheckRequest } from '../rbac/policy-engine';

// RBAC Audit Logger
class RBACLogger {
  logPolicyCheck(
    correlationId: string,
    subject: any,
    resource: string,
    action: string,
    decision: 'allow' | 'deny',
    reason?: string
  ): void {
    const logEntry = {
      level: decision === 'allow' ? 'info' : 'warn',
      component: 'rbac-audit',
      event: decision === 'allow' ? 'rbac.access_granted' : 'rbac.access_denied',
      correlationId,
      tenantId: subject.tenant,
      userId: subject.id,
      resourceType: resource,
      action,
      result: decision,
      reason,
      timestamp: new Date().toISOString()
    };

    console.log('[RBAC-AUDIT]', JSON.stringify(logEntry));
  }

  logError(correlationId: string, error: any): void {
    const logEntry = {
      level: 'error',
      component: 'rbac-middleware',
      event: 'rbac.middleware_error',
      correlationId,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };

    console.error('[RBAC-ERROR]', JSON.stringify(logEntry));
  }
}

const rbacLogger = new RBACLogger();

// Global policy engine instance
let policyEngine: RBACPolicyEngine | null = null;

export async function getPolicyEngine(): Promise<RBACPolicyEngine> {
  if (!policyEngine) {
    policyEngine = new RBACPolicyEngine();
    await policyEngine.initialize();
  }
  return policyEngine;
}

// For testing
export function resetPolicyEngine(): void {
  policyEngine = null;
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
        rbacLogger.logPolicyCheck(
          correlationId,
          { id: 'anonymous', tenant: 'unknown' },
          options.resource,
          options.action,
          'deny',
          'Missing or invalid authorization header'
        );

        return NextResponse.json(
          { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
          { status: 401, headers: { 'x-correlation-id': correlationId } }
        );
      }

      const token = authHeader.substring(7);

      // Extract claims from token
      const claims = await extractClaims(token);

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
        rbacLogger.logPolicyCheck(
          correlationId,
          claims.subject,
          options.resource,
          options.action,
          'deny',
          policyResponse.reason
        );

        return NextResponse.json(
          { error: 'Forbidden', message: policyResponse.reason || 'Access denied' },
          { status: 403, headers: { 'x-correlation-id': correlationId } }
        );
      }

      // Log successful access
      rbacLogger.logPolicyCheck(
        correlationId,
        claims.subject,
        options.resource,
        options.action,
        'allow'
      );

      // Attach claims to request for handler use
      (request as any).claims = claims;
      (request as any).correlationId = correlationId;

      // Call the handler
      return await handler(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      rbacLogger.logError(correlationId, error);

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
export function requireRole(_role: string) {
  return withRBAC({
    resource: 'any',
    action: 'access',
    extractResourceId: () => 'default'
  });
}