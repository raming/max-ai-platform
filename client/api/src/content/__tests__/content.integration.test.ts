/**
 * Content Module Integration Tests
 * Test suite for content service, repository, and adapters.
 *
 * References: DEV-UI-08 specification
 */

// Mock DOMPurify before importing the sanitizer
jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: (html: string) => {
      // Simple mock sanitizer that removes <script> tags
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    },
    setConfig: jest.fn(),
  },
}));

import { ContentService } from '../services/content.service';
import { DOMPurifyAdapter } from '../services/sanitizer.adapter';
import { MultiFormatExporter } from '../services/exporter.adapter';
import { IContentRepository, ListOptions } from '../ports/content.repository';
import { ISanitizer } from '../ports/sanitizer';
import { IExporter } from '../ports/exporter';
import { CreateContentSchema, UpdateContentSchema, ExportContentSchema } from '../validators/content.validator';
import type { ContentRow, ContentVersionRow, PaginatedResponse, ContentListItemDTO } from '../../types/content';

// Mock implementations for testing
class MockContentRepository implements IContentRepository {
  private contents: Map<string, ContentRow> = new Map();
  private versions: Map<string, ContentVersionRow[]> = new Map();
  private idCounter = 0;

  async save(userId: string, data: Omit<ContentRow, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ContentRow> {
    const id = `content-${++this.idCounter}`;
    const now = new Date();
    const row: ContentRow = {
      id,
      user_id: userId,
      title: data.title,
      content: data.content,
      sanitized_content: data.sanitized_content,
      content_type: data.content_type,
      version: 1,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    this.contents.set(id, row);
    return row;
  }

  async load(contentId: string): Promise<ContentRow | null> {
    return this.contents.get(contentId) || null;
  }

  async loadByOwner(contentId: string, userId: string): Promise<ContentRow | null> {
    const content = this.contents.get(contentId);
    if (content && content.user_id === userId) {
      return content;
    }
    return null;
  }

  async update(contentId: string, data: { title?: string; content: string; sanitized_content: string }): Promise<ContentRow> {
    const content = this.contents.get(contentId);
    if (!content) throw new Error('Content not found');

    const updated: ContentRow = {
      ...content,
      title: data.title ?? content.title,
      content: data.content,
      sanitized_content: data.sanitized_content,
      version: content.version + 1,
      updated_at: new Date(),
    };
    this.contents.set(contentId, updated);
    return updated;
  }

  async softDelete(contentId: string): Promise<void> {
    const content = this.contents.get(contentId);
    if (content) {
      content.deleted_at = new Date();
    }
  }

  async exists(contentId: string): Promise<boolean> {
    return this.contents.has(contentId);
  }

  async isOwner(contentId: string, userId: string): Promise<boolean> {
    const content = this.contents.get(contentId);
    return content?.user_id === userId;
  }

  async listByUser(userId: string, options?: any): Promise<any> {
    const items = Array.from(this.contents.values())
      .filter((c) => c.user_id === userId && !c.deleted_at)
      .slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50))
      .map((c) => ({
        id: c.id,
        userId: c.user_id,
        title: c.title,
        version: c.version,
        createdAt: c.created_at.toISOString(),
        updatedAt: c.updated_at.toISOString(),
        contentType: c.content_type,
      }));

    return {
      items,
      total: Array.from(this.contents.values()).filter((c) => c.user_id === userId && !c.deleted_at).length,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    };
  }

  async saveVersion(contentId: string, data: Omit<ContentVersionRow, 'id' | 'created_at' | 'content_id'>): Promise<ContentVersionRow> {
    const version: ContentVersionRow = {
      id: `version-${Date.now()}`,
      content_id: contentId,
      version: data.version,
      content: data.content,
      change_message: data.change_message,
      created_by: data.created_by,
      created_at: new Date(),
    };
    if (!this.versions.has(contentId)) {
      this.versions.set(contentId, []);
    }
    this.versions.get(contentId)!.push(version);
    return version;
  }

  async getVersions(contentId: string): Promise<ContentVersionRow[]> {
    return (this.versions.get(contentId) || []).sort((a, b) => b.version - a.version);
  }

  async getVersion(contentId: string, version: number): Promise<ContentVersionRow | null> {
    const versions = this.versions.get(contentId) || [];
    return versions.find((v) => v.version === version) || null;
  }

  async getVersionCount(contentId: string): Promise<number> {
    return (this.versions.get(contentId) || []).length;
  }

  async versionExists(contentId: string, version: number): Promise<boolean> {
    const versions = this.versions.get(contentId) || [];
    return versions.some((v) => v.version === version);
  }
}

