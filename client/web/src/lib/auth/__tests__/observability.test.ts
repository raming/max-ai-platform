/**
 * Tests for authentication observability and audit logging
 */

import {
  AuthLogger,
  AuthTimer,
  AuditEventType,
  getAuthMetrics,
  resetAuthMetrics,
  getAuthMetricsSummary,
  getAuthHealthCheck
} from '../observability';
import { SubjectContext, AuthErrorCode } from '../types';

// Mock console.log to capture log output
const mockConsoleLog = jest.fn();
console.log = mockConsoleLog;

describe('AuthLogger', () => {
  let logger: AuthLogger;
  
  beforeEach(() => {
    mockConsoleLog.mockClear();
    resetAuthMetrics();
    logger = new AuthLogger();
  });

  describe('token verification logging', () => {
    const mockSubject: SubjectContext = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['user', 'admin'],
      groups: ['group1'],
      scopes: ['read', 'write'],
      isServiceAccount: false,
      metadata: {
        iss: 'https://auth.example.com',
        aud: 'my-app',
        iat: 1234567890,
        exp: 1234571490,
        jti: 'token-123'
      }
    };

    it('should log successful token verification', () => {
      logger.logTokenVerified(mockSubject, { tokenType: 'access_token' });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('"type":"auth.token.verified"')
      );

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toMatchObject({
        type: AuditEventType.TOKEN_VERIFIED,
        tenantId: 'tenant-456',
        userId: 'user-123',
        result: 'success',
        metadata: {
          isServiceAccount: false,
          roles: ['user', 'admin'],
          scopes: ['read', 'write'],
          tokenType: 'access_token'
        }
      });

      expect(logEntry.id).toMatch(/^auth-\d+-[a-z0-9]+$/);
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should log failed token verification', () => {
      const errorCode = AuthErrorCode.TOKEN_EXPIRED;
      const message = 'Token has expired';
      const metadata = { 
        issuer: 'https://auth.example.com',
        errorDetails: { originalError: 'JWT expired' }
      };

      logger.logTokenVerificationFailed(errorCode, message, metadata);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('"type":"auth.token.verification_failed"')
      );

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toMatchObject({
        type: AuditEventType.TOKEN_VERIFICATION_FAILED,
        result: 'failure',
        error: {
          code: errorCode,
          message
        },
        metadata
      });
    });
  });

  describe('unauthorized access logging', () => {
    it('should log unauthorized access attempt', () => {
      logger.logUnauthorizedAccess('api', '/protected/resource', 'GET', {
        reason: 'missing_token',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1'
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('"type":"auth.unauthorized_access_attempt"')
      );

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toMatchObject({
        type: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        resourceType: 'api',
        resourceId: '/protected/resource',
        action: 'GET',
        result: 'failure',
        metadata: {
          reason: 'missing_token',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1'
        }
      });
    });

    it('should log successful protected resource access', () => {
      const mockSubject: SubjectContext = {
        id: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['user'],
        groups: [],
        scopes: ['read'],
        isServiceAccount: false,
        metadata: {}
      };

      logger.logProtectedResourceAccess(
        mockSubject,
        'api',
        '/protected/resource',
        'GET',
        { method: 'GET' }
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('"type":"auth.protected_resource_accessed"')
      );

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toMatchObject({
        type: AuditEventType.PROTECTED_RESOURCE_ACCESSED,
        tenantId: 'tenant-456',
        userId: 'user-123',
        resourceType: 'api',
        resourceId: '/protected/resource',
        action: 'GET',
        result: 'success',
        metadata: {
          roles: ['user'],
          scopes: ['read'],
          method: 'GET'
        }
      });
    });
  });

  describe('fromRequest', () => {
    it('should extract correlation ID from x-correlation-id header', () => {
      const mockRequest = {
        headers: {
          'x-correlation-id': 'test-correlation-123'
        }
      };

      const logger = AuthLogger.fromRequest(mockRequest);
      
      // Access private correlationId through token verification (which includes it in logs)
      const mockSubject: SubjectContext = {
        id: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        roles: [],
        groups: [],
        scopes: [],
        isServiceAccount: false,
        metadata: {}
      };

      logger.logTokenVerified(mockSubject);

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.correlationId).toBe('test-correlation-123');
    });

    it('should generate correlation ID if none provided', () => {
      const mockRequest = { headers: {} };
      const logger = AuthLogger.fromRequest(mockRequest);
      
      const mockSubject: SubjectContext = {
        id: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        roles: [],
        groups: [],
        scopes: [],
        isServiceAccount: false,
        metadata: {}
      };

      logger.logTokenVerified(mockSubject);

      const logCall = mockConsoleLog.mock.calls[0][1];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.correlationId).toMatch(/^req-\d+-[a-z0-9]+$/);
    });
  });
});

