import { z } from 'zod';
/**
 * ResourceInitializationPlan Zod Schema
 * Matches the JSON schema specification for resource initialization
 */
export declare const ResourceInitializationPlanSchema: z.ZodObject<{
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
        storage: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            bucket: z.ZodString;
            region: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ResourceInitializationPlan = z.infer<typeof ResourceInitializationPlanSchema>;
//# sourceMappingURL=resource-initialization-plan.d.ts.map