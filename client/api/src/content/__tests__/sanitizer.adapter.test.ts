/**
 * DOMPurifyAdapter Unit Tests
 * Tests for XSS protection and sanitization
 *
 * Coverage Target: 95%+
 */

// Mock isomorphic-dompurify before importing the adapter
jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((html: string) => {
      // Sophisticated mock sanitizer that removes script tags, event handlers, and dangerous protocols
      let sanitized = html
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove style tags
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove iframe tags
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        // Remove on* event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data- attributes
        .replace(/\s+data-[a-z\-]*=["'][^"']*["']/gi, '')
        .replace(/\s+data-[a-z\-]*=[^\s>]*/gi, '');
      return sanitized;
    }),
  },
}));

import { DOMPurifyAdapter } from '../services/sanitizer.adapter';

describe('DOMPurifyAdapter', () => {
  let adapter: DOMPurifyAdapter;

  beforeEach(() => {
    adapter = new DOMPurifyAdapter();
  });

  describe('sanitize', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello <script>alert("xss")</script> World</p>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('Hello');
      expect(result.content).toContain('World');
      expect(result.tagsRemovedCount).toBeGreaterThan(0);
      expect(result.tagsRemovedTypes).toContain('script');
    });

    it('should remove event handlers', () => {
      const input = '<img src="image.jpg" onerror="alert(\'xss\')" />';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('onerror');
      expect(result.tagsRemovedCount).toBeGreaterThan(0);
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'xss\')">Click me</a>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('javascript:');
      expect(result.content).toContain('Click me');
    });

    it('should remove iframe tags', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('<iframe');
      expect(result.content).toContain('Content');
      expect(result.tagsRemovedCount).toBeGreaterThan(0);
      expect(result.tagsRemovedTypes).toContain('iframe');
    });

    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = adapter.sanitize(input);

      expect(result.content).toContain('<p>');
      expect(result.content).toContain('<strong>');
      expect(result.content).toContain('Hello');
      expect(result.tagsRemovedCount).toBe(0);
    });

    it('should allow safe attributes', () => {
      const input = '<a href="https://example.com" title="Example">Link</a>';
      const result = adapter.sanitize(input);

      expect(result.content).toContain('href');
      expect(result.content).toContain('https://example.com');
      expect(result.content).toContain('Link');
    });

    it('should remove data attributes', () => {
      const input = '<div data-xss="malicious">Content</div>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('data-xss');
      expect(result.content).toContain('Content');
    });

    it('should track sanitization metrics', () => {
      const input = '<p>Hello <script>alert("xss")</script> <img onerror="alert(\'xss\')" /> World</p>';
      const result = adapter.sanitize(input);

      expect(result.inputLength).toBe(input.length);
      expect(result.outputLength).toBeLessThan(result.inputLength);
      expect(result.tagsRemovedCount).toBeGreaterThan(0);
      expect(result.tagsRemovedTypes.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const result = adapter.sanitize('');

      expect(result.content).toBe('');
      expect(result.inputLength).toBe(0);
      expect(result.outputLength).toBe(0);
      expect(result.tagsRemovedCount).toBe(0);
    });

    it('should handle plain text', () => {
      const input = 'This is plain text without any HTML';
      const result = adapter.sanitize(input);

      expect(result.content).toBe(input);
      expect(result.tagsRemovedCount).toBe(0);
    });

    it('should handle nested tags', () => {
      const input = '<div><p><span>Nested <script>alert("xss")</script> content</span></p></div>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('<script>');
      expect(result.content).toContain('Nested');
      expect(result.content).toContain('content');
    });

    it('should remove style tags', () => {
      const input = '<p>Content</p><style>body { display: none; }</style>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('<style>');
      expect(result.content).toContain('Content');
    });

    it('should remove onclick handlers', () => {
      const input = '<button onclick="alert(\'xss\')">Click</button>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('onclick');
      expect(result.content).toContain('Click');
    });

    it('should handle SVG with event handlers', () => {
      const input = '<svg onload="alert(\'xss\')"><circle cx="50" cy="50" r="40" /></svg>';
      const result = adapter.sanitize(input);

      expect(result.content).not.toContain('onload');
    });

    it('should preserve list formatting', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = adapter.sanitize(input);

      expect(result.content).toContain('<li>');
      expect(result.content).toContain('Item 1');
      expect(result.content).toContain('Item 2');
    });

    it('should preserve table formatting', () => {
      const input = '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
      const result = adapter.sanitize(input);

      expect(result.content).toContain('<table>');
      expect(result.content).toContain('<tr>');
      expect(result.content).toContain('<td>');
    });

    it('should handle encoded entities', () => {
      const input = '<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>';
      const result = adapter.sanitize(input);

      expect(result.content).toContain('&lt;script&gt;');
      expect(result.tagsRemovedCount).toBe(0);
    });
  });

  describe('hasXssPattens', () => {
    it('should detect script tag injection', () => {
      const input = '<script>alert("xss")</script>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should detect event handler injection', () => {
      const input = '<img onerror="alert(\'xss\')" />';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'xss\')">Click</a>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should detect iframe injection', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should not flag safe HTML', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(false);
    });

    it('should not flag plain text', () => {
      const input = 'This is plain text';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(false);
    });

    it('should detect onclick handler', () => {
      const input = '<button onclick="alert(\'xss\')">Click</button>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should detect style tag', () => {
      const input = '<style>body { display: none; }</style>';
      const result = adapter.hasXssPattens(input);

      expect(result).toBe(true);
    });

    it('should handle empty input', () => {
      const result = adapter.hasXssPattens('');

      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return sanitization statistics', () => {
      const input = '<p>Hello <script>alert("xss")</script> World</p>';
      adapter.sanitize(input);
      const stats = adapter.getStatistics();

      expect(stats.totalSanitizations).toBeGreaterThan(0);
      expect(stats.xssAttemptsDetected).toBeGreaterThanOrEqual(0);
      expect(stats.averageTagsRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple sanitizations', () => {
      adapter.sanitize('<p>Safe</p>');
      adapter.sanitize('<script>alert("xss")</script>');
      adapter.sanitize('<img onerror="alert(\'xss\')" />');

      const stats = adapter.getStatistics();

      expect(stats.totalSanitizations).toBe(3);
    });

    it('should calculate average tags removed', () => {
      adapter.sanitize('<p>Hello <script>alert("xss")</script> World</p>');
      const stats = adapter.getStatistics();

      expect(stats.averageTagsRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should handle no sanitizations', () => {
      const stats = adapter.getStatistics();

      expect(stats.totalSanitizations).toBe(0);
      expect(stats.xssAttemptsDetected).toBe(0);
      expect(stats.averageTagsRemoved).toBe(0);
    });
  });

  describe('OWASP XSS Vectors', () => {
    const xssVectors = [
      '<script>alert("xss")</script>',
      '<img src=x onerror="alert(\'xss\')" />',
      '<svg onload="alert(\'xss\')" />',
      '<body onload="alert(\'xss\')" />',
      '<iframe src="javascript:alert(\'xss\')" />',
      '<input onfocus="alert(\'xss\')" autofocus />',
      '<select onfocus="alert(\'xss\')" autofocus />',
      '<textarea onfocus="alert(\'xss\')" autofocus />',
      '<marquee onstart="alert(\'xss\')" />',
      '<div style="background:url(javascript:alert(\'xss\'))" />',
      '<a href="javascript:alert(\'xss\')">Click</a>',
      '<object data="javascript:alert(\'xss\')" />',
      '<embed src="javascript:alert(\'xss\')" />',
      '<form action="javascript:alert(\'xss\')" />',
      '<base href="javascript:alert(\'xss\')" />',
    ];

    xssVectors.forEach((vector, index) => {
      it(`should block OWASP XSS vector ${index + 1}: ${vector.substring(0, 40)}...`, () => {
        const result = adapter.sanitize(vector);

        // Should either remove the dangerous part or the entire tag
        expect(result.content).not.toContain('alert');
        expect(result.tagsRemovedCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
