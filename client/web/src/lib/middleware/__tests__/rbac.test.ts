/// <reference types="jest" />

// Mock next/server to avoid importing Next.js runtime in tests
jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn(() => ({ headers: { set: jest.fn() } })),
      json: jest.fn((payload: any, opts?: any) => ({
        status: opts?.status ?? 200,
        payload,
        headers: opts?.headers ?? {}
      }))
    }
  };
});

// Mock extractClaims to control claim extraction
jest.mock('../../auth/claims', () => ({
  extractClaims: jest.fn()
}));

// Mock RBACPolicyEngine to control policy decisions
jest.mock('../../rbac/policy-engine', () => ({
  RBACPolicyEngine: jest.fn()
}));

// Mock the rbac module
jest.mock('../rbac', () => ({
  withRBAC: jest.requireActual('../rbac').withRBAC,
  requireRole: jest.requireActual('../rbac').requireRole,
  getPolicyEngine: jest.fn()
}));

const { NextResponse } = require('next/server');
const { extractClaims } = require('../../auth/claims');
const { RBACPolicyEngine } = require('../../rbac/policy-engine');
const { withRBAC, getPolicyEngine } = require('../rbac');

describe('RBAC Middleware', () => {
  let mockPolicyEngine: any;
  let mockExtractClaims: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPolicyEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      check: jest.fn()
    };

    (RBACPolicyEngine as any).mockImplementation(() => mockPolicyEngine);
    mockExtractClaims = extractClaims as jest.MockedFunction<typeof extractClaims>;
  });

  describe('withRBAC', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const handler = jest.fn();

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const response = await middleware(mockRequest as any, handler);

      expect(response.status).toBe(401);
      expect(response.payload.error).toBe('Unauthorized');
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const handler = jest.fn();

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) => key === 'authorization' ? 'Basic token' : key === 'x-correlation-id' ? 'test-id' : null)
        }
      };

      const response = await middleware(mockRequest as any, handler);

      expect(response.status).toBe(401);
      expect(response.payload.error).toBe('Unauthorized');
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 when policy check denies access', async () => {
      mockExtractClaims.mockReturnValue({
        subject: { id: 'user1', tenant: 'tenant1' }
      });

      mockPolicyEngine.check.mockResolvedValue({
        decision: 'deny',
        reason: 'Policy denied'
      });

      const middleware = withRBAC({ resource: 'test', action: 'write' });
      const handler = jest.fn();

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === 'authorization' ? 'Bearer valid-token' :
            key === 'x-correlation-id' ? 'test-id' : null
          )
        }
      };

      const response = await middleware(mockRequest as any, handler);

      expect(mockExtractClaims).toHaveBeenCalledWith('valid-token');
      expect(mockPolicyEngine.check).toHaveBeenCalledWith({
        subject: { id: 'user1', tenant: 'tenant1' },
        resource: { type: 'test', id: 'default', ownerTenant: 'tenant1' },
        action: 'write'
      }, 'test-id');

      expect(response.status).toBe(403);
      expect(response.payload.error).toBe('Forbidden');
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler when policy check allows access', async () => {
      mockExtractClaims.mockReturnValue({
        subject: { id: 'alice@example.com', tenant: 'tenant1', roles: ['admin'] }
      });

      mockPolicyEngine.check.mockResolvedValue({
        decision: 'allow',
        reason: 'Policy matched'
      });

      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const mockResponse = { status: 200, data: 'success' };
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === 'authorization' ? 'Bearer valid-token' :
            key === 'x-correlation-id' ? 'test-id' : null
          )
        }
      };

      const response = await middleware(mockRequest as any, handler);

      expect(mockExtractClaims).toHaveBeenCalledWith('valid-token');
      expect(mockPolicyEngine.check).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect((mockRequest as any).claims).toEqual({
        subject: { id: 'alice@example.com', tenant: 'tenant1', roles: ['admin'] }
      });
      expect((mockRequest as any).correlationId).toBe('test-id');
      expect(response).toBe(mockResponse);
    });

    it('uses custom extractResourceId function', async () => {
      mockExtractClaims.mockReturnValue({
        subject: { id: 'user1', tenant: 'tenant1' }
      });

      mockPolicyEngine.check.mockResolvedValue({
        decision: 'allow'
      });

      const extractResourceId = jest.fn().mockReturnValue('custom-id');
      const middleware = withRBAC({
        resource: 'test',
        action: 'read',
        extractResourceId
      });
      const handler = jest.fn().mockResolvedValue({ status: 200 });

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === 'authorization' ? 'Bearer token' :
            key === 'x-correlation-id' ? 'test-id' : null
          )
        }
      };

      await middleware(mockRequest as any, handler);

      expect(extractResourceId).toHaveBeenCalledWith(mockRequest);
      expect(mockPolicyEngine.check).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: { type: 'test', id: 'custom-id', ownerTenant: 'tenant1' }
        }),
        'test-id'
      );
    });

    it('returns 500 when extractClaims throws error', async () => {
      mockExtractClaims.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = withRBAC({ resource: 'test', action: 'read' });
      const handler = jest.fn();

      const mockRequest = {
        headers: {
          get: jest.fn((key: string) =>
            key === 'authorization' ? 'Bearer invalid-token' :
            key === 'x-correlation-id' ? 'test-id' : null
          )
        }
      };

      const response = await middleware(mockRequest as any, handler);

      expect(response.status).toBe(500);
      expect(response.payload.error).toBe('Internal Server Error');
      expect(response.payload.message).toBe('Invalid token');
      expect(handler).not.toHaveBeenCalled();
    });
  });
});