describe('AuthTimer', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    resetAuthMetrics();
  });

  it('should measure and log operation duration', async () => {
    const timer = new AuthTimer('test-operation');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const duration = timer.end();
    
    expect(duration).toBeGreaterThanOrEqual(10);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      `[AUTH-PERF] test-operation completed in ${duration}ms`
    );
  });

  it('should record duration in metrics', () => {
    const timer = new AuthTimer('test-operation');
    timer.end();
    
    const metrics = getAuthMetrics();
    expect(metrics.tokenVerificationDuration).toHaveLength(1);
    expect(metrics.tokenVerificationDuration[0]).toBeGreaterThanOrEqual(0);
  });

  it('should limit stored durations to 1000 measurements', () => {
    // Add 1001 measurements
    for (let i = 0; i < 1001; i++) {
      const timer = new AuthTimer(`test-operation-${i}`);
      timer.end();
    }
    
    const metrics = getAuthMetrics();
    expect(metrics.tokenVerificationDuration).toHaveLength(1000);
  });
});

describe('Metrics', () => {
  beforeEach(() => {
    resetAuthMetrics();
  });

  it('should track authentication metrics', () => {
    const logger = new AuthLogger();
    
    const mockSubject: SubjectContext = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      roles: [],
      groups: [],
      scopes: [],
      isServiceAccount: false,
      metadata: {}
    };

    // Log successful authentications
    logger.logTokenVerified(mockSubject);
    logger.logTokenVerified({ ...mockSubject, id: 'user-456' });

    // Log failed authentication
    logger.logTokenVerificationFailed(
      AuthErrorCode.TOKEN_EXPIRED,
      'Token expired'
    );

    const metrics = getAuthMetrics();
    
    expect(metrics.authenticationsTotal).toBe(3);
    expect(metrics.authenticationsSuccess).toBe(2);
    expect(metrics.authenticationsFailure).toBe(1);
    expect(metrics.activeSubjects.size).toBe(2);
    expect(metrics.activeSubjects.has('user-123')).toBe(true);
    expect(metrics.activeSubjects.has('user-456')).toBe(true);
  });

  it('should calculate metrics summary correctly', () => {
    const logger = new AuthLogger();
    
    // Add some performance measurements
    const timer1 = new AuthTimer('op1');
    timer1.end();
    const timer2 = new AuthTimer('op2');
    timer2.end();

    const mockSubject: SubjectContext = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      roles: [],
      groups: [],
      scopes: [],
      isServiceAccount: false,
      metadata: {}
    };

    // Log 2 successes, 1 failure
    logger.logTokenVerified(mockSubject);
    logger.logTokenVerified(mockSubject);
    logger.logTokenVerificationFailed(AuthErrorCode.TOKEN_EXPIRED, 'Expired');

    const summary = getAuthMetricsSummary();
    
    expect(summary.totalAuthentications).toBe(3);
    expect(summary.successfulAuthentications).toBe(2);
    expect(summary.failedAuthentications).toBe(1);
    expect(summary.successRate).toBe(66.67);
    expect(summary.activeSubjects).toBe(1);
    expect(summary.performance.totalMeasurements).toBe(2);
    expect(summary.performance.averageDuration).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty metrics correctly', () => {
    const summary = getAuthMetricsSummary();
    
    expect(summary.totalAuthentications).toBe(0);
    expect(summary.successfulAuthentications).toBe(0);
    expect(summary.failedAuthentications).toBe(0);
    expect(summary.successRate).toBe(0);
    expect(summary.activeSubjects).toBe(0);
    expect(summary.performance.averageDuration).toBe(0);
    expect(summary.performance.maxDuration).toBe(0);
    expect(summary.performance.minDuration).toBe(0);
  });
});

describe('Health Check', () => {
  beforeEach(() => {
    resetAuthMetrics();
  });

  it('should return healthy status for good metrics', () => {
    const logger = new AuthLogger();
    
    const mockSubject: SubjectContext = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'test@example.com',
      roles: [],
      groups: [],
      scopes: [],
      isServiceAccount: false,
      metadata: {}
    };

    // Log mostly successful authentications (low failure rate)
    for (let i = 0; i < 19; i++) {
      logger.logTokenVerified(mockSubject);
    }
    logger.logTokenVerificationFailed(AuthErrorCode.TOKEN_EXPIRED, 'Expired');

    // Add fast response times
    const timer = new AuthTimer('fast-op');
    timer.end();

    const health = getAuthHealthCheck();
    
    expect(health.status).toBe('healthy');
    expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(health.checks.recentFailureRate).toBe(true); // 5% failure rate
    expect(health.checks.averageResponseTime).toBe(true); // < 1000ms
    expect(health.checks.activeConnections).toBe(true); // < 10000
  });

  it('should include metrics in health check', () => {
    const health = getAuthHealthCheck();
    
    expect(health).toHaveProperty('metrics');
    expect(health.metrics).toHaveProperty('totalAuthentications');
    expect(health.metrics).toHaveProperty('successRate');
    expect(health.metrics).toHaveProperty('performance');
  });
});