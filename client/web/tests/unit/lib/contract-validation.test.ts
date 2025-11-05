import Ajv from 'ajv';
import {
  getKeycloakTokenClaimsSchema,
  getAuthzRequestSchema,
  getAuthzResponseSchema,
  getResourceInitSchema,
} from '../../../lib/contract-validation';

describe('Contract Validation Unit Tests', () => {
  let ajv: Ajv;

  beforeEach(() => {
    ajv = new Ajv({ allErrors: true });
  });

  describe('Keycloak Token Claims Schema', () => {
    it('validates correct keycloak token claims', () => {
      const schema = getKeycloakTokenClaimsSchema();
      const validate = ajv.compile(schema);

      const validClaims = {
        iss: 'https://keycloak.example.com',
        sub: 'user-123',
        aud: 'my-client',
        exp: 1234567890,
        iat: 1234567800,
        tenant: 'tenant-1',
      };

      expect(validate(validClaims)).toBe(true);
    });

    it('rejects claims missing required fields', () => {
      const schema = getKeycloakTokenClaimsSchema();
      const validate = ajv.compile(schema);

      const invalidClaims = { iss: 'issuer' };
      expect(validate(invalidClaims)).toBe(false);
      expect(validate.errors).toBeDefined();
    });

    it('accepts aud as array', () => {
      const schema = getKeycloakTokenClaimsSchema();
      const validate = ajv.compile(schema);

      const claims = {
        iss: 'issuer',
        sub: 'subject',
        aud: ['client1', 'client2'],
        exp: 123,
        iat: 120,
        tenant: 'tenant-1',
      };

      expect(validate(claims)).toBe(true);
    });

    it('allows additional properties in keycloak claims', () => {
      const schema = getKeycloakTokenClaimsSchema();
      const validate = ajv.compile(schema);

      const claimsWithExtra = {
        iss: 'issuer',
        sub: 'subject',
        aud: 'aud',
        exp: 123,
        iat: 120,
        tenant: 'tenant-1',
        customField: 'value',
      };

      expect(validate(claimsWithExtra)).toBe(true);
    });
  });

  describe('Authorization Request Schema', () => {
    it('validates correct authorization request', () => {
      const schema = getAuthzRequestSchema();
      const validate = ajv.compile(schema);

      const validRequest = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'document', id: 'doc-123' },
        action: 'read',
      };

      expect(validate(validRequest)).toBe(true);
    });

    it('rejects request missing required fields', () => {
      const schema = getAuthzRequestSchema();
      const validate = ajv.compile(schema);

      const incomplete = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'doc', id: 'doc-1' },
      };

      expect(validate(incomplete)).toBe(false);
    });

    it('forbids additional properties in authorization request', () => {
      const schema = getAuthzRequestSchema();
      const validate = ajv.compile(schema);

      const withExtra = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'doc', id: 'doc-1' },
        action: 'read',
        extraField: 'not-allowed',
      };

      expect(validate(withExtra)).toBe(false);
    });

    it('accepts context in authorization request', () => {
      const schema = getAuthzRequestSchema();
      const validate = ajv.compile(schema);

      const withContext = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'doc', id: 'doc-1' },
        action: 'read',
        context: { ip: '192.168.1.1' },
      };

      expect(validate(withContext)).toBe(true);
    });
  });

  describe('Authorization Response Schema', () => {
    it('validates correct authorization response', () => {
      const schema = getAuthzResponseSchema();
      const validate = ajv.compile(schema);

      const validResponse = { decision: 'allow' };
      expect(validate(validResponse)).toBe(true);
    });

    it('rejects response without decision', () => {
      const schema = getAuthzResponseSchema();
      const validate = ajv.compile(schema);

      expect(validate({})).toBe(false);
    });

    it('only accepts allow or deny decisions', () => {
      const schema = getAuthzResponseSchema();
      const validate = ajv.compile(schema);

      expect(validate({ decision: 'allow' })).toBe(true);
      expect(validate({ decision: 'deny' })).toBe(true);
      expect(validate({ decision: 'maybe' })).toBe(false);
    });

    it('accepts optional fields in response', () => {
      const schema = getAuthzResponseSchema();
      const validate = ajv.compile(schema);

      const full = {
        decision: 'allow',
        reason: 'User has role',
        policyRef: 'policy-123',
        obligations: { key: 'value' },
      };

      expect(validate(full)).toBe(true);
    });
  });

  describe('Resource Initialization Schema', () => {
    it('validates correct resource initialization plan', () => {
      const schema = getResourceInitSchema();
      const validate = ajv.compile(schema);

      const validPlan = {
        id: 'rip_001',
        clientId: 'client_123',
        resources: [
          { kind: 'supabase', supabase: { projectUrl: 'https://example.supabase.co' } },
        ],
      };

      expect(validate(validPlan)).toBe(true);
    });

    it('rejects plan missing required fields', () => {
      const schema = getResourceInitSchema();
      const validate = ajv.compile(schema);

      expect(validate({ id: 'rip_001', clientId: 'client_123' })).toBe(false);
    });

    it('validates different resource kinds', () => {
      const schema = getResourceInitSchema();
      const validate = ajv.compile(schema);

      const withStorage = {
        id: 'rip_001',
        clientId: 'client_123',
        resources: [{ kind: 'storage' }],
      };

      const withOther = {
        id: 'rip_001',
        clientId: 'client_123',
        resources: [{ kind: 'other' }],
      };

      expect(validate(withStorage)).toBe(true);
      expect(validate(withOther)).toBe(true);
    });

    it('validates full supabase resource configuration', () => {
      const schema = getResourceInitSchema();
      const validate = ajv.compile(schema);

      const fullConfig = {
        id: 'rip_001',
        clientId: 'client_123',
        resources: [
          {
            kind: 'supabase',
            supabase: {
              projectUrl: 'https://example.supabase.co',
              anonKey: 'anon-key',
              serviceRoleKey: 'service-role-key',
              init: { tables: ['prompts', 'documents'] },
            },
          },
        ],
      };

      expect(validate(fullConfig)).toBe(true);
    });
  });

  describe('Schema Getters', () => {
    it('returns defined schemas with correct IDs', () => {
      expect(getKeycloakTokenClaimsSchema().$id).toContain('keycloak-token-claims');
      expect(getAuthzRequestSchema().$id).toContain('authz-request');
      expect(getAuthzResponseSchema().$id).toContain('authz-response');
      expect(getResourceInitSchema().$id).toContain('resource-initialization-plan');
    });

    it('returns schemas with correct required fields', () => {
      expect(getKeycloakTokenClaimsSchema().required).toContain('iss');
      expect(getKeycloakTokenClaimsSchema().required).toContain('tenant');
      expect(getAuthzRequestSchema().required).toContain('subject');
      expect(getAuthzRequestSchema().required).toContain('resource');
      expect(getAuthzRequestSchema().required).toContain('action');
      expect(getAuthzResponseSchema().required).toContain('decision');
      expect(getResourceInitSchema().required).toContain('id');
      expect(getResourceInitSchema().required).toContain('clientId');
      expect(getResourceInitSchema().required).toContain('resources');
    });

    it('schemas have correct types and structure', () => {
      const keycloak = getKeycloakTokenClaimsSchema();
      expect(keycloak.type).toBe('object');
      expect(keycloak.properties).toBeDefined();

      const authz = getAuthzRequestSchema();
      expect(authz.properties.subject).toBeDefined();
      expect(authz.properties.subject.type).toBe('object');
    });
  });

  describe('Cross-schema validation scenarios', () => {
    it('validates keycloak and authz schemas together', () => {
      const keycloakSchema = getKeycloakTokenClaimsSchema();
      const authzSchema = getAuthzRequestSchema();

      const keycloakValidate = ajv.compile(keycloakSchema);
      const authzValidate = ajv.compile(authzSchema);

      const claims = {
        iss: 'issuer',
        sub: 'user-123',
        aud: 'client',
        exp: 123,
        iat: 120,
        tenant: 'tenant-1',
      };

      const request = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'doc', id: 'doc-1' },
        action: 'read',
      };

      expect(keycloakValidate(claims)).toBe(true);
      expect(authzValidate(request)).toBe(true);
    });

    it('validates complete authorization flow', () => {
      const requestSchema = getAuthzRequestSchema();
      const responseSchema = getAuthzResponseSchema();

      const requestValidate = ajv.compile(requestSchema);
      const responseValidate = ajv.compile(responseSchema);

      const request = {
        subject: { id: 'user-123', tenant: 'tenant-1' },
        resource: { type: 'doc', id: 'doc-1' },
        action: 'read',
      };

      const response = { decision: 'allow', reason: 'User has read permission' };

      expect(requestValidate(request)).toBe(true);
      expect(responseValidate(response)).toBe(true);
    });
  });
});
