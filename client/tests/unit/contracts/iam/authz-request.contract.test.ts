import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

describe('Authorization Request Contract', () => {
  let ajv: Ajv;
  let validate: any;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schemaPath = path.join(__dirname, '../../../../../../ops/docs/contracts/iam/authz-request.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    validate = ajv.compile(schema);
  });

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
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'subject' } })
      );
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
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/subject', keyword: 'required', params: { missingProperty: 'id' } })
      );
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
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/resource', keyword: 'required', params: { missingProperty: 'type' } })
      );
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
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'action' } })
      );
    });
  });
});