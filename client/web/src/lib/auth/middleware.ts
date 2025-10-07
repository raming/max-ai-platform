import type { NextRequest, NextResponse } from 'next/server';
import type { OIDCVerifier as OIDCVerifierType } from './oidc-verifier';
import { Request, Response, NextFunction } from 'express';
import { AuthConfig, AuthErrorCode, SubjectContext } from './types';
import { AuthLogger } from './observability';

/**
 * Authentication middleware for Next.js API routes
 */
export class AuthMiddleware {
  private logger: AuthLogger;
  
  constructor(private verifier: OIDCVerifierType, logger?: AuthLogger) {
    this.logger = logger || new AuthLogger();
  }

  /**
   * Next.js middleware function for API routes
   */
  async nextMiddleware(request: NextRequest): Promise<NextResponse | void> {
  const authHeader = request.headers.get('authorization');
  // Use dynamic import for OIDCVerifier to allow tests to mock module without loading ESM dependencies
  const { OIDCVerifier } = await import('./oidc-verifier');
  const token = OIDCVerifier.extractBearerToken(authHeader);

    if (!token) {
      return await this.createUnauthorizedResponse(AuthErrorCode.MISSING_TOKEN, 'Authorization header with Bearer token required');
    }

  const result = await this.verifier.verifyToken(token);

    if (!result.success) {
      return this.createUnauthorizedResponse(
        result.error!.code, 
        result.error!.message,
        result.error!.details
      );
    }

    // Add subject to headers for downstream processing
    // Only expose minimal identifiers in headers to avoid leaking PII and header size issues.
    // Try to use NextResponse.next() when running in Next runtime; otherwise provide a minimal fallback
    let response: any;
    try {
      const { NextResponse } = await import('next/server');
      response = NextResponse.next();
    } catch {
      response = { headers: { set: (_k: string, _v: string) => undefined } };
    }

    response.headers.set('x-subject-id', result.subject!.id);
    response.headers.set('x-tenant-id', result.subject!.tenantId);
    // Propagate correlation id if available via logger
    const corr = this.logger?.correlationIdValue;
    if (corr) response.headers.set('x-correlation-id', corr);

    return response;
  }

  /**
   * Express middleware function
   */
  expressMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
  const authHeader = req.headers.authorization;
  // Dynamically import OIDCVerifier so tests can mock it and avoid ESM jose import
  const { OIDCVerifier } = await import('./oidc-verifier');
  const token = (OIDCVerifier as any).extractBearerToken(authHeader);

        if (!token) {
          this.logger.logUnauthorizedAccess('api', req.path, req.method, {
            reason: 'missing_token',
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
          });
          return this.sendUnauthorizedResponse(res, AuthErrorCode.MISSING_TOKEN, 'Authorization header with Bearer token required');
        }

        const result = await this.verifier.verifyToken(token);

        if (!result.success) {
          this.logger.logUnauthorizedAccess('api', req.path, req.method, {
            reason: 'token_verification_failed',
            errorCode: result.error!.code,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
          });
          
          return this.sendUnauthorizedResponse(
            res,
            result.error!.code,
            result.error!.message,
            result.error!.details
          );
        }

        // Inject subject context into request
        req.subject = result.subject;

        // Add trace headers for observability
        res.setHeader('x-subject-id', result.subject!.id);
        res.setHeader('x-tenant-id', result.subject!.tenantId);
        
