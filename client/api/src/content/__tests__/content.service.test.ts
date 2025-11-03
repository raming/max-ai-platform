/**
 * ContentService Unit Tests
 * Tests for business logic: CRUD, validation, permission checks, sanitization, export
 *
 * Coverage Target: 95%+
 */

import { ContentService } from '../services/content.service';
import { ValidationError, ForbiddenError, NotFoundError, PayloadTooLargeError } from '../ports/content.service';
import { IContentRepository } from '../ports/content.repository';
import { ISanitizer } from '../ports/sanitizer';
import { IExporter } from '../ports/exporter';
import { ContentRow, ContentVersionRow } from '../../types/content';

// Mock implementations
const mockRepository: jest.Mocked<IContentRepository> = {
  save: jest.fn(),
  load: jest.fn(),
  loadByOwner: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  exists: jest.fn(),
  isOwner: jest.fn(),
  listByUser: jest.fn(),
  saveVersion: jest.fn(),
  getVersions: jest.fn(),
  getVersion: jest.fn(),
  getVersionCount: jest.fn(),
  versionExists: jest.fn(),
};

const mockSanitizer: jest.Mocked<ISanitizer> = {
  sanitize: jest.fn(),
  hasXssPattens: jest.fn(),
  getStatistics: jest.fn(),
};

const mockExporter: jest.Mocked<IExporter> = {
  export: jest.fn(),
  exportAsJson: jest.fn(),
  htmlToMarkdown: jest.fn(),
  htmlToText: jest.fn(),
  estimateSize: jest.fn(),
  getMimeType: jest.fn(),
  getFileExtension: jest.fn(),
};

