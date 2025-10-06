import {
  validateAuthzResponse,
  validateAuthzResponseRuntime,
  AuthzResponse,
} from '../../lib/contracts/validator';

describe('Authorization Response Contract Validation', () => {
  // Valid test cases
  describe('Valid authorization responses', () => {
    it('should validate minimal allow response', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow'
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate minimal deny response', () => {
      const validResponse: AuthzResponse = {
        decision: 'deny'
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate response with all optional fields for allow', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        reason: 'User has admin role and document is in same tenant',
        policyRef: 'tenant-admin-read-policy-v1',
        obligations: {
          auditRequired: true,
          logLevel: 'info',
          notifyOwner: false,
          sessionTimeoutMinutes: 30
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate response with all optional fields for deny', () => {
      const validResponse: AuthzResponse = {
        decision: 'deny',
        reason: 'User lacks required permission for cross-tenant resource access',
        policyRef: 'cross-tenant-access-policy-v2',
        obligations: {
          auditRequired: true,
          logLevel: 'warn',
          alertSecurity: true,
          rateLimitIncrease: 2
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate with complex obligations object', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        obligations: {
          audit: {
            level: 'detailed',
            fields: ['subject', 'resource', 'action', 'decision'],
            retention: '7d'
          },
          conditions: {
            maxUsage: 100,
            timeWindow: '1h',
            ipWhitelist: ['192.168.1.0/24']
          },
          metadata: {
            policyEvaluationTime: 15,
            cacheKey: 'user-123:doc-789:read',
            version: '2.1.0'
          }
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should validate with empty obligations object', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        obligations: {}
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });
  });

  // Invalid test cases
  describe('Invalid authorization responses', () => {
    it('should reject response missing required decision field', () => {
      const invalidResponse = {
        reason: 'Some reason',
        policyRef: 'policy-123'
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].missingProperty).toBe('decision');
    });

    it('should reject response with invalid decision value', () => {
      const invalidResponse = {
        decision: 'maybe' // Should be 'allow' or 'deny'
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/decision');
      expect(result.errors![0].allowedValues).toEqual(['allow', 'deny']);
    });

    it('should reject response with wrong type for decision', () => {
      const invalidResponse = {
        decision: 123 // Should be string, not number
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/decision');
    });

    it('should reject response with wrong type for reason', () => {
      const invalidResponse = {
        decision: 'allow',
        reason: 123 // Should be string, not number
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/reason');
    });

    it('should reject response with wrong type for policyRef', () => {
      const invalidResponse = {
        decision: 'deny',
        policyRef: true // Should be string, not boolean
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/policyRef');
    });

    it('should reject response with wrong type for obligations', () => {
      const invalidResponse = {
        decision: 'allow',
        obligations: 'string-not-object' // Should be object, not string
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/obligations');
    });

    it('should reject response with obligations as array', () => {
      const invalidResponse = {
        decision: 'allow',
        obligations: [] // Should be object, not array
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/obligations');
    });

    it('should reject response with additional properties at root level', () => {
      const invalidResponse = {
        decision: 'allow',
        invalidField: 'not allowed' // additionalProperties: false in schema
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].keyword).toBe('additionalProperties');
    });

    it('should reject empty object', () => {
      const result = validateAuthzResponse({});
      expect(result.valid).toBe(false);
      expect(result.errors![0].missingProperty).toBe('decision');
    });

    it('should reject null input', () => {
      const result = validateAuthzResponse(null);
      expect(result.valid).toBe(false);
    });

    it('should reject string input', () => {
      const result = validateAuthzResponse('not-an-object');
      expect(result.valid).toBe(false);
    });

    it('should reject array input', () => {
      const result = validateAuthzResponse([]);
      expect(result.valid).toBe(false);
    });

    it('should reject response with boolean decision', () => {
      const invalidResponse = {
        decision: true // Should be 'allow' or 'deny', not boolean
      };

      const result = validateAuthzResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/decision');
    });
  });

  // Runtime validation tests
  describe('Runtime validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_CONTRACT_VALIDATION = 'true';
    });

    afterEach(() => {
      delete process.env.ENABLE_CONTRACT_VALIDATION;
    });

    it('should return valid response when runtime validation passes', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        reason: 'User authorized'
      };

      const result = validateAuthzResponseRuntime(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should throw error when runtime validation fails', () => {
      const invalidResponse = {
        decision: 'invalid-decision'
      };

      expect(() => validateAuthzResponseRuntime(invalidResponse))
        .toThrow(/Contract validation failed for Authorization Response/);
    });

    it('should skip validation in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const invalidResponse = {
        invalid: 'data'
      };

      const result = validateAuthzResponseRuntime(invalidResponse);
      expect(result).toEqual(invalidResponse);
    });

    it('should skip validation when feature flag is disabled', () => {
      process.env.ENABLE_CONTRACT_VALIDATION = 'false';
      
      const invalidResponse = {
        invalid: 'data'
      };

      const result = validateAuthzResponseRuntime(invalidResponse);
      expect(result).toEqual(invalidResponse);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle obligations with various data types', () => {
      const validResponse: AuthzResponse = {
        decision: 'deny',
        obligations: {
          stringValue: 'text',
          numberValue: 42,
          booleanValue: true,
          arrayValue: [1, 2, 3, 'mixed'],
          objectValue: { nested: 'data' },
          nullValue: null
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle very long reason string', () => {
      const longReason = 'This is a very long reason '.repeat(100);
      
      const validResponse: AuthzResponse = {
        decision: 'deny',
        reason: longReason
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle very long policyRef string', () => {
      const longPolicyRef = 'very-long-policy-reference-' + 'x'.repeat(1000);
      
      const validResponse: AuthzResponse = {
        decision: 'allow',
        policyRef: longPolicyRef
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle deeply nested obligations', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        obligations: {
          level1: {
            level2: {
              level3: {
                level4: {
                  deepValue: 'nested-data'
                }
              }
            }
          }
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle empty reason string', () => {
      const validResponse: AuthzResponse = {
        decision: 'deny',
        reason: ''
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle empty policyRef string', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        policyRef: ''
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should handle obligations with large arrays', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        obligations: {
          largeArray: Array.from({ length: 1000 }, (_, i) => `item-${i}`),
          mixedArray: [1, 'string', true, { nested: 'object' }, null]
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });
  });

  // Policy evaluation scenarios
  describe('Policy evaluation scenarios', () => {
    it('should validate typical allow response for admin user', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        reason: 'User has admin role in tenant org-123',
        policyRef: 'rbac-admin-policy',
        obligations: {
          auditLevel: 'standard',
          sessionTimeout: 3600
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should validate typical deny response for insufficient permissions', () => {
      const validResponse: AuthzResponse = {
        decision: 'deny',
        reason: 'User role "viewer" insufficient for action "delete"',
        policyRef: 'rbac-viewer-restrictions',
        obligations: {
          auditLevel: 'high',
          alertSecurityTeam: true,
          blockDuration: 300
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    it('should validate conditional allow with obligations', () => {
      const validResponse: AuthzResponse = {
        decision: 'allow',
        reason: 'Allowed with conditions due to sensitive data classification',
        policyRef: 'data-classification-policy',
        obligations: {
          requiresApproval: true,
          approverRoles: ['data-owner', 'security-officer'],
          maxDuration: 1800,
          additionalLogging: true
        }
      };

      const result = validateAuthzResponse(validResponse);
      expect(result.valid).toBe(true);
    });
  });
});