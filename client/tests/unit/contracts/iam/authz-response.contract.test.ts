import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

describe('Authorization Response Contract', () => {
  let ajv: Ajv;
  let validate: any;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schemaPath = path.join(__dirname, '../../../../../../ops/docs/contracts/iam/authz-response.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
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
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'decision' } })
      );
    });

    it('should reject invalid decision value', () => {
      const response = {
        decision: 'maybe'
      };

      const valid = validate(response);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/decision', keyword: 'enum' })
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
        expect.objectContaining({ instancePath: '/reason', keyword: 'type' })
      );
    });
  });
});