describe('ContentService', () => {
  let service: ContentService;
  const userId = 'user-123';
  const contentId = 'content-456';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentService(mockRepository, mockSanitizer, mockExporter);
  });

  describe('createContent', () => {
    it('should create content with sanitization', async () => {
      const input = {
        title: 'Test Content',
        content: '<p>Hello <script>alert("xss")</script></p>',
        contentType: 'text/html',
      };

      const sanitizedContent = '<p>Hello </p>';
      mockSanitizer.sanitize.mockReturnValue({
        content: sanitizedContent,
        inputLength: input.content.length,
        outputLength: sanitizedContent.length,
        tagsRemovedCount: 1,
        tagsRemovedTypes: ['script'],
      });

      const mockRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: input.title,
        content: input.content,
        sanitized_content: sanitizedContent,
        content_type: input.contentType,
        version: 1,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.save.mockResolvedValue(mockRow);
      mockRepository.saveVersion.mockResolvedValue({
        id: 'version-1',
        content_id: contentId,
        version: 1,
        content: input.content,
        change_message: 'Initial version',
        created_by: userId,
        created_at: new Date(),
      });

      const result = await service.createContent(userId, input);

      expect(result.id).toBe(contentId);
      expect(result.title).toBe(input.title);
      expect(mockSanitizer.sanitize).toHaveBeenCalledWith(input.content);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.saveVersion).toHaveBeenCalled();
    });

    it('should reject content exceeding 1MB', async () => {
      const largeContent = 'x'.repeat(1_000_001);
      const input = {
        title: 'Large Content',
        content: largeContent,
      };

      await expect(service.createContent(userId, input)).rejects.toThrow(PayloadTooLargeError);
    });

    it('should reject empty title', async () => {
      const input = {
        title: '',
        content: '<p>Content</p>',
      };

      await expect(service.createContent(userId, input)).rejects.toThrow(ValidationError);
    });

    it('should reject title exceeding 255 characters', async () => {
      const input = {
        title: 'x'.repeat(256),
        content: '<p>Content</p>',
      };

      await expect(service.createContent(userId, input)).rejects.toThrow(ValidationError);
    });
  });

  describe('getContent', () => {
    it('should retrieve content by ID with ownership check', async () => {
      const mockRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: 'Test',
        content: '<p>Content</p>',
        sanitized_content: '<p>Content</p>',
        content_type: 'text/html',
        version: 1,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.loadByOwner.mockResolvedValue(mockRow);

      const result = await service.getContent(userId, contentId);

      expect(result.id).toBe(contentId);
      expect(mockRepository.loadByOwner).toHaveBeenCalledWith(contentId, userId);
    });

    it('should throw ForbiddenError if user does not own content', async () => {
      mockRepository.loadByOwner.mockResolvedValue(null);
      mockRepository.exists.mockResolvedValue(true);

      await expect(service.getContent(userId, contentId)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if content does not exist', async () => {
      mockRepository.loadByOwner.mockResolvedValue(null);
      mockRepository.exists.mockResolvedValue(false);

      await expect(service.getContent(userId, contentId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if content is soft deleted', async () => {
      const mockRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: 'Test',
        content: '<p>Content</p>',
        sanitized_content: '<p>Content</p>',
        content_type: 'text/html',
        version: 1,
        deleted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.loadByOwner.mockResolvedValue(mockRow);

      await expect(service.getContent(userId, contentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateContent', () => {
    it('should update content and create new version', async () => {
      const input = {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
      };

      const oldRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: 'Old Title',
        content: '<p>Old content</p>',
        sanitized_content: '<p>Old content</p>',
        content_type: 'text/html',
        version: 1,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedRow: ContentRow = {
        ...oldRow,
        title: input.title,
        content: input.content,
        version: 2,
        updated_at: new Date(),
      };

      mockRepository.loadByOwner.mockResolvedValue(oldRow);
      mockSanitizer.sanitize.mockReturnValue({
        content: input.content,
        inputLength: input.content.length,
        outputLength: input.content.length,
        tagsRemovedCount: 0,
        tagsRemovedTypes: [],
      });
      mockRepository.update.mockResolvedValue(updatedRow);
      mockRepository.saveVersion.mockResolvedValue({
        id: 'version-2',
        content_id: contentId,
        version: 2,
        content: input.content,
        change_message: 'Updated to version 2',
        created_by: userId,
        created_at: new Date(),
      });

      const result = await service.updateContent(userId, contentId, input);

      expect(result.version).toBe(2);
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockRepository.saveVersion).toHaveBeenCalled();
    });

    it('should enforce permission checks on update', async () => {
      mockRepository.loadByOwner.mockResolvedValue(null);
      mockRepository.exists.mockResolvedValue(true);

      await expect(
        service.updateContent(userId, contentId, {
          content: '<p>New</p>',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteContent', () => {
    it('should soft delete content', async () => {
      mockRepository.isOwner.mockResolvedValue(true);

      await service.deleteContent(userId, contentId);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(contentId);
    });

    it('should enforce permission checks on delete', async () => {
      mockRepository.isOwner.mockResolvedValue(false);
      mockRepository.exists.mockResolvedValue(true);

      await expect(service.deleteContent(userId, contentId)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if content does not exist', async () => {
      mockRepository.isOwner.mockResolvedValue(false);
      mockRepository.exists.mockResolvedValue(false);

      await expect(service.deleteContent(userId, contentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('listContent', () => {
    it('should list user content with pagination', async () => {
      const mockItems = [
        {
          id: 'content-1',
          userId,
          title: 'Content 1',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentType: 'text/html',
          characterCount: 100,
          wordCount: 20,
        },
      ];

      mockRepository.listByUser.mockResolvedValue({
        items: mockItems,
        total: 1,
        limit: 50,
        offset: 0,
      });

      const result = await service.listContent(userId, { limit: 50, offset: 0 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockRepository.listByUser).toHaveBeenCalledWith(userId, expect.any(Object));
    });

    it('should enforce pagination limits', async () => {
      mockRepository.listByUser.mockResolvedValue({
        items: [],
        total: 0,
        limit: 100,
        offset: 0,
      });

      // Limit exceeding 100 should throw ValidationError
      await expect(service.listContent(userId, { limit: 200 })).rejects.toThrow(ValidationError);
    });
  });

  describe('exportContent', () => {
    it('should export content in requested format', async () => {
      const mockRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: 'Export Test',
        content: '<p>Content</p>',
        sanitized_content: '<p>Content</p>',
        content_type: 'text/html',
        version: 1,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.loadByOwner.mockResolvedValue(mockRow);
      mockExporter.export.mockResolvedValue(Buffer.from('<p>Content</p>'));
      mockExporter.getMimeType.mockReturnValue('text/html');
      mockExporter.getFileExtension.mockReturnValue('.html');

      const result = await service.exportContent(userId, contentId, 'html');

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('export-test');
      expect(result.mimeType).toBe('text/html');
      expect(mockExporter.export).toHaveBeenCalledWith(mockRow.sanitized_content, 'html');
    });

    it('should enforce permission checks on export', async () => {
      mockRepository.loadByOwner.mockResolvedValue(null);
      mockRepository.exists.mockResolvedValue(true);

      await expect(service.exportContent(userId, contentId, 'html')).rejects.toThrow(ForbiddenError);
    });

    it('should support multiple export formats', async () => {
      const mockRow: ContentRow = {
        id: contentId,
        user_id: userId,
        title: 'Test',
        content: '<p>Content</p>',
        sanitized_content: '<p>Content</p>',
        content_type: 'text/html',
        version: 1,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.loadByOwner.mockResolvedValue(mockRow);
      mockExporter.export.mockResolvedValue(Buffer.from('content'));
      mockExporter.getMimeType.mockReturnValue('text/plain');
      mockExporter.getFileExtension.mockReturnValue('.txt');

      const formats: Array<'html' | 'markdown' | 'json' | 'text'> = ['html', 'markdown', 'json', 'text'];

      for (const format of formats) {
        await service.exportContent(userId, contentId, format);
        expect(mockExporter.export).toHaveBeenCalledWith(mockRow.sanitized_content, format);
      }
    });
  });

  describe('getVersions', () => {
    it('should retrieve version history with permission check', async () => {
      const mockVersions: ContentVersionRow[] = [
        {
          id: 'v1',
          content_id: contentId,
          version: 2,
          content: '<p>Version 2</p>',
          change_message: 'Updated',
          created_by: userId,
          created_at: new Date(),
        },
        {
          id: 'v2',
          content_id: contentId,
          version: 1,
          content: '<p>Version 1</p>',
          change_message: 'Initial',
          created_by: userId,
          created_at: new Date(),
        },
      ];

      mockRepository.isOwner.mockResolvedValue(true);
      mockRepository.getVersions.mockResolvedValue(mockVersions);

      const result = await service.getVersions(userId, contentId);

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
      expect(mockRepository.getVersions).toHaveBeenCalledWith(contentId);
    });

    it('should enforce permission checks on getVersions', async () => {
      mockRepository.isOwner.mockResolvedValue(false);
      mockRepository.exists.mockResolvedValue(true);

      await expect(service.getVersions(userId, contentId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate content statistics', () => {
      const content = '<p>Hello world. This is a test.</p>';
      const stats = service.calculateStatistics(content);

      expect(stats.characterCount).toBeGreaterThan(0);
      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.paragraphCount).toBeGreaterThan(0);
      expect(stats.estimatedReadingTimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty content', () => {
      const stats = service.calculateStatistics('');

      expect(stats.characterCount).toBe(0);
      expect(stats.wordCount).toBe(0);
      expect(stats.estimatedReadingTimeSeconds).toBe(0);
    });

    it('should strip HTML tags for statistics', () => {
      const content = '<p>Hello</p><p>World</p>';
      const stats = service.calculateStatistics(content);

      expect(stats.wordCount).toBe(2);
      expect(stats.paragraphCount).toBeGreaterThan(0);
    });
  });

  describe('validateContent', () => {
    it('should validate content constraints', () => {
      const validInput = {
        title: 'Valid Title',
        content: '<p>Valid content</p>',
      };

      expect(() => service.validateContent(validInput)).not.toThrow();
    });

    it('should reject content exceeding size limit', () => {
      const input = {
        title: 'Title',
        content: 'x'.repeat(1_000_001),
      };

      expect(() => service.validateContent(input)).toThrow(PayloadTooLargeError);
    });

    it('should reject empty title', () => {
      const input = {
        title: '',
        content: '<p>Content</p>',
      };

      expect(() => service.validateContent(input)).toThrow(ValidationError);
    });

    it('should reject title exceeding max length', () => {
      const input = {
        title: 'x'.repeat(256),
        content: '<p>Content</p>',
      };

      expect(() => service.validateContent(input)).toThrow(ValidationError);
    });

    it('should reject change message exceeding max length', () => {
      const input = {
        title: 'Title',
        content: '<p>Content</p>',
        changeMessage: 'x'.repeat(501),
      };

      expect(() => service.validateContent(input)).toThrow(ValidationError);
    });
  });
});