        next();
      } catch (error) {
        const e = error as any;
        this.logger.logTokenVerificationFailed(
          AuthErrorCode.UNKNOWN_ERROR,
          'Authentication middleware failed',
          {
            error: e?.message ?? String(e),
            stack: e?.stack,
            url: req.url,
            method: req.method
          }
        );
        
        return this.sendUnauthorizedResponse(
          res,
          AuthErrorCode.UNKNOWN_ERROR,
          'Authentication middleware failed',
          e
        );
      }
    };
  }

  /**
   * Higher-order function to protect Next.js API routes
   */
  static withAuth(handler: (req: NextRequest, context: { subject: SubjectContext }) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const config = AuthMiddleware.getConfigFromEnv();
      const logger = AuthLogger.fromRequest(req);
      // Dynamically import OIDCVerifier so tests can mock it without loading jose
      const { OIDCVerifier } = await import('./oidc-verifier');
      const verifier = new OIDCVerifier(config, logger);
      const middleware = new AuthMiddleware(verifier, logger);

      const authHeader = req.headers.get('authorization');
      const token = (OIDCVerifier as any).extractBearerToken(authHeader);

      if (!token) {
        logger.logUnauthorizedAccess('api', req.nextUrl.pathname, req.method, {
          reason: 'missing_token',
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        });
        
        return await middleware.createUnauthorizedResponse(
          AuthErrorCode.MISSING_TOKEN, 
          'Authorization header with Bearer token required'
        );
      }

      const result = await verifier.verifyToken(token);

      if (!result.success) {
        logger.logUnauthorizedAccess('api', req.nextUrl.pathname, req.method, {
          reason: 'token_verification_failed',
          errorCode: result.error!.code,
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        });
        
        return await middleware.createUnauthorizedResponse(
          result.error!.code,
          result.error!.message,
          result.error!.details
        );
      }

      // Log successful access to protected resource
      logger.logProtectedResourceAccess(
        result.subject!,
        'api',
        req.nextUrl.pathname,
        req.method
      );

      // Call the protected handler with subject context
      return handler(req, { subject: result.subject! });
    };
  }

  /**
   * Create unauthorized response for Next.js
   */
  private async createUnauthorizedResponse(code: AuthErrorCode, message: string, details?: any): Promise<any> {
    const errorResponse = {
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      },
      // Don't expose internal details in production
      ...(process.env.NODE_ENV !== 'production' && details && { details })
    };

    // Try to use NextResponse if available (runtime); fall back to plain object for tests
    try {
      const { NextResponse } = await import('next/server');
      return NextResponse.json(errorResponse, { status: 401 });
    } catch {
      return { status: 401, payload: errorResponse };
    }
  }

  /**
   * Send unauthorized response for Express
   */
  private sendUnauthorizedResponse(res: Response, code: AuthErrorCode, message: string, details?: any) {
    const errorResponse = {
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      },
      // Don't expose internal details in production
      ...(process.env.NODE_ENV !== 'production' && details && { details })
    };

    return res.status(401).json(errorResponse);
  }

  /**
   * Get auth configuration from environment variables
   */
  private static getConfigFromEnv(): AuthConfig {
    const keycloakBaseUrl = process.env.KEYCLOAK_BASE_URL;
    const audience = process.env.KEYCLOAK_AUDIENCE || 'max-ai-platform';

    if (!keycloakBaseUrl) {
      throw new Error('KEYCLOAK_BASE_URL environment variable is required');
    }

    return {
      keycloakBaseUrl,
      realm: process.env.KEYCLOAK_REALM,
      audience,
      clockTolerance: parseInt(process.env.KEYCLOAK_CLOCK_TOLERANCE || '60'),
      cacheTtl: parseInt(process.env.KEYCLOAK_CACHE_TTL || '3600'),
      enableLogging: process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production',
      requiredClaims: process.env.KEYCLOAK_REQUIRED_CLAIMS?.split(',').map(c => c.trim()) || []
    };
  }

  /**
   * Create middleware instance from environment configuration
   */
  static fromEnv(): AuthMiddleware {
    const config = AuthMiddleware.getConfigFromEnv();
    const logger = new AuthLogger();
    // Dynamically import OIDCVerifier to avoid pulling ESM-only dependencies at module load time
    // when running in non-Next/test runtimes.
    // Note: this returns a Promise; keep API synchronous by constructing a simple default here and
    // allowing callers to use fromEnv() only in runtime contexts where dynamic import can be awaited.
    // For now, provide a basic thrower to indicate that consumers should use fromEnvAsync when needed.
    throw new Error('Use fromEnvAsync() to create middleware with runtime imports in non-Next environments');
  }

  /**
   * Async variant that dynamically imports OIDCVerifier and returns an AuthMiddleware instance.
   */
  static async fromEnvAsync(): Promise<AuthMiddleware> {
    const config = AuthMiddleware.getConfigFromEnv();
    const logger = new AuthLogger();
    const { OIDCVerifier } = await import('./oidc-verifier');
    const verifier = new OIDCVerifier(config, logger);
    return new AuthMiddleware(verifier, logger);
  }
}

/**
 * Utility function to extract subject from request
 */
export function getSubject(req: Request): SubjectContext | null {
  return req.subject || null;
}

/**
 * Utility function to require subject (throws if not present)
 */
export function requireSubject(req: Request): SubjectContext {
  const subject = getSubject(req);
  if (!subject) {
    throw new Error('Request is not authenticated - missing subject context');
  }
  return subject;
}

/**
 * Check if subject has specific role
 */
export function hasRole(subject: SubjectContext, role: string): boolean {
  return subject.roles.includes(role);
}

/**
 * Check if subject has any of the specified roles
 */
export function hasAnyRole(subject: SubjectContext, roles: string[]): boolean {
  return roles.some(role => subject.roles.includes(role));
}

/**
 * Check if subject has specific scope
 */
export function hasScope(subject: SubjectContext, scope: string): boolean {
  return subject.scopes.includes(scope);
}

/**
 * Check if subject belongs to specific tenant
 */
export function isTenant(subject: SubjectContext, tenantId: string): boolean {
  return subject.tenantId === tenantId;
}

/**
 * Authorization helper - check if subject can perform action on resource
 */
export function canAccess(
  subject: SubjectContext, 
  requiredRoles?: string[], 
  requiredScopes?: string[],
  requiredTenant?: string
): boolean {
  // Check tenant if specified
  if (requiredTenant && !isTenant(subject, requiredTenant)) {
    return false;
  }

  // Check roles if specified
  if (requiredRoles && !hasAnyRole(subject, requiredRoles)) {
    return false;
  }

  // Check scopes if specified
  if (requiredScopes && !requiredScopes.every(scope => hasScope(subject, scope))) {
    return false;
  }

  return true;
}

// Export main middleware instance
export default AuthMiddleware;