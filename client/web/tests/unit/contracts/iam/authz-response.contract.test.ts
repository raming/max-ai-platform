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
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ dataPath: '', keyword: 'required', params: { missingProperty: 'decision' } })
      );
    });

    it('should reject invalid decision value', () => {
      const response = {
        decision: 'maybe'
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ dataPath: '.decision', keyword: 'enum' })
      );
    });

    it('should reject non-string reason', () => {
      const response = {
        decision: 'deny',
        reason: 123
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ dataPath: '.reason', keyword: 'type' })
      );
    });
  });
});