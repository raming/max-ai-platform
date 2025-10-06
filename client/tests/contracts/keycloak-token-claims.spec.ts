import {
  validateKeycloakTokenClaims,
  validateTokenClaimsRuntime,
  KeycloakTokenClaims,
} from '../../web/src/lib/contracts/validator';

describe('Keycloak Token Claims Contract Validation', () => {
  // Valid test cases
  describe('Valid token claims', () => {
    it('should validate minimal required claims', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate claims with all optional fields', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: ['max-ai-platform', 'api-gateway'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000) - 60,
        jti: 'jwt-id-789',
        tenant: 'tenant-456',
        scope: 'read write admin',
        roles: ['user', 'admin'],
        groups: ['developers', 'admins'],
        custom_claim: 'custom_value'
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate with string audience', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'service-account-123',
        aud: 'api-service',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'service-tenant'
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
    });

    it('should validate with array audience', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-456',
        aud: ['frontend', 'api', 'admin-panel'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'multi-tenant-org'
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
    });
  });

  // Invalid test cases
  describe('Invalid token claims', () => {
    it('should reject claims missing required iss field', () => {
      const invalidClaims = {
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].missingProperty).toBe('iss');
    });

    it('should reject claims missing required sub field', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].missingProperty).toBe('sub');
    });

    it('should reject claims missing required tenant field', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].missingProperty).toBe('tenant');
    });

    it('should reject claims with invalid iss format (not URI)', () => {
      const invalidClaims = {
        iss: 'not-a-uri',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/iss');
    });

    it('should reject claims with negative exp timestamp', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: -1,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/exp');
    });

    it('should reject claims with wrong type for roles', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456',
        roles: 'admin' // Should be array, not string
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/roles');
    });

    it('should reject claims with non-string items in roles array', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456',
        roles: ['admin', 123] // Numbers not allowed in roles array
      };

      const result = validateKeycloakTokenClaims(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/roles/1');
    });

    it('should reject empty object', () => {
      const result = validateKeycloakTokenClaims({});
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject null input', () => {
      const result = validateKeycloakTokenClaims(null);
      expect(result.valid).toBe(false);
    });

    it('should reject string input', () => {
      const result = validateKeycloakTokenClaims('not-an-object');
      expect(result.valid).toBe(false);
    });
  });

  // Runtime validation tests
  describe('Runtime validation', () => {
    beforeEach(() => {
      // Set environment to enable runtime validation
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_CONTRACT_VALIDATION = 'true';
    });

    afterEach(() => {
      delete process.env.ENABLE_CONTRACT_VALIDATION;
    });

    it('should return valid claims when runtime validation passes', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateTokenClaimsRuntime(validClaims);
      expect(result).toEqual(validClaims);
    });

    it('should throw error when runtime validation fails', () => {
      const invalidClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
        // Missing required tenant field
      };

      expect(() => validateTokenClaimsRuntime(invalidClaims))
        .toThrow(/Contract validation failed for Keycloak Token Claims/);
    });

    it('should skip validation in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const invalidClaims = {
        invalid: 'data'
      };

      // Should not throw in production
      const result = validateTokenClaimsRuntime(invalidClaims);
      expect(result).toEqual(invalidClaims);
    });

    it('should skip validation when feature flag is disabled', () => {
      process.env.ENABLE_CONTRACT_VALIDATION = 'false';
      
      const invalidClaims = {
        invalid: 'data'
      };

      // Should not throw when disabled
      const result = validateTokenClaimsRuntime(invalidClaims);
      expect(result).toEqual(invalidClaims);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle very large exp timestamp', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: 2147483647, // Max 32-bit signed integer
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456'
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
    });

    it('should handle empty arrays for roles and groups', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456',
        roles: [],
        groups: []
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
    });

    it('should handle additional properties as per schema', () => {
      const validClaims: KeycloakTokenClaims = {
        iss: 'https://auth.max-ai.platform',
        sub: 'user-123',
        aud: 'max-ai-platform',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant-456',
        customField1: 'value1',
        customField2: { nested: 'object' },
        customField3: [1, 2, 3]
      };

      const result = validateKeycloakTokenClaims(validClaims);
      expect(result.valid).toBe(true);
    });
  });
});