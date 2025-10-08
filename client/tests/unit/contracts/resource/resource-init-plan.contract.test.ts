import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

describe('Resource Initialization Plan Contract', () => {
  let ajv: Ajv;
  let validate: any;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schemaPath = path.join(__dirname, '../../../../../../ops/docs/contracts/resource-initialization-plan.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    validate = ajv.compile(schema);
  });

  describe('valid plans', () => {
    it('should validate minimal required plan', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [
          {
            kind: 'supabase'
          }
        ]
      };

      const valid = validate(plan);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should validate complete Supabase plan', () => {
      const plan = {
        id: 'rip_acme_auto_sales_2025_10_05',
        clientId: 'client_acme_auto_sales',
        resources: [
          {
            kind: 'supabase',
            supabase: {
              projectUrl: 'https://test.supabase.co',
              anonKey: 'anon_key_here',
              serviceRoleKey: 'service_key_here',
              init: {
                tables: ['prompts', 'documents']
              }
            },
            options: {
              notes: 'Test initialization'
            }
          }
        ]
      };

      const valid = validate(plan);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });
  });

  describe('invalid plans', () => {
    it('should reject missing id', () => {
      const plan = {
        clientId: 'client_test',
        resources: [{ kind: 'supabase' }]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'id' } })
      );
    });

    it('should reject missing clientId', () => {
      const plan = {
        id: 'rip_test_001',
        resources: [{ kind: 'supabase' }]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'clientId' } })
      );
    });

    it('should reject missing resources', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test'
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '', keyword: 'required', params: { missingProperty: 'resources' } })
      );
    });

    it('should reject resource without kind', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [{}]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/resources/0', keyword: 'required', params: { missingProperty: 'kind' } })
      );
    });

    it('should reject invalid resource kind', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [{ kind: 'invalid' }]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/resources/0/kind', keyword: 'enum' })
      );
    });

    it('should reject supabase config with extra properties', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [
          {
            kind: 'supabase',
            supabase: {
              projectUrl: 'https://test.supabase.co',
              extraProperty: 'not allowed'
            }
          }
        ]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({ instancePath: '/resources/0/supabase', keyword: 'additionalProperties' })
      );
    });
  });
});