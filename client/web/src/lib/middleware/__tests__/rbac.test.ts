/// <reference types="jest" />

// Mock next/server to avoid importing Next.js runtime in tests
jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn(() => ({ headers: { set: jest.fn() } })),
      json: jest.fn((payload, opts) => ({
        status: opts ? opts.status : 200,
        payload,
        headers: opts ? opts.headers : {}
      }))
    }
  };
});

// Mock extractClaims to control claim extraction
jest.mock('../../auth/claims', () => ({
  extractClaims: jest.fn()
}));

// Mock RBACPolicyEngine
jest.mock('../../rbac/policy-engine', () => ({
  RBACPolicyEngine: jest.fn()
}));

import { withRBAC, resetPolicyEngine } from '../rbac';
import { extractClaims } from '../../auth/claims';
import { RBACPolicyEngine } from '../../rbac/policy-engine';

describe('RBAC Middleware', () => {
  let mockPolicyEngine;
  let mockExtractClaims;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPolicyEngine(); // Reset the global policy engine instance
    mockPolicyEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      check: jest.fn()
    };
    RBACPolicyEngine.mockImplementation(() => mockPolicyEngine);
    mockExtractClaims = extractClaims;
  });

  describe('withRBAC', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const result = await middleware(mockRequest, jest.fn());

      expect(result.status).toBe(401);
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'authorization' ? 'Basic token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const result = await middleware(mockRequest, jest.fn());

      expect(result.status).toBe(401);
    });

    it('returns 403 when policy check denies access', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      mockExtractClaims.mockResolvedValue({ subject: { id: 'user1', tenant: 'tenant1', roles: ['user'] } });
      mockPolicyEngine.check.mockReturnValue(Promise.resolve({ decision: 'deny', reason: 'Policy denied' }));

      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'authorization' ? 'Bearer token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const result = await middleware(mockRequest, jest.fn());

      expect(result.status).toBe(403);
    });

    it('calls handler when policy check allows access', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, payload: undefined, headers: {} });
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      mockExtractClaims.mockResolvedValue({ subject: { id: 'alice@example.com', tenant: 'tenant1', roles: ['admin'] } });
      mockPolicyEngine.check.mockReturnValue(Promise.resolve({ decision: 'allow' }));

      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'authorization' ? 'Bearer valid-token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const result = await middleware(mockRequest, handler);

      expect(mockExtractClaims).toHaveBeenCalledWith('valid-token');
      expect(mockPolicyEngine.check).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(result.status).toBe(200);
    });

    it('uses custom extractResourceId function', async () => {
      const extractResourceId = jest.fn().mockReturnValue('custom-id');
      const middleware = withRBAC({ resource: 'test', action: 'read', extractResourceId });
      mockExtractClaims.mockResolvedValue({ subject: { id: 'alice@example.com', tenant: 'tenant1', roles: ['admin'] } });
      mockPolicyEngine.check.mockReturnValue(Promise.resolve({ decision: 'allow' }));

      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'authorization' ? 'Bearer valid-token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      await middleware(mockRequest, jest.fn());

      expect(extractResourceId).toHaveBeenCalledWith(mockRequest);
      expect(mockPolicyEngine.check).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: { id: 'alice@example.com', tenant: 'tenant1', roles: ['admin'] },
          resource: { type: 'test', id: 'custom-id', ownerTenant: 'tenant1' },
          action: 'read'
        }),
        'test-id'
      );
    });

    it('returns 500 when extractClaims throws error', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      mockExtractClaims.mockRejectedValue(new Error('Invalid token'));

      const mockRequest = {
        headers: {
          get: jest.fn((key) => key === 'authorization' ? 'Bearer invalid-token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const result = await middleware(mockRequest, jest.fn());

      expect(result.status).toBe(500);
    });
  });
});
