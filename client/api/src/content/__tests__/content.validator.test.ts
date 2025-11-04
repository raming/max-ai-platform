/**
 * Content Validator Unit Tests
 * Tests for Zod schema validation
 *
 * Coverage Target: 95%+
 */

import {
  CreateContentSchema,
  UpdateContentSchema,
  ExportContentSchema,
  ListContentSchema,
  validateInput,
  CreateContentInput,
} from '../validators/content.validator';
import { ValidationError } from '../ports/content.service';

describe('Content Validators', () => {
  describe('CreateContentSchema', () => {
    it('should validate valid create request', () => {
      const input = {
        title: 'Test Content',
        content: '<p>Hello World</p>',
        contentType: 'text/html',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Content');
        expect(result.data.content).toBe('<p>Hello World</p>');
      }
    });

    it('should reject empty title', () => {
      const input = {
        title: '',
        content: '<p>Content</p>',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const input = {
        title: 'x'.repeat(256),
        content: '<p>Content</p>',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const input = {
        title: 'Title',
        content: '',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 1MB', () => {
      const input = {
        title: 'Title',
        content: 'x'.repeat(1_000_001),
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept optional contentType', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept optional changeMessage', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
        changeMessage: 'Initial version',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject changeMessage exceeding 500 characters', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
        changeMessage: 'x'.repeat(501),
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const input = {
        title: 'Title',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject invalid content type', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
        contentType: 'invalid/type',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateContentSchema', () => {
    it('should validate valid update request with title', () => {
      const input = {
        title: 'Updated Title',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate valid update request with content', () => {
      const input = {
        content: '<p>Updated content</p>',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate update with both title and content', () => {
      const input = {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const input = {
        title: '',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 255 characters', () => {
      const input = {
        title: 'x'.repeat(256),
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const input = {
        content: '',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 1MB', () => {
      const input = {
        content: 'x'.repeat(1_000_001),
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept optional changeMessage', () => {
      const input = {
        content: '<p>Updated</p>',
        changeMessage: 'Updated content',
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject changeMessage exceeding 500 characters', () => {
      const input = {
        content: '<p>Updated</p>',
        changeMessage: 'x'.repeat(501),
      };

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty update (no fields)', () => {
      const input = {};

      const result = UpdateContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('ExportContentSchema', () => {
    it('should validate HTML format', () => {
      const input = {
        format: 'html',
      };

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate markdown format', () => {
      const input = {
        format: 'markdown',
      };

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate json format', () => {
      const input = {
        format: 'json',
      };

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate text format', () => {
      const input = {
        format: 'text',
      };

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid format', () => {
      const input = {
        format: 'pdf',
      };

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing format', () => {
      const input = {};

      const result = ExportContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('ListContentSchema', () => {
    it('should validate with default pagination', () => {
      const input = {};

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with custom limit', () => {
      const input = {
        limit: 50,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with custom offset', () => {
      const input = {
        offset: 100,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with sortBy', () => {
      const input = {
        sortBy: 'created_at',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with order', () => {
      const input = {
        order: 'asc',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate with all parameters', () => {
      const input = {
        limit: 50,
        offset: 100,
        sortBy: 'updated_at',
        order: 'desc',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject limit exceeding 100', () => {
      const input = {
        limit: 101,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const input = {
        limit: -1,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const input = {
        offset: -1,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject invalid sortBy', () => {
      const input = {
        sortBy: 'invalid_field',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject invalid order', () => {
      const input = {
        order: 'invalid',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('validateInput', () => {
    it('should validate and return data on success', () => {
      const input = {
        title: 'Test',
        content: '<p>Content</p>',
      };

      const result = validateInput(CreateContentSchema, input) as CreateContentInput;

      expect(result.title).toBe('Test');
      expect(result.content).toBe('<p>Content</p>');
    });

    it('should throw ValidationError on failure', () => {
      const input = {
        title: '',
        content: '<p>Content</p>',
      };

      expect(() => validateInput(CreateContentSchema, input)).toThrow(ValidationError);
    });

    it('should include error details in ValidationError', () => {
      const input = {
        title: '',
        content: '<p>Content</p>',
      };

      try {
        validateInput(CreateContentSchema, input);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.field).toBeDefined();
          expect(error.details).toBeDefined();
        }
      }
    });
  });

  describe('Boundary Tests', () => {
    it('should accept title with exactly 255 characters', () => {
      const input = {
        title: 'x'.repeat(255),
        content: '<p>Content</p>',
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept content with exactly 1MB', () => {
      const input = {
        title: 'Title',
        content: 'x'.repeat(1_000_000),
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept changeMessage with exactly 500 characters', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
        changeMessage: 'x'.repeat(500),
      };

      const result = CreateContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept limit with exactly 100', () => {
      const input = {
        limit: 100,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept limit with exactly 1', () => {
      const input = {
        limit: 1,
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Type Coercion', () => {
    it('should coerce string limit to number', () => {
      const input = {
        limit: '50',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should coerce string offset to number', () => {
      const input = {
        offset: '100',
      };

      const result = ListContentSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.offset).toBe('number');
      }
    });
  });
});
