import { OIDCVerifier } from '../../lib/auth/oidc-verifier';
import { AuthConfig, AuthErrorCode, TokenClaims } from '../../lib/auth/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('OIDCVerifier', () => {
  let verifier: OIDCVerifier;
  let mockConfig: AuthConfig;

  const mockDiscovery = {
    issuer: 'https://keycloak.example.com/realms/max-ai',
    authorization_endpoint: 'https://keycloak.example.com/realms/max-ai/protocol/openid-connect/auth',
    token_endpoint: 'https://keycloak.example.com/realms/max-ai/protocol/openid-connect/token',
    jwks_uri: 'https://keycloak.example.com/realms/max-ai/protocol/openid-connect/certs',
    userinfo_endpoint: 'https://keycloak.example.com/realms/max-ai/protocol/openid-connect/userinfo',
    id_token_signing_alg_values_supported: ['RS256'],
    subject_types_supported: ['public'],
    response_types_supported: ['code']
  };

  const mockValidToken: TokenClaims = {
    iss: 'https://keycloak.example.com/realms/max-ai',
    sub: 'user-123',
    aud: 'max-ai-platform',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
    tenant: 'tenant-456',
    email: 'user@example.com',
    name: 'Test User',
    roles: ['user', 'admin'],
    groups: ['developers'],
    scope: 'read write admin'
  };

  beforeEach(() => {
    mockConfig = {
      keycloakBaseUrl: 'https://keycloak.example.com',
      realm: 'max-ai',
      audience: 'max-ai-platform',
      clockTolerance: 60,
      cacheTtl: 3600,
      enableLogging: false,
      requiredClaims: []
    };

    verifier = new OIDCVerifier(mockConfig);

    // Reset fetch mock
    (fetch as jest.Mock).mockReset();

    // Setup default fetch responses
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/.well-known/openid-configuration')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDiscovery)
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    // Mock contract validation to pass by default
    jest.mock('../../lib/contracts/validator', () => ({
      validateTokenClaimsRuntime: jest.fn().mockImplementation(data => data)
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Discovery document handling', () => {
    it('should fetch and cache discovery document', async () => {
      const mockToken = 'valid.jwt.token';
      
      // Mock jwtVerify to avoid actual JWT verification in unit tests
      jest.doMock('jose', () => ({
        jwtVerify: jest.fn().mockResolvedValue({
          payload: mockValidToken
        }),
        createRemoteJWKSet: jest.fn().mockReturnValue(() => Promise.resolve({}))
      }));

      try {
        await verifier.verifyToken(mockToken);
      } catch (error) {
        // Expected to fail due to jose mocking, but should have fetched discovery
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://keycloak.example.com/realms/max-ai/.well-known/openid-configuration'
      );
    });

    it('should handle discovery document fetch failure', async () => {
      (fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });
      });

      const result = await verifier.verifyToken('test.jwt.token');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DISCOVERY_FAILED);
      expect(result.error?.message).toContain('Discovery endpoint returned 404');
    });

    it('should build correct discovery URL without realm', () => {
      const configWithoutRealm = { ...mockConfig, realm: undefined };
      const verifierWithoutRealm = new OIDCVerifier(configWithoutRealm);

      // Access private method for testing via type assertion
      const buildDiscoveryUrl = (verifierWithoutRealm as any).buildDiscoveryUrl.bind(verifierWithoutRealm);
      const url = buildDiscoveryUrl();

      expect(url).toBe('https://keycloak.example.com/.well-known/openid-configuration');
    });
  });

  describe('Token claims validation', () => {
    it('should validate required claims', () => {
      const validateTokenClaims = (verifier as any).validateTokenClaims.bind(verifier);
      
      const validClaims = {
        iss: 'https://keycloak.example.com/realms/max-ai',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      expect(() => validateTokenClaims(validClaims)).not.toThrow();
    });

    it('should reject claims missing required fields', () => {
      const validateTokenClaims = (verifier as any).validateTokenClaims.bind(verifier);
      
      const invalidClaims = {
        iss: 'https://keycloak.example.com/realms/max-ai',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
        // Missing tenant
      };

      expect(() => validateTokenClaims(invalidClaims)).toThrow();
    });

    it('should validate custom required claims', () => {
      const configWithCustomClaims = { 
        ...mockConfig, 
        requiredClaims: ['email', 'custom_claim'] 
      };
      const verifierWithCustomClaims = new OIDCVerifier(configWithCustomClaims);
      const validateTokenClaims = (verifierWithCustomClaims as any).validateTokenClaims.bind(verifierWithCustomClaims);
      
      const claimsWithCustom = {
        iss: 'https://keycloak.example.com/realms/max-ai',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456',
        email: 'user@example.com',
        custom_claim: 'custom_value'
      };

      expect(() => validateTokenClaims(claimsWithCustom)).not.toThrow();

      // Missing custom claim should fail
      const { custom_claim, ...claimsWithoutCustom } = claimsWithCustom;
      expect(() => validateTokenClaims(claimsWithoutCustom)).toThrow();
    });
  });

  describe('Subject context building', () => {
    it('should build complete subject context', () => {
      const buildSubjectContext = (verifier as any).buildSubjectContext.bind(verifier);
      const subject = buildSubjectContext(mockValidToken);

      expect(subject).toEqual({
        id: 'user-123',
        tenantId: 'tenant-456',
        email: 'user@example.com',
        displayName: 'Test User',
        roles: ['user', 'admin'],
        groups: ['developers'],
        scopes: ['read', 'write', 'admin'],
        isServiceAccount: false,
        metadata: {
          iss: 'https://keycloak.example.com/realms/max-ai',
          aud: 'max-ai-platform',
          iat: mockValidToken.iat,
          exp: mockValidToken.exp,
          jti: undefined
        }
      });
    });

    it('should handle missing optional claims', () => {
      const buildSubjectContext = (verifier as any).buildSubjectContext.bind(verifier);
      const minimalToken = {
        iss: 'https://keycloak.example.com/realms/max-ai',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const subject = buildSubjectContext(minimalToken);

      expect(subject).toEqual({
        id: 'user-123',
        tenantId: 'tenant-456',
        email: undefined,
        displayName: undefined,
        roles: [],
        groups: [],
        scopes: [],
        isServiceAccount: false,
        metadata: {
          iss: 'https://keycloak.example.com/realms/max-ai',
          aud: 'max-ai-platform',
          iat: minimalToken.iat,
          exp: minimalToken.exp,
          jti: undefined
        }
      });
    });

    it('should detect service accounts', () => {
      const buildSubjectContext = (verifier as any).buildSubjectContext.bind(verifier);
      
      // Service account pattern 1: sub starts with 'service-'
      const serviceAccountToken1 = {
        ...mockValidToken,
        sub: 'service-account-123',
        email: undefined
      };

      const subject1 = buildSubjectContext(serviceAccountToken1);
      expect(subject1.isServiceAccount).toBe(true);

      // Service account pattern 2: has 'service' scope
      const serviceAccountToken2 = {
        ...mockValidToken,
        sub: 'sa-123',
        email: undefined,
        scope: 'service read write'
      };

      const subject2 = buildSubjectContext(serviceAccountToken2);
      expect(subject2.isServiceAccount).toBe(true);

      // Regular user should not be detected as service account
      const regularUserToken = {
        ...mockValidToken,
        email: 'user@example.com'
      };

      const subject3 = buildSubjectContext(regularUserToken);
      expect(subject3.isServiceAccount).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await verifier.verifyToken('test.jwt.token');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(AuthErrorCode.DISCOVERY_FAILED);
      expect(result.error?.message).toContain('Failed to fetch OIDC discovery document');
    });

    it('should handle JWT verification errors', async () => {
      // Mock jose to throw different types of errors
      jest.doMock('jose', () => ({
        jwtVerify: jest.fn().mockRejectedValue({ code: 'ERR_JWT_EXPIRED' }),
        createRemoteJWKSet: jest.fn().mockReturnValue(() => Promise.resolve({}))
      }));

      const { jwtVerify, createRemoteJWKSet } = require('jose');
      
      // Test expired token
      (jwtVerify as jest.Mock).mockRejectedValue({ code: 'ERR_JWT_EXPIRED' });
      
      const result1 = await verifier.verifyToken('expired.jwt.token');
      expect(result1.success).toBe(false);
      expect(result1.error?.code).toBe(AuthErrorCode.TOKEN_EXPIRED);

      // Test invalid token
      (jwtVerify as jest.Mock).mockRejectedValue({ code: 'ERR_JWT_INVALID' });
      
      const result2 = await verifier.verifyToken('invalid.jwt.token');
      expect(result2.success).toBe(false);
      expect(result2.error?.code).toBe(AuthErrorCode.INVALID_TOKEN_FORMAT);

      // Test signature verification failure
      (jwtVerify as jest.Mock).mockRejectedValue({ code: 'ERR_JWKS_NO_MATCHING_KEY' });
      
      const result3 = await verifier.verifyToken('unsigned.jwt.token');
      expect(result3.success).toBe(false);
      expect(result3.error?.code).toBe(AuthErrorCode.INVALID_SIGNATURE);
    });
  });

  describe('Utility methods', () => {
    it('should extract Bearer token correctly', () => {
      // Valid Authorization header
      const token1 = OIDCVerifier.extractBearerToken('Bearer abc123.def456.ghi789');
      expect(token1).toBe('abc123.def456.ghi789');

      // Case insensitive
      const token2 = OIDCVerifier.extractBearerToken('bearer abc123.def456.ghi789');
      expect(token2).toBe('abc123.def456.ghi789');

      // Missing header
      const token3 = OIDCVerifier.extractBearerToken(undefined);
      expect(token3).toBeNull();

      // Invalid format
      const token4 = OIDCVerifier.extractBearerToken('Basic abc123');
      expect(token4).toBeNull();

      // Empty Bearer
      const token5 = OIDCVerifier.extractBearerToken('Bearer ');
      expect(token5).toBeNull();
    });

    it('should create default configuration', () => {
      const config = OIDCVerifier.createDefaultConfig('https://keycloak.example.com', 'my-app');
      
      expect(config).toEqual({
        keycloakBaseUrl: 'https://keycloak.example.com',
        audience: 'my-app',
        clockTolerance: 60,
        cacheTtl: 3600,
        enableLogging: true, // true in test environment
        requiredClaims: []
      });
    });
  });
});