import Ajv, { type ValidateFunction } from 'ajv';
import { getAuthzRequestSchema } from '../../../../lib/contract-validation';

describe('Authorization Request Contract', () => {
  let ajv: Ajv;
  let validate: ValidateFunction;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schema = getAuthzRequestSchema();
    validate = ajv.compile(schema);
  });

  // Helper to check for path property (dataPath in older AJV, instancePath in newer)
  const expectErrorWithPath = (path: string, keyword: string, params?: any) => {
    // Handle both old (.resources[0]) and new (/resources/0) path formats
    const altPath = path.replace(/\//g, '.').replace(/\.(\d+)/g, '[$1]');
    const error = validate.errors?.find((err: any) =>
      (err.dataPath === path || err.dataPath === altPath || err.instancePath === path) &&
      err.keyword === keyword &&
      (!params || Object.keys(params).every(key => err.params[key] === params[key]))
    );
    expect(error).toBeDefined();
  };

  describe('valid requests', () => {
    it('should validate minimal required request', () => {
      const request = {
        subject: {
          id: 'user123',
          tenant: 'tenant1'
        },
        resource: {
          type: 'api',
          id: '/users'
        },
        action: 'read'
      };

      const valid = validate(request);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should validate request with optional fields', () => {
      const request = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: ['admin'],
          groups: ['group1'],
          scopes: ['read', 'write']
        },
        resource: {
          type: 'api',
          id: '/users/123',
          ownerTenant: 'tenant1'
        },
        action: 'update',
        context: {
          ip: '192.168.1.1',
          userAgent: 'test-agent'
        }
      };

      const valid = validate(request);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });
  });

  describe('invalid requests', () => {
    it('should reject missing subject', () => {
      const request = {
        resource: {
          type: 'api',
          id: '/users'
        },
        action: 'read'
      };

      const valid = validate(request);
      expect(valid).toBe(false);
      expectErrorWithPath('', 'required', { missingProperty: 'subject' });
    });

    it('should reject subject missing id', () => {
      const request = {
        subject: {
          tenant: 'tenant1'
        },
        resource: {
          type: 'api',
          id: '/users'
        },
        action: 'read'
      };

      const valid = validate(request);
      expect(valid).toBe(false);
      expectErrorWithPath('/subject', 'required', { missingProperty: 'id' });
    });

    it('should reject resource missing type', () => {
      const request = {
        subject: {
          id: 'user123',
          tenant: 'tenant1'
        },
        resource: {
          id: '/users'
        },
        action: 'read'
      };

      const valid = validate(request);
      expect(valid).toBe(false);
      expectErrorWithPath('/resource', 'required', { missingProperty: 'type' });
    });

    it('should reject missing action', () => {
      const request = {
        subject: {
          id: 'user123',
          tenant: 'tenant1'
        },
        resource: {
          type: 'api',
          id: '/users'
        }
      };

      const valid = validate(request);
      expect(valid).toBe(false);
      expectErrorWithPath('', 'required', { missingProperty: 'action' });
    });
  });
});