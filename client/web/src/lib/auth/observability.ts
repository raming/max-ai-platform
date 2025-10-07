/**
 * Observability and audit logging for authentication
 * 
 * Provides structured logging, metrics, and audit events for authentication flow
 * as specified in the IAM foundation spec.
 */

import { SubjectContext, AuthErrorCode } from './types';

// Audit event types
export enum AuditEventType {
  TOKEN_VERIFIED = 'auth.token.verified',
  TOKEN_VERIFICATION_FAILED = 'auth.token.verification_failed',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'auth.unauthorized_access_attempt',
  PROTECTED_RESOURCE_ACCESSED = 'auth.protected_resource_accessed'
}

// Audit event structure
export interface AuditEvent {
  id: string;                    // Unique event ID
  type: AuditEventType;          // Event type
  timestamp: string;             // ISO 8601 timestamp
  tenantId?: string;             // Tenant ID (if available)
  clientId?: string;             // Client ID (if available) 
  userId?: string;               // User ID (if available)
  resourceType?: string;         // Type of resource accessed
  resourceId?: string;           // ID of resource accessed
  action?: string;               // Action attempted
  result: 'success' | 'failure'; // Outcome
  error?: {                      // Error details (if failure)
    code: string;
    message: string;
  };
  metadata?: Record<string, any>; // Additional context
  correlationId?: string;         // Request correlation ID
  ipAddress?: string;            // Client IP address
  userAgent?: string;            // Client user agent
}

// Metrics for authentication
export interface AuthMetrics {
  authenticationsTotal: number;
  authenticationsSuccess: number;
  authenticationsFailure: number;
  tokenVerificationDuration: number[];
  activeSubjects: Set<string>;
}

// Global metrics instance
let authMetrics: AuthMetrics = {
  authenticationsTotal: 0,
  authenticationsSuccess: 0,
  authenticationsFailure: 0,
  tokenVerificationDuration: [],
  activeSubjects: new Set()
};

/**
 * Logger for authentication events
 */
export class AuthLogger {
  private correlationId?: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  /**
   * Log successful token verification
   */
  logTokenVerified(subject: SubjectContext, metadata?: Record<string, any>): void {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      type: AuditEventType.TOKEN_VERIFIED,
      timestamp: new Date().toISOString(),
      tenantId: subject.tenantId,
      userId: subject.id,
      result: 'success',
      correlationId: this.correlationId,
      metadata: {
        isServiceAccount: subject.isServiceAccount,
        roles: subject.roles,
        scopes: subject.scopes,
        ...metadata
      }
    };

    this.emitAuditEvent(auditEvent);
    this.updateMetrics('success');
    authMetrics.activeSubjects.add(subject.id);
  }

  /**
   * Log failed token verification
   */
  logTokenVerificationFailed(
    error: AuthErrorCode, 
    message: string, 
    metadata?: Record<string, any>
  ): void {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      type: AuditEventType.TOKEN_VERIFICATION_FAILED,
      timestamp: new Date().toISOString(),
      result: 'failure',
      error: {
        code: error,
        message
      },
      correlationId: this.correlationId,
      metadata
    };

    this.emitAuditEvent(auditEvent);
    this.updateMetrics('failure');
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(
    resourceType?: string,
    resourceId?: string,
    action?: string,
    metadata?: Record<string, any>
  ): void {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      type: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
      timestamp: new Date().toISOString(),
      resourceType,
      resourceId,
      action,
      result: 'failure',
      correlationId: this.correlationId,
      metadata
    };

    this.emitAuditEvent(auditEvent);
  }

  /**
   * Log successful access to protected resource
   */
  logProtectedResourceAccess(
    subject: SubjectContext,
    resourceType: string,
    resourceId: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      type: AuditEventType.PROTECTED_RESOURCE_ACCESSED,
      timestamp: new Date().toISOString(),
      tenantId: subject.tenantId,
      userId: subject.id,
      resourceType,
      resourceId,
      action,
      result: 'success',
      correlationId: this.correlationId,
      metadata: {
        roles: subject.roles,
        scopes: subject.scopes,
        ...metadata
      }
    };

    this.emitAuditEvent(auditEvent);
  }

  /**
   * Emit structured log event
   */
  private emitAuditEvent(event: AuditEvent): void {
    // Structured logging format
    const logEntry = {
      level: event.result === 'success' ? 'info' : 'warn',
      component: 'auth-audit',
      event: event.type,
      correlationId: event.correlationId,
      ...event
    };

    console.log('[AUDIT]', JSON.stringify(logEntry));

    // In production, you might want to send this to:
    // - Application Insights / CloudWatch Logs
    // - Elasticsearch / Splunk
    // - External audit system
    // - SIEM solution
  }

  /**
   * Update authentication metrics
   */
  private updateMetrics(result: 'success' | 'failure'): void {
    authMetrics.authenticationsTotal++;
    
    if (result === 'success') {
      authMetrics.authenticationsSuccess++;
    } else {
      authMetrics.authenticationsFailure++;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create logger from request context
   */
  static fromRequest(req: any): AuthLogger {
    // Try to extract correlation ID from headers in a runtime-agnostic way.
    // Supports: NextRequest (Headers-like with .get()), Express/Node (object map), and plain objects.
    const headers = req?.headers;

    const getHeader = (name: string): string | undefined => {
      if (!headers) return undefined;

      // Headers-like (NextRequest / Fetch API)
      if (typeof headers.get === 'function') {
        return headers.get(name) || headers.get(name.toLowerCase()) || undefined;
      }

      // Node/Express style: header map (possibly lower-cased keys)
      if (typeof headers === 'object') {
        return (
          headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()]
        );
      }

      return undefined;
    };

    const correlationId = getHeader('x-correlation-id') || getHeader('x-request-id') || getHeader('x-trace-id');

    return new AuthLogger(correlationId);
  }

  /**
   * Expose correlation id for external use (read-only)
   */
  get correlationIdValue(): string | undefined {
    return this.correlationId;
  }
}

/**
 * Performance timer for measuring authentication duration
 */
export class AuthTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  /**
   * End timing and record duration
   */
  end(): number {
    const duration = Date.now() - this.startTime;
    authMetrics.tokenVerificationDuration.push(duration);

    // Keep only last 1000 measurements for memory efficiency
    if (authMetrics.tokenVerificationDuration.length > 1000) {
      authMetrics.tokenVerificationDuration = 
        authMetrics.tokenVerificationDuration.slice(-1000);
    }

    console.log(`[AUTH-PERF] ${this.operation} completed in ${duration}ms`);
    return duration;
  }
}

/**
 * Get current authentication metrics
 */
export function getAuthMetrics(): AuthMetrics {
  return { ...authMetrics };
}

/**
 * Reset authentication metrics (useful for testing)
 */
export function resetAuthMetrics(): void {
  authMetrics = {
    authenticationsTotal: 0,
    authenticationsSuccess: 0,
    authenticationsFailure: 0,
    tokenVerificationDuration: [],
    activeSubjects: new Set()
  };
}

/**
 * Calculate authentication metrics summary
 */
export function getAuthMetricsSummary() {
  const durations = authMetrics.tokenVerificationDuration;
  const successRate = authMetrics.authenticationsTotal > 0 
    ? (authMetrics.authenticationsSuccess / authMetrics.authenticationsTotal) * 100 
    : 0;

  let avgDuration = 0;
  let maxDuration = 0;
  let minDuration = 0;

  if (durations.length > 0) {
    avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    maxDuration = Math.max(...durations);
    minDuration = Math.min(...durations);
  }

  return {
    totalAuthentications: authMetrics.authenticationsTotal,
    successfulAuthentications: authMetrics.authenticationsSuccess,
    failedAuthentications: authMetrics.authenticationsFailure,
    successRate: Number(successRate.toFixed(2)),
    activeSubjects: authMetrics.activeSubjects.size,
    performance: {
      averageDuration: Number(avgDuration.toFixed(2)),
      maxDuration,
      minDuration,
      totalMeasurements: durations.length
    }
  };
}

/**
 * Health check for authentication system
 */
export function getAuthHealthCheck() {
  const metrics = getAuthMetricsSummary();
  
  return {
    status: 'healthy', // In real implementation, add health checks
    timestamp: new Date().toISOString(),
    metrics,
    checks: {
      recentFailureRate: metrics.totalAuthentications > 0 
        ? (metrics.successRate >= 95) // At least 95% success rate
        : true,
      averageResponseTime: metrics.performance.averageDuration < 1000, // Less than 1s
      activeConnections: metrics.activeSubjects < 10000 // Reasonable limit
    }
  };
}