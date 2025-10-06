import {
  validateAuthzRequest,
  validateAuthzRequestRuntime,
  AuthzRequest,
} from '../../lib/contracts/validator';

describe('Authorization Request Contract Validation', () => {
  // Valid test cases
  describe('Valid authorization requests', () => {
    it('should validate minimal required fields', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate request with all optional fields', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          roles: ['admin', 'editor'],
          groups: ['management', 'content-creators'],
          scopes: ['read', 'write', 'delete'],
          department: 'engineering',
          level: 'senior'
        },
        resource: {
          type: 'document',
          id: 'doc-789',
          ownerTenant: 'org-456',
          category: 'confidential',
          tags: ['important', 'legal']
        },
        action: 'edit',
        context: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: Date.now(),
          requestId: 'req-abc-123'
        }
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate with empty arrays for roles, groups, scopes', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'service-account-456',
          tenant: 'system',
          roles: [],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'api',
          id: 'health-check'
        },
        action: 'ping'
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it('should validate with complex nested context', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-789',
          tenant: 'multi-org'
        },
        resource: {
          type: 'workflow',
          id: 'wf-123'
        },
        action: 'execute',
        context: {
          metadata: {
            source: 'ui',
            version: '1.2.3'
          },
          parameters: {
            priority: 'high',
            notify: true
          },
          audit: {
            sessionId: 'sess-456',
            correlationId: 'corr-789'
          }
        }
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });
  });

  // Invalid test cases
  describe('Invalid authorization requests', () => {
    it('should reject request missing required subject field', () => {
      const invalidRequest = {
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].params.missingProperty).toBe('subject');
    });

    it('should reject request missing required resource field', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].params.missingProperty).toBe('resource');
    });

    it('should reject request missing required action field', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        }
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].params.missingProperty).toBe('action');
    });

    it('should reject request with subject missing required id', () => {
      const invalidRequest = {
        subject: {
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject');
      expect(result.errors![0].params.missingProperty).toBe('id');
    });

    it('should reject request with subject missing required tenant', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject');
      expect(result.errors![0].params.missingProperty).toBe('tenant');
    });

    it('should reject request with resource missing required type', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/resource');
      expect(result.errors![0].params.missingProperty).toBe('type');
    });

    it('should reject request with resource missing required id', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/resource');
      expect(result.errors![0].params.missingProperty).toBe('id');
    });

    it('should reject request with wrong type for roles', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          roles: 'admin' // Should be array, not string
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject/roles');
    });

    it('should reject request with non-string items in roles array', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          roles: ['admin', 123] // Numbers not allowed
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject/roles/1');
    });

    it('should reject request with wrong type for groups', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          groups: 'management' // Should be array, not string
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject/groups');
    });

    it('should reject request with wrong type for scopes', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          scopes: 'read write' // Should be array, not string
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/subject/scopes');
    });

    it('should reject request with non-string action', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 123 // Should be string, not number
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].instancePath).toBe('/action');
    });

    it('should reject request with additional properties at root level', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read',
        invalidField: 'not allowed' // additionalProperties: false in schema
      };

      const result = validateAuthzRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors![0].keyword).toBe('additionalProperties');
    });

    it('should reject empty object', () => {
      const result = validateAuthzRequest({});
      expect(result.valid).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject null input', () => {
      const result = validateAuthzRequest(null);
      expect(result.valid).toBe(false);
    });

    it('should reject string input', () => {
      const result = validateAuthzRequest('not-an-object');
      expect(result.valid).toBe(false);
    });

    it('should reject array input', () => {
      const result = validateAuthzRequest([]);
      expect(result.valid).toBe(false);
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

    it('should return valid request when runtime validation passes', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      const result = validateAuthzRequestRuntime(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should throw error when runtime validation fails', () => {
      const invalidRequest = {
        subject: {
          id: 'user-123'
          // Missing required tenant
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read'
      };

      expect(() => validateAuthzRequestRuntime(invalidRequest))
        .toThrow(/Contract validation failed for Authorization Request/);
    });

    it('should skip validation in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const invalidRequest = {
        invalid: 'data'
      };

      const result = validateAuthzRequestRuntime(invalidRequest);
      expect(result).toEqual(invalidRequest);
    });

    it('should skip validation when feature flag is disabled', () => {
      process.env.ENABLE_CONTRACT_VALIDATION = 'false';
      
      const invalidRequest = {
        invalid: 'data'
      };

      const result = validateAuthzRequestRuntime(invalidRequest);
      expect(result).toEqual(invalidRequest);
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('should handle subject and resource with only required fields plus additional properties', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456',
          customSubjectField: 'custom-value',
          nested: { data: 'allowed' }
        },
        resource: {
          type: 'document',
          id: 'doc-789',
          customResourceField: 'custom-value',
          metadata: { version: 1 }
        },
        action: 'read'
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it('should handle context with various data types', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'api',
          id: 'endpoint-xyz'
        },
        action: 'call',
        context: {
          stringField: 'value',
          numberField: 42,
          booleanField: true,
          arrayField: [1, 2, 3],
          objectField: { nested: 'object' },
          nullField: null
        }
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it('should handle very long string values', () => {
      const longString = 'a'.repeat(1000);
      
      const validRequest: AuthzRequest = {
        subject: {
          id: longString,
          tenant: longString
        },
        resource: {
          type: longString,
          id: longString
        },
        action: longString
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it('should handle empty context object', () => {
      const validRequest: AuthzRequest = {
        subject: {
          id: 'user-123',
          tenant: 'org-456'
        },
        resource: {
          type: 'document',
          id: 'doc-789'
        },
        action: 'read',
        context: {}
      };

      const result = validateAuthzRequest(validRequest);
      expect(result.valid).toBe(true);
    });
  });
});