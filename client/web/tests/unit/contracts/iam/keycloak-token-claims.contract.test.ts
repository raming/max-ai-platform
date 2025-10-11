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
      expectErrorWithPath('', 'required', { missingProperty: 'iss' });
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
      expectErrorWithPath('/exp', 'minimum');
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
      expectErrorWithPath('/tenant', 'type');
    });
  });
});