describe('Content Module Integration Tests', () => {
  let service: ContentService;
  let repository: any;
  let sanitizer: DOMPurifyAdapter;
  let exporter: MultiFormatExporter;

  beforeEach(() => {
    repository = new MockContentRepository() as any;
    sanitizer = new DOMPurifyAdapter();
    exporter = new MultiFormatExporter();
    service = new ContentService(repository, sanitizer, exporter);
  });

  describe('Complete Content Lifecycle', () => {
    it('should create, read, and update content', async () => {
      const userId = 'user-123';

      // Create content
      const createInput = {
        title: 'Test Article',
        content: '<h1>Hello</h1><p>This is a test.</p>',
        contentType: 'text/html',
        changeMessage: 'Initial creation',
      };

      const created = await service.createContent(userId, createInput);
      expect(created.id).toBeDefined();
      expect(created.title).toBe('Test Article');
      expect(created.version).toBe(1);

      // Read content
      const read = await service.getContent(userId, created.id);
      expect(read.id).toBe(created.id);
      expect(read.title).toBe('Test Article');

      // Update content
      const updateInput = {
        title: 'Updated Article',
        content: '<h1>Updated</h1><p>This has been updated.</p>',
        changeMessage: 'Fixed typos',
      };

      const updated = await service.updateContent(userId, created.id, updateInput);
      expect(updated.version).toBe(2);
      expect(updated.title).toBe('Updated Article');
    });

    it('should enforce user permission checks', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      // Create content as user1
      const created = await service.createContent(userId1, {
        title: 'Private Content',
        content: '<p>Only user1 should see this</p>',
      });

      // User2 should not be able to access
      await expect(service.getContent(userId2, created.id)).rejects.toThrow();
    });

    it('should sanitize XSS attacks', async () => {
      const userId = 'user-123';
      const xssPayload = {
        title: 'Unsafe Content',
        content: '<p>Safe</p><script>alert("xss")</script><img src="x" onerror="alert(\'xss\')">',
      };

      const created = await service.createContent(userId, xssPayload);
      expect(created.sanitizedContent).not.toContain('<script>');
      expect(created.sanitizedContent).not.toContain('onerror');
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';

      // Create multiple contents
      for (let i = 0; i < 5; i++) {
        await service.createContent(userId, {
          title: `Content ${i}`,
          content: `<p>Content ${i}</p>`,
        });
      }

      // List with pagination
      const page1 = await service.listContent(userId, { limit: 2, offset: 0 });
      expect(page1.items.length).toBe(2);
      expect(page1.total).toBe(5);

      const page2 = await service.listContent(userId, { limit: 2, offset: 2 });
      expect(page2.items.length).toBe(2);
    });
  });

  describe('Content Versioning', () => {
    it('should create versions on update', async () => {
      const userId = 'user-123';

      const created = await service.createContent(userId, {
        title: 'Versioned Content',
        content: '<p>Version 1</p>',
      });

      // Update 3 times
      await service.updateContent(userId, created.id, {
        title: 'Versioned Content',
        content: '<p>Version 2</p>',
        changeMessage: 'Minor update',
      });

      await service.updateContent(userId, created.id, {
        title: 'Versioned Content',
        content: '<p>Version 3</p>',
        changeMessage: 'Major revision',
      });

      const versions = await service.getVersions(userId, created.id);
      expect(versions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle updated_at trigger correctly', async () => {
      const userId = 'user-123';

      const created = await service.createContent(userId, {
        title: 'Original',
        content: '<p>Original content</p>',
      });

      // Wait a bit to ensure updated_at is different
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await service.updateContent(userId, created.id, {
        title: 'Updated',
        content: '<p>Updated content</p>',
      });

      // Updated content should have a later timestamp
      expect(new Date(updated.updatedAt) >= new Date(created.updatedAt)).toBe(true);
    });
  });

  describe('Content Export', () => {
    it('should export to HTML format', async () => {
      const userId = 'user-123';
      const created = await service.createContent(userId, {
        title: 'Exportable Content',
        content: '<h1>Title</h1><p>Content</p>',
      });

      const exported = await service.exportContent(userId, created.id, 'html');
      expect(exported.mimeType).toBe('text/html');
      expect(exported.filename).toContain('.html');
      expect(exported.data).toBeDefined();
    });

    it('should export to Markdown format', async () => {
      const userId = 'user-123';
      const created = await service.createContent(userId, {
        title: 'Exportable Content',
        content: '<h1>Title</h1><p>Content</p>',
      });

      const exported = await service.exportContent(userId, created.id, 'markdown');
      expect(exported.mimeType).toBe('text/markdown');
      expect(exported.filename).toContain('.md');
    });

    it('should export to JSON format', async () => {
      const userId = 'user-123';
      const created = await service.createContent(userId, {
        title: 'Exportable Content',
        content: '<h1>Title</h1><p>Content</p>',
      });

      const exported = await service.exportContent(userId, created.id, 'json');
      expect(exported.mimeType).toBe('application/json');
      expect(exported.filename).toContain('.json');
    });

    it('should export to plain text format', async () => {
      const userId = 'user-123';
      const created = await service.createContent(userId, {
        title: 'Exportable Content',
        content: '<h1>Title</h1><p>Content</p>',
      });

      const exported = await service.exportContent(userId, created.id, 'text');
      expect(exported.mimeType).toBe('text/plain');
      expect(exported.filename).toContain('.txt');
    });
  });

  describe('Input Validation', () => {
    const userId = 'user-123';

    it('should reject empty title', async () => {
      await expect(
        service.createContent(userId, {
          title: '',
          content: '<p>Content</p>',
        })
      ).rejects.toThrow();
    });

    it('should reject oversized content (>1MB)', async () => {
      const largeContent = '<p>' + 'x'.repeat(1_000_001) + '</p>';
      await expect(
        service.createContent(userId, {
          title: 'Large',
          content: largeContent,
        })
      ).rejects.toThrow();
    });

    it('should export with all supported formats', async () => {
      const created = await service.createContent(userId, {
        title: 'Test',
        content: '<p>Test</p>',
      });

      // All standard formats should work
      const formats = ['html', 'markdown', 'json', 'text'] as const;
      for (const format of formats) {
        const exported = await service.exportContent(userId, created.id, format);
        expect(exported.data).toBeDefined();
        expect(exported.filename).toBeDefined();
        expect(exported.mimeType).toBeDefined();
      }
    });
  });

  describe('Sanitizer Tests', () => {
    it('should remove script tags', () => {
      const dirtyHtml = '<p>Safe</p><script>alert("xss")</script>';
      const result = sanitizer.sanitize(dirtyHtml);
      expect(result.content).not.toContain('<script>');
      expect(result.tagsRemovedCount).toBeGreaterThan(0);
    });

    it('should remove event handlers', () => {
      const dirtyHtml = '<img src="x" onerror="alert(\'xss\')">';
      const result = sanitizer.sanitize(dirtyHtml);
      expect(result.content).not.toContain('onerror');
    });

    it('should preserve safe HTML', () => {
      const safeHtml = '<h1>Title</h1><p>Safe <strong>content</strong></p>';
      const result = sanitizer.sanitize(safeHtml);
      expect(result.content).toContain('<h1>');
      expect(result.content).toContain('<strong>');
      expect(result.tagsRemovedCount).toBe(0);
    });

    it('should detect XSS patterns', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
      ];

      for (const payload of xssPayloads) {
        const hasXss = sanitizer.hasXssPattens(payload);
        expect(hasXss).toBe(true);
      }
    });
  });

  describe('Exporter Tests', () => {
    const html = '<h1>Title</h1><p>This is a <strong>test</strong> document.</p>';

    it('should export to HTML format', async () => {
      const buffer = await exporter.export(html, 'html');
      expect(buffer).toBeDefined();
      const content = buffer.toString();
      expect(content).toContain('<h1>');
      expect(content).toContain('Title');
    });

    it('should convert HTML to Markdown', () => {
      const md = exporter.htmlToMarkdown(html);
      expect(md).toContain('# Title');
      expect(md).toContain('**test**');
    });

    it('should strip HTML tags for plain text', () => {
      const text = exporter.htmlToText(html);
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
      expect(text).toContain('Title');
      expect(text).toContain('test');
    });

    it('should export as JSON with metadata option', async () => {
      const buffer = await exporter.exportAsJson(html, {
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      const json = JSON.parse(buffer.toString());
      expect(json.metadata.title).toBe('Test');
      expect(json.metadata.version).toBe(1);
    });

    it('should return correct MIME types', () => {
      expect(exporter.getMimeType('html')).toBe('text/html');
      expect(exporter.getMimeType('markdown')).toBe('text/markdown');
      expect(exporter.getMimeType('json')).toBe('application/json');
      expect(exporter.getMimeType('text')).toBe('text/plain');
    });

    it('should return correct file extensions', () => {
      expect(exporter.getFileExtension('html')).toBe('.html');
      expect(exporter.getFileExtension('markdown')).toBe('.md');
      expect(exporter.getFileExtension('json')).toBe('.json');
      expect(exporter.getFileExtension('text')).toBe('.txt');
    });

    it('should estimate file sizes', () => {
      const size = exporter.estimateSize(html, 'markdown');
      expect(size).toBeGreaterThan(0);
    });
  });
});
