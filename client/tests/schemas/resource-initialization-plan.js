"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceInitializationPlanSchema = void 0;
const zod_1 = require("zod");
/**
 * ResourceInitializationPlan Zod Schema
 * Matches the JSON schema specification for resource initialization
 */
exports.ResourceInitializationPlanSchema = zod_1.z.object({
    id: zod_1.z.string(),
    clientId: zod_1.z.string(),
    resources: zod_1.z.array(zod_1.z.object({
        kind: zod_1.z.enum(['supabase', 'storage', 'other']),
        supabase: zod_1.z.object({
            projectUrl: zod_1.z.string().url(),
            anonKey: zod_1.z.string(),
            serviceRoleKey: zod_1.z.string(),
            init: zod_1.z.object({
                tables: zod_1.z.array(zod_1.z.enum(['prompts', 'documents'])).optional()
            }).optional()
        }).optional(),
        storage: zod_1.z.object({
            provider: zod_1.z.string(),
            bucket: zod_1.z.string(),
            region: zod_1.z.string().optional()
        }).optional(),
        options: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional()
    }))
});
//# sourceMappingURL=resource-initialization-plan.js.map