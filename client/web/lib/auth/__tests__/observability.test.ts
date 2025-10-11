import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  AuthLogger,
  AuditEventType,
} from '../observability';
import { SubjectContext, AuthErrorCode } from '../types';

// Mock audit writer
const mockAuditWrite = jest.fn();

jest.mock('../../audit/audit-writer', () => ({
  AuditWriter: jest.fn().mockImplementation(() => ({
    write: mockAuditWrite
  }))
}));

describe('AuthLogger', () => {
  let auditWriter: { write: jest.Mock };

  beforeEach(() => {
    mockAuditWrite.mockClear();
    auditWriter = { write: mockAuditWrite };
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
      const logger = new AuthLogger('corr', auditWriter);
      logger.logTokenVerified(mockSubject, { tokenType: 'access_token' });

      expect(mockAuditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.TOKEN_VERIFIED,
          userId: 'user-123',
          result: 'success'
        })
      );
    });

    it('should log failed token verification', () => {
      const logger = new AuthLogger('corr', auditWriter);
      logger.logTokenVerificationFailed(AuthErrorCode.TOKEN_EXPIRED, 'Token expired', { tokenType: 'access_token' });

      expect(mockAuditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.TOKEN_VERIFICATION_FAILED,
          result: 'failure'
        })
      );
    });
  });

  describe('unauthorized access logging', () => {
    it('should log unauthorized access attempt', () => {
      const logger = new AuthLogger('corr', auditWriter);
      logger.logUnauthorizedAccess('api', '/protected', 'GET', { ip: '192.168.1.1' });

      expect(mockAuditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
          resourceType: 'api',
          resourceId: '/protected',
          action: 'GET',
          result: 'failure'
        })
      );
    });
  });

  describe('protected resource access logging', () => {
    it('should log successful protected resource access', () => {
      const logger = new AuthLogger('corr', auditWriter);
      const mockSubject: SubjectContext = {
        id: 'user-123',
        tenantId: 'tenant-456',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['user'],
        groups: [],
        scopes: ['read'],
        isServiceAccount: false
      };
      logger.logProtectedResourceAccess(mockSubject, 'api', '/protected', 'GET', { ip: '192.168.1.1' });

      expect(mockAuditWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.PROTECTED_RESOURCE_ACCESSED,
          userId: 'user-123',
          resourceType: 'api',
          resourceId: '/protected',
          action: 'GET',
          result: 'success'
        })
      );
    });
  });

  describe('fromRequest', () => {
    it('should extract correlation ID from x-correlation-id header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => key === 'x-correlation-id' ? 'test-corr' : null)
        }
      } as any;

      const logger = AuthLogger.fromRequest(mockRequest, auditWriter);
      expect(logger.getCorrelationId()).toBe('test-corr');
    });

    it('should generate correlation ID if not provided', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as any;

      const logger = AuthLogger.fromRequest(mockRequest, auditWriter);
      expect(logger.getCorrelationId()).toMatch(/^corr-\d+-[a-z0-9]+$/);
    });
  });
});