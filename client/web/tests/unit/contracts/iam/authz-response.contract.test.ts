import Ajv, { type ValidateFunction } from 'ajv';
import { getAuthzResponseSchema } from '../../../../lib/contract-validation';

describe('Authorization Response Contract', () => {
  let ajv: Ajv;
  let validate: ValidateFunction;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schema = getAuthzResponseSchema();
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

  describe('valid responses', () => {
    it('should validate allow response', () => {
      const response = {
        decision: 'allow'
      };

      const valid = validate(response);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should validate deny response with reason', () => {
      const response = {
        decision: 'deny',
        reason: 'insufficient_permissions',
        policyRef: 'policy-123'
      };

      const valid = validate(response);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should validate response with obligations', () => {
      const response = {
        decision: 'allow',
        obligations: {
          logAccess: true,
          notifyAdmin: false
        }
      };

      const valid = validate(response);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });
  });

  describe('invalid responses', () => {
    it('should reject missing decision', () => {
      const response = {
        reason: 'test'
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expectErrorWithPath('', 'required', { missingProperty: 'decision' });
    });

    it('should reject invalid decision value', () => {
      const response = {
        decision: 'maybe'
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expectErrorWithPath('/decision', 'enum');
    });

    it('should reject non-string reason', () => {
      const response = {
        decision: 'deny',
        reason: 123
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expectErrorWithPath('/reason', 'type');
    });
  });
});