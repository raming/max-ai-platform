import Ajv, { type ValidateFunction } from 'ajv';
import { getResourceInitSchema } from '../../../../lib/contract-validation';

describe('Resource Initialization Plan Contract', () => {
  let ajv: Ajv;
  let validate: ValidateFunction;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    const schema = getResourceInitSchema();
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
      expectErrorWithPath('', 'required', { missingProperty: 'id' });
    });

    it('should reject missing clientId', () => {
      const plan = {
        id: 'rip_test_001',
        resources: [{ kind: 'supabase' }]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expectErrorWithPath('', 'required', { missingProperty: 'clientId' });
    });

    it('should reject missing resources', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test'
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expectErrorWithPath('', 'required', { missingProperty: 'resources' });
    });

    it('should reject resource without kind', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [{}]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expectErrorWithPath('/resources/0', 'required', { missingProperty: 'kind' });
    });

    it('should reject invalid resource kind', () => {
      const plan = {
        id: 'rip_test_001',
        clientId: 'client_test',
        resources: [{ kind: 'invalid' }]
      };

      const valid = validate(plan);
      expect(valid).toBe(false);
      expectErrorWithPath('/resources/0/kind', 'enum');
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
      expectErrorWithPath('/resources/0/supabase', 'additionalProperties');
    });
  });
});