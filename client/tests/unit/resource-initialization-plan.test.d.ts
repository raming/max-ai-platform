/**
 * ResourceInitializationPlan JSON Schema Validation Tests
 *
 * Validates contract compliance against the ResourceInitializationPlan schema
 * Reference: ops/docs/contracts/resource-initialization-plan.schema.json
 */
import { z } from 'zod';
declare const ResourceInitializationPlanZodSchema: z.ZodObject<{
    id: z.ZodString;
    clientId: z.ZodString;
    resources: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            supabase: "supabase";
            storage: "storage";
            other: "other";
        }>;
        supabase: z.ZodOptional<z.ZodObject<{
            projectUrl: z.ZodString;
            anonKey: z.ZodString;
            serviceRoleKey: z.ZodString;
            init: z.ZodOptional<z.ZodObject<{
                tables: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                    prompts: "prompts";
                    documents: "documents";
                }>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        options: z.ZodOptional<z.ZodObject<{}, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export { ResourceInitializationPlanZodSchema };
//# sourceMappingURL=resource-initialization-plan.test.d.ts.map