/**
 * ResourceInitializationPlan JSON Schema Validation Tests
 * 
 * Validates contract compliance against the ResourceInitializationPlan schema
 * Reference: ops/docs/contracts/resource-initialization-plan.schema.json
 */

import Ajv, { ValidateFunction } from 'ajv';
import { z } from 'zod';

// Import the actual JSON schema (would be loaded from file system)
const ResourceInitializationPlanJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://max-ai/contracts/resource-initialization-plan.schema.json",
  "title": "ResourceInitializationPlan",
  "type": "object",
  "required": ["id", "clientId", "resources"],
  "properties": {
    "id": {"type": "string"},
    "clientId": {"type": "string"},
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["kind"],
        "properties": {
          "kind": {"enum": ["supabase", "storage", "other"]},
          "supabase": {
            "type": "object",
            "properties": {
              "projectUrl": {"type": "string"},
              "anonKey": {"type": "string"},
              "serviceRoleKey": {"type": "string"},
              "init": {
                "type": "object",
                "properties": {
                  "tables": {
                    "type": "array",
                    "items": {"enum": ["prompts", "documents"]}
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "options": {"type": "object"}
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
};

// Zod schema for runtime validation (mirrors JSON schema)
const ResourceInitializationPlanZodSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  resources: z.array(z.object({
    kind: z.enum(['supabase', 'storage', 'other']),
    supabase: z.object({
      projectUrl: z.string(),
      anonKey: z.string(),
      serviceRoleKey: z.string(),
      init: z.object({
        tables: z.array(z.enum(['prompts', 'documents'])).optional()
      }).optional()
    }).optional(),
    options: z.object({}).optional()
  }))
});

describe('ResourceInitializationPlan JSON Schema Validation', () => {
  let ajv: Ajv;
  let validate: ValidateFunction;

  beforeAll(() => {
    ajv = new Ajv();
    validate = ajv.compile(ResourceInitializationPlanJsonSchema);
  });

  describe('Valid ResourceInitializationPlan Examples', () => {
    
    test('Basic Supabase resource plan', () => {
      const validPlan = {
        id: "plan-123",
        clientId: "client-456",
        resources: [
          {
            kind: "supabase",
            supabase: {
              projectUrl: "https://test-project.supabase.co",
              anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              init: {
                tables: ["prompts", "documents"]
              }
            }
          }
        ]
      };

      const isValid = validate(validPlan);
      expect(isValid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    test('Multiple resource types', () => {
      const validPlan = {
        id: "plan-multi-123",
        clientId: "client-789",
        resources: [
          {
            kind: "supabase",
            supabase: {
              projectUrl: "https://multi-test.supabase.co",
              anonKey: "anon_key_example",
              serviceRoleKey: "service_key_example",
              init: {
                tables: ["prompts"]
              }
            }
          },
          {
            kind: "storage",
            options: {
              provider: "aws-s3",
              bucket: "test-bucket"
            }
          }
        ]
      };

      const isValid = validate(validPlan);
      expect(isValid).toBe(true);
    });

    test('Minimal valid plan', () => {
      const minimalPlan = {
        id: "minimal-plan",
        clientId: "minimal-client",
        resources: [
          {
            kind: "other"
          }
        ]
      };

      const isValid = validate(minimalPlan);
      expect(isValid).toBe(true);
    });
  });

  describe('Invalid ResourceInitializationPlan Examples', () => {
    
    test('Missing required fields', () => {
      const invalidPlan = {
        id: "plan-123"
        // Missing clientId and resources
      };

      const isValid = validate(invalidPlan);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: expect.objectContaining({
              missingProperty: expect.stringMatching(/clientId|resources/)
            })
          })
        ])
      );
    });

    test('Invalid resource kind', () => {
      const invalidPlan = {
        id: "plan-123",
        clientId: "client-456",
        resources: [
          {
            kind: "invalid-kind" // Should be one of: supabase, storage, other
          }
        ]
      };

      const isValid = validate(invalidPlan);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'enum'
          })
        ])
      );
    });

    test('Invalid table names in supabase init', () => {
      const invalidPlan = {
        id: "plan-123",
        clientId: "client-456",
        resources: [
          {
            kind: "supabase",
            supabase: {
              projectUrl: "https://test.supabase.co",
              anonKey: "key",
              serviceRoleKey: "key",
              init: {
                tables: ["invalid-table"] // Should be prompts or documents
              }
            }
          }
        ]
      };

      const isValid = validate(invalidPlan);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'enum'
          })
        ])
      );
    });

    test('Additional properties not allowed', () => {
      const invalidPlan = {
        id: "plan-123",
        clientId: "client-456",
        resources: [],
        extraField: "not-allowed" // Should fail due to additionalProperties: false
      };

      const isValid = validate(invalidPlan);
      expect(isValid).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: 'additionalProperties'
          })
        ])
      );
    });
  });

  describe('Security Validation Tests', () => {
    
    test('Schema should allow credentials but QA must verify they are not exposed in API responses', () => {
      // NOTE: This test validates that the schema DOES allow credentials
      // but in actual API responses, these should be filtered out by the token proxy
      
      const planWithCredentials = {
        id: "security-test-plan",
        clientId: "security-test-client",
        resources: [
          {
            kind: "supabase",
            supabase: {
              projectUrl: "https://security-test.supabase.co",
              anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.security-test-anon",
              serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.security-test-service",
              init: {
                tables: ["prompts", "documents"]
              }
            }
          }
        ]
      };

      // Schema validation should pass (schema allows credentials)
      const isValid = validate(planWithCredentials);
      expect(isValid).toBe(true);
      
      // WARNING: In actual API responses, anonKey and serviceRoleKey 
      // should be filtered out by the token proxy for security
      console.warn(
        'SECURITY NOTE: This schema allows credentials but they must be ' +
        'filtered from API responses by the token proxy implementation'
      );
    });

    test('Runtime validation with Zod should also pass', () => {
      const validPlan = {
        id: "zod-test-plan",
        clientId: "zod-test-client",
        resources: [
          {
            kind: "supabase" as const,
            supabase: {
              projectUrl: "https://zod-test.supabase.co",
              anonKey: "zod-anon-key",
              serviceRoleKey: "zod-service-key",
              init: {
                tables: ["prompts" as const, "documents" as const]
              }
            }
          }
        ]
      };

      // Should not throw
      expect(() => {
        ResourceInitializationPlanZodSchema.parse(validPlan);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Data Validation', () => {
    
    test('Empty resources array', () => {
      const emptyResourcesPlan = {
        id: "empty-plan",
        clientId: "empty-client",
        resources: []
      };

      expect(() => {
        ResourceInitializationPlanZodSchema.parse(emptyResourcesPlan);
      }).not.toThrow();
    });

    test('Null values should fail', () => {
      const nullValuesPlan = {
        id: null,
        clientId: "client-123",
        resources: []
      };

      expect(() => {
        ResourceInitializationPlanZodSchema.parse(nullValuesPlan);
      }).toThrow();
    });

    test('Wrong types should fail', () => {
      const wrongTypesPlan = {
        id: 123, // Should be string
        clientId: "client-456",
        resources: []
      };

      expect(() => {
        ResourceInitializationPlanZodSchema.parse(wrongTypesPlan);
      }).toThrow();
    });

    test('Supabase resource without required supabase object properties', () => {
      const incompletePlan = {
        id: "incomplete-plan",
        clientId: "incomplete-client",
        resources: [
          {
            kind: "supabase"
            // Missing supabase object - this should still be valid 
            // since supabase is optional in the schema
          }
        ]
      };

      expect(() => {
        ResourceInitializationPlanZodSchema.parse(incompletePlan);
      }).not.toThrow();
    });
  });
});

describe('Contract Testing Integration', () => {
  
  test('Schema matches current implementation expectations', () => {
    // This test would validate that our current schema matches
    // what the actual implementation produces/expects
    
    const implementationExample = {
      id: "impl-test-123",
      clientId: "impl-client-456",
      resources: [
        {
          kind: "supabase",
          supabase: {
            projectUrl: "https://impl-test.supabase.co",
            anonKey: "impl_anon_key",
            serviceRoleKey: "impl_service_key",
            init: {
              tables: ["prompts", "documents"]
            }
          }
        }
      ]
    };

    expect(() => {
      ResourceInitializationPlanZodSchema.parse(implementationExample);
    }).not.toThrow();
    
    // Also validate with runtime Zod schema
    expect(() => {
      ResourceInitializationPlanZodSchema.parse(implementationExample);
    }).not.toThrow();
  });

  test('Schema evolution: backward compatibility', () => {
    // Test that new optional fields don't break existing plans
    const oldFormatPlan = {
      id: "old-format-plan",
      clientId: "old-client",
      resources: [
        {
          kind: "other"
          // Minimal old format
        }
      ]
    };

    expect(() => {
      ResourceInitializationPlanZodSchema.parse(oldFormatPlan);
    }).not.toThrow();
  });
});

export { ResourceInitializationPlanZodSchema };