import Ajv, { type ValidateFunction } from 'ajv';
import { getKeycloakTokenClaimsSchema } from '../../../../lib/contract-validation';

describe('Keycloak Token Claims Contract', () => {
  let ajv: Ajv;
  let validate: ValidateFunction;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schema = getKeycloakTokenClaimsSchema();
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
        expect.objectContaining({ dataPath: '', keyword: 'required', params: { missingProperty: 'iss' } })
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
        expect.objectContaining({ dataPath: '.exp', keyword: 'minimum' })
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
        expect.objectContaining({ dataPath: '.tenant', keyword: 'type' })
      );
    });
  });
});