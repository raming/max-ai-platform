import { NextRequest, NextResponse } from 'next/server';
import { Request, Response } from 'express';
import { AuthMiddleware, hasRole, hasScope, canAccess } from '../../lib/auth/middleware';
import { OIDCVerifier } from '../../lib/auth/oidc-verifier';
import { AuthErrorCode, SubjectContext } from '../../lib/auth/types';

// Mock OIDCVerifier
jest.mock('../../lib/auth/oidc-verifier');
const MockedOIDCVerifier = OIDCVerifier as jest.MockedClass<typeof OIDCVerifier>;

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockVerifier: jest.Mocked<OIDCVerifier>;
  let mockSubject: SubjectContext;

  beforeEach(() => {
    mockSubject = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'user@example.com',
      displayName: 'Test User',
      roles: ['user', 'admin'],
      groups: ['developers'],
      scopes: ['read', 'write'],
      isServiceAccount: false,
      metadata: {}
    };

    mockVerifier = {
      verifyToken: jest.fn(),
    } as any;

    MockedOIDCVerifier.extractBearerToken = jest.fn();
    
    middleware = new AuthMiddleware(mockVerifier);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Express middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        headers: {}
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      mockNext = jest.fn();
    });

    it('should authenticate valid token and call next', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(token);
      mockVerifier.verifyToken.mockResolvedValue({
        success: true,
        subject: mockSubject
      });

      const expressMiddleware = middleware.expressMiddleware();
      await expressMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockVerifier.verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.subject).toEqual(mockSubject);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-subject-id', 'user-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-tenant-id', 'tenant-456');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when token is missing', async () => {
      mockRequest.headers = {}; // No authorization header

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(null);

      const expressMiddleware = middleware.expressMiddleware();
      await expressMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: AuthErrorCode.MISSING_TOKEN,
          message: 'Authorization header with Bearer token required',
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', async () => {
      const token = 'invalid.jwt.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(token);
      mockVerifier.verifyToken.mockResolvedValue({
        success: false,
        error: {
          code: AuthErrorCode.TOKEN_EXPIRED,
          message: 'Token has expired'
        }
      });

      const expressMiddleware = middleware.expressMiddleware();
      await expressMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: AuthErrorCode.TOKEN_EXPIRED,
          message: 'Token has expired',
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle middleware errors gracefully', async () => {
      const token = 'valid.jwt.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(token);
      mockVerifier.verifyToken.mockRejectedValue(new Error('Unexpected error'));

      const expressMiddleware = middleware.expressMiddleware();
      await expressMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: AuthErrorCode.UNKNOWN_ERROR,
          message: 'Authentication middleware failed',
          timestamp: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Next.js middleware', () => {
    it('should authenticate valid token and continue', async () => {
      const token = 'valid.jwt.token';
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'authorization') return `Bearer ${token}`;
            return null;
          })
        }
      } as any as NextRequest;

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(token);
      mockVerifier.verifyToken.mockResolvedValue({
        success: true,
        subject: mockSubject
      });

      // Mock NextResponse.next()
      const mockNextResponse = {
        headers: {
          set: jest.fn()
        }
      };
      jest.spyOn(NextResponse, 'next').mockReturnValue(mockNextResponse as any);

      const result = await middleware.nextMiddleware(mockRequest);

      expect(mockVerifier.verifyToken).toHaveBeenCalledWith(token);
      expect(mockNextResponse.headers.set).toHaveBeenCalledWith('x-subject-id', 'user-123');
      expect(mockNextResponse.headers.set).toHaveBeenCalledWith('x-tenant-id', 'tenant-456');
      expect(result).toBe(mockNextResponse);
    });

    it('should return 401 response when token is missing', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null) // No authorization header
        }
      } as any as NextRequest;

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(null);

      // Mock NextResponse.json()
      const mockJsonResponse = { status: 401 };
      jest.spyOn(NextResponse, 'json').mockReturnValue(mockJsonResponse as any);

      const result = await middleware.nextMiddleware(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            code: AuthErrorCode.MISSING_TOKEN,
            message: 'Authorization header with Bearer token required',
            timestamp: expect.any(String)
          }
        },
        { status: 401 }
      );
      expect(result).toBe(mockJsonResponse);
    });
  });

  describe('withAuth higher-order function', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.KEYCLOAK_BASE_URL = 'https://keycloak.example.com';
      process.env.KEYCLOAK_AUDIENCE = 'max-ai-platform';
    });

    afterEach(() => {
      delete process.env.KEYCLOAK_BASE_URL;
      delete process.env.KEYCLOAK_AUDIENCE;
    });

    it('should protect handler and inject subject context', async () => {
      const token = 'valid.jwt.token';
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'authorization') return `Bearer ${token}`;
            return null;
          })
        }
      } as any as NextRequest;

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      );

      MockedOIDCVerifier.extractBearerToken.mockReturnValue(token);
      // Mock the constructor and instance
      MockedOIDCVerifier.mockImplementation(() => mockVerifier);
      mockVerifier.verifyToken.mockResolvedValue({
        success: true,
        subject: mockSubject
      });

      const protectedHandler = AuthMiddleware.withAuth(mockHandler);
      const result = await protectedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, { subject: mockSubject });
    });

    it('should return 401 without calling handler when authentication fails', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null) // No authorization header
        }
      } as any as NextRequest;

      const mockHandler = jest.fn();
      MockedOIDCVerifier.extractBearerToken.mockReturnValue(null);

      const mockJsonResponse = { status: 401 };
      jest.spyOn(NextResponse, 'json').mockReturnValue(mockJsonResponse as any);

      const protectedHandler = AuthMiddleware.withAuth(mockHandler);
      const result = await protectedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBe(mockJsonResponse);
    });
  });

  describe('fromEnv factory method', () => {
    beforeEach(() => {
      process.env.KEYCLOAK_BASE_URL = 'https://keycloak.example.com';
      process.env.KEYCLOAK_AUDIENCE = 'max-ai-platform';
      process.env.KEYCLOAK_REALM = 'max-ai';
    });

    afterEach(() => {
      delete process.env.KEYCLOAK_BASE_URL;
      delete process.env.KEYCLOAK_AUDIENCE;
      delete process.env.KEYCLOAK_REALM;
    });

    it('should create middleware from environment variables', () => {
      MockedOIDCVerifier.mockImplementation(() => mockVerifier);

      const middleware = AuthMiddleware.fromEnv();

      expect(middleware).toBeInstanceOf(AuthMiddleware);
      expect(MockedOIDCVerifier).toHaveBeenCalledWith({
        keycloakBaseUrl: 'https://keycloak.example.com',
        realm: 'max-ai',
        audience: 'max-ai-platform',
        clockTolerance: 60,
        cacheTtl: 3600,
        enableLogging: expect.any(Boolean),
        requiredClaims: []
      });
    });

    it('should throw error when required environment variables are missing', () => {
      delete process.env.KEYCLOAK_BASE_URL;

      expect(() => AuthMiddleware.fromEnv()).toThrow(
        'KEYCLOAK_BASE_URL environment variable is required'
      );
    });
  });
});

describe('Authorization utility functions', () => {
  let mockSubject: SubjectContext;

  beforeEach(() => {
    mockSubject = {
      id: 'user-123',
      tenantId: 'tenant-456',
      email: 'user@example.com',
      displayName: 'Test User',
      roles: ['user', 'admin'],
      groups: ['developers'],
      scopes: ['read', 'write'],
      isServiceAccount: false,
      metadata: {}
    };
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      expect(hasRole(mockSubject, 'admin')).toBe(true);
      expect(hasRole(mockSubject, 'user')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(hasRole(mockSubject, 'super-admin')).toBe(false);
      expect(hasRole(mockSubject, 'guest')).toBe(false);
    });
  });

  describe('hasScope', () => {
    it('should return true when user has the scope', () => {
      expect(hasScope(mockSubject, 'read')).toBe(true);
      expect(hasScope(mockSubject, 'write')).toBe(true);
    });

    it('should return false when user does not have the scope', () => {
      expect(hasScope(mockSubject, 'delete')).toBe(false);
      expect(hasScope(mockSubject, 'admin')).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('should return true when all conditions are met', () => {
      expect(canAccess(
        mockSubject,
        ['admin', 'user'],
        ['read'],
        'tenant-456'
      )).toBe(true);
    });

    it('should return false when tenant check fails', () => {
      expect(canAccess(
        mockSubject,
        ['admin'],
        ['read'],
        'other-tenant'
      )).toBe(false);
    });

    it('should return false when role check fails', () => {
      expect(canAccess(
        mockSubject,
        ['super-admin'],
        ['read'],
        'tenant-456'
      )).toBe(false);
    });

    it('should return false when scope check fails', () => {
      expect(canAccess(
        mockSubject,
        ['admin'],
        ['delete'],
        'tenant-456'
      )).toBe(false);
    });

    it('should return true when only some conditions are specified', () => {
      // Only tenant check
      expect(canAccess(mockSubject, undefined, undefined, 'tenant-456')).toBe(true);
      
      // Only role check
      expect(canAccess(mockSubject, ['admin'], undefined, undefined)).toBe(true);
      
      // Only scope check
      expect(canAccess(mockSubject, undefined, ['read'], undefined)).toBe(true);
      
      // No conditions
      expect(canAccess(mockSubject)).toBe(true);
    });
  });
});