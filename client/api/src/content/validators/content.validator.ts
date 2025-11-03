/**
 * Content Validation Schemas
 * Zod runtime validation for all request payloads.
 *
 * References: DEV-UI-08 specification (Section 5.2)
 */

import { z } from 'zod';
import { CONTENT_CONSTRAINTS } from '../../types/content';
import { ValidationError } from '../ports/content.service';

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
 * Validates: title (optional), content (optional), contentType (optional)
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
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH, `Content cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH} characters (1MB)`)
    .optional(),

  contentType: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH, `Content type cannot exceed ${CONTENT_CONSTRAINTS.MAX_CONTENT_TYPE_LENGTH} characters`)
    .optional(),

  changeMessage: z
    .string()
    .max(CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH, `Change message cannot exceed ${CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH} characters`)
    .optional(),
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  { message: 'At least one of title or content must be provided' }
);

export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

/**
 * Export Content Request Schema
 * Validates: format (html|markdown|json|text), includeMetadata (optional)
 */
export const ExportContentSchema = z.object({
  format: z.enum(['html', 'markdown', 'json', 'text'], {
    errorMap: () => ({ message: 'Format must be one of: html, markdown, json, text' }),
  }),

  includeMetadata: z.boolean().optional().default(false),
});

export type ExportContentInput = z.infer<typeof ExportContentSchema>;

/**
 * List Content Query Schema
 * Validates: limit (1-100), offset (≥0), sortBy, order
 */
export const ListContentSchema = z.object({
  limit: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50)
    .optional(),

  offset: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number())
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0)
    .optional(),

  sortBy: z
    .enum(['created_at', 'updated_at', 'title'], {
      errorMap: () => ({ message: 'sortBy must be one of: created_at, updated_at, title' }),
    })
    .default('updated_at')
    .optional(),

  order: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'order must be one of: asc, desc' }),
    })
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
    let firstField = '';

    result.error.issues.forEach((err, index) => {
      const path = err.path.join('.');
      errors[path] = err.message;
      if (index === 0) firstField = path;
    });

    throw new ValidationError(firstField, errors, 'Validation failed');
  }

  return result.data;
}
