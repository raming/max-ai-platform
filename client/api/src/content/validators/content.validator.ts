/**
 * Content Validation Schemas
 * Zod runtime validation for all request payloads.
 *
 * References: DEV-UI-08 specification (Section 5.2)
 */

import { z } from 'zod';
import { CONTENT_CONSTRAINTS } from '../../types/content';

/**
 * Create Content Request Schema
 * Validates: title (1-255 chars), content (max 1MB), contentType
 */
export const CreateContentSchema = z.object({
  title: z
    .string()
    .min(CONTENT_CONSTRAINTS.MIN_TITLE_LENGTH, 'Title cannot be empty')
    .max(CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH, `Title cannot exceed ${CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH} characters`)
    .trim(),

  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH, `Content cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH} characters (1MB)`),

  contentType: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH, `Content type cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH} characters`)
    .default('text/html')
    .optional(),

  changeMessage: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH, `Change message cannot exceed ${CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH} characters`)
    .optional(),
});

export type CreateContentInput = z.infer<typeof CreateContentSchema>;

/**
 * Update Content Request Schema
 * Validates: title (optional), content (required, max 1MB), contentType (optional)
 */
export const UpdateContentSchema = z.object({
  title: z
    .string()
    .min(CONTENT_CONSTRAINTS.MIN_TITLE_LENGTH, 'Title cannot be empty')
    .max(CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH, `Title cannot exceed ${CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH} characters`)
    .trim()
    .optional(),

  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH, `Content cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH} characters (1MB)`),

  contentType: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH, `Content type cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH} characters`)
    .optional(),

  changeMessage: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH, `Change message cannot exceed ${CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH} characters`)
    .optional(),
});

export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

/**
 * Export Content Request Schema
 * Validates: format (html|markdown|json|text), includeMetadata (optional)
 */
export const ExportContentSchema = z.object({
  format: z
    .enum(['html', 'markdown', 'json', 'text'])
    .catch('html'),

  includeMetadata: z.boolean().optional().default(false),
});

export type ExportContentInput = z.infer<typeof ExportContentSchema>;

/**
 * List Content Query Schema
 * Validates: limit (1-100), offset (≥0), sortBy, order
 */
export const ListContentSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50)
    .optional(),

  offset: z
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0)
    .optional(),

  sortBy: z
    .enum(['created_at', 'updated_at', 'title'])
    .default('updated_at')
    .optional(),

  order: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional(),
});

export type ListContentInput = z.infer<typeof ListContentSchema>;

/**
 * Get Version Query Schema
 * Validates: version number (≥1)
 */
export const GetVersionSchema = z.object({
  version: z
    .number()
    .int()
    .min(1, 'Version must be at least 1'),
});

export type GetVersionInput = z.infer<typeof GetVersionSchema>;

/**
 * Validation helper function
 * Validates input against schema and throws ValidationError on failure.
 *
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, unknown> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });

    const error = new Error('Validation failed');
    (error as any).code = 'VALIDATION_ERROR';
    (error as any).details = errors;
    throw error;
  }

  return result.data;
}
