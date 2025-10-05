import { z } from 'zod';

/**
 * ResourceInitializationPlan Zod Schema
 * Matches the JSON schema specification for resource initialization
 */
export const ResourceInitializationPlanSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  resources: z.array(z.object({
    kind: z.enum(['supabase', 'storage', 'other']),
    supabase: z.object({
      projectUrl: z.string().url(),
      anonKey: z.string(),
      serviceRoleKey: z.string(),
      init: z.object({
        tables: z.array(z.enum(['prompts', 'documents'])).optional()
      }).optional()
    }).optional(),
    storage: z.object({
      provider: z.string(),
      bucket: z.string(),
      region: z.string().optional()
    }).optional(),
    options: z.record(z.string(), z.unknown()).optional()
  }))
});

export type ResourceInitializationPlan = z.infer<typeof ResourceInitializationPlanSchema>;