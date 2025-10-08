import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

describe('Keycloak Token Claims Contract', () => {
  let ajv: Ajv;
  let validate: any;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true, strict: false });
    const schemaPath = path.join(__dirname, '../../../../../ops/docs/contracts/iam/keycloak-token-claims.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    validate = ajv.compile(schema);
  });

  describe('valid claims', () => {
    it('should validate minimal required claims', () => {
      const claims = {
        iss: 'https://keycloak.example.com/realms/test',
        sub: 'user123',
        aud: 'client-id',
        exp: 1640995200,
        iat: 1640991600,
        tenant: 'tenant1'
      };

      const valid = validate(claims);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should validate claims with optional fields', () => {
      const claims = {
        iss: 'https://keycloak.example.com/realms/test',
        sub: 'user123',
        aud: ['client-id', 'another-client'],
        exp: 1640995200,
        iat: 1640991600,
        nbf: 1640991600,
        jti: 'token-id-123',
        tenant: 'tenant1',
        scope: 'openid profile',
        roles: ['admin', 'user'],
        groups: ['group1', 'group2']
      };

      const valid = validate(claims);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });
  });

  describe('invalid claims', () => {
    it('should reject missing required iss', () => {
      const claims = {
        sub: 'user123',
        aud: 'client-id',
        exp: 1640995200,
        iat: 1640991600,
        tenant: 'tenant1'
      };

      const valid = validate(claims);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'iss' } })
      );
    });

    it('should reject negative exp', () => {
      const claims = {
        iss: 'https://keycloak.example.com/realms/test',
        sub: 'user123',
        aud: 'client-id',
        exp: -1,
        iat: 1640991600,
        tenant: 'tenant1'
      };

      const valid = validate(claims);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/exp', keyword: 'minimum' })
      );
    });

    it('should reject non-string tenant', () => {
      const claims = {
        iss: 'https://keycloak.example.com/realms/test',
        sub: 'user123',
        aud: 'client-id',
        exp: 1640995200,
        iat: 1640991600,
        tenant: 123
      };

      const valid = validate(claims);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/tenant', keyword: 'type' })
      );
    });
  });
});