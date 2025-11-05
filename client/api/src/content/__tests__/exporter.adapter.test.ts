/**
 * MultiFormatExporter Unit Tests
 * Tests for multi-format content export (HTML, Markdown, JSON, Text)
 *
 * Coverage Target: 95%+
 */

import { MultiFormatExporter } from '../services/exporter.adapter';

describe('MultiFormatExporter', () => {
  let exporter: MultiFormatExporter;

  beforeEach(() => {
    exporter = new MultiFormatExporter();
  });

  describe('export', () => {
    const htmlContent = '<h1>Title</h1><p>This is a <strong>test</strong> paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul>';

    it('should export as HTML', async () => {
      const result = await exporter.export(htmlContent, 'html');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('<h1>');
      expect(result.toString()).toContain('Title');
      expect(result.toString()).toContain('<strong>');
    });

    it('should export as Markdown', async () => {
      const result = await exporter.export(htmlContent, 'markdown');

      expect(result).toBeInstanceOf(Buffer);
      const markdown = result.toString();
      expect(markdown).toContain('Title');
      expect(markdown).toContain('test');
      expect(markdown).toContain('Item 1');
    });

    it('should export as JSON', async () => {
      const result = await exporter.export(htmlContent, 'json');

      expect(result).toBeInstanceOf(Buffer);
      const json = JSON.parse(result.toString());
      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('exportedAt');
      expect(json.content).toContain('Title');
    });

    it('should export as plain text', async () => {
      const result = await exporter.export(htmlContent, 'text');

      expect(result).toBeInstanceOf(Buffer);
      const text = result.toString();
      expect(text).toContain('Title');
      expect(text).toContain('test');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should handle empty content', async () => {
      const result = await exporter.export('', 'html');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex HTML structures', async () => {
      const complexHtml = `
        <div>
          <h1>Main Title</h1>
          <p>Introduction paragraph.</p>
          <h2>Section 1</h2>
          <p>Content for section 1.</p>
          <blockquote>A quote</blockquote>
          <h2>Section 2</h2>
          <ul>
            <li>Point 1</li>
            <li>Point 2</li>
            <li>Point 3</li>
          </ul>
          <table>
            <tr><th>Header 1</th><th>Header 2</th></tr>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </table>
        </div>
      `;

      const result = await exporter.export(complexHtml, 'markdown');

      expect(result).toBeInstanceOf(Buffer);
      const markdown = result.toString();
      expect(markdown).toContain('Main Title');
      expect(markdown).toContain('Section 1');
      expect(markdown).toContain('Point 1');
    });
  });

  describe('exportAsJson', () => {
    it('should export with metadata', async () => {
      const content = '<p>Test content</p>';
      const now = new Date();
      const result = await exporter.exportAsJson(content, {
        title: 'Test Document',
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(result).toBeInstanceOf(Buffer);
      const json = JSON.parse(result.toString());

      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('metadata');
      expect(json.metadata.title).toBe('Test Document');
      expect(json.metadata.version).toBe(1);
      expect(json).toHaveProperty('exportedAt');
    });

    it('should include export timestamp', async () => {
      const content = '<p>Test</p>';
      const now = new Date();
      const result = await exporter.exportAsJson(content, {
        title: 'Test',
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      const json = JSON.parse(result.toString());
      expect(json.exportedAt).toBeDefined();
      expect(new Date(json.exportedAt)).toBeInstanceOf(Date);
    });
  });

  describe('htmlToMarkdown', () => {
    it('should convert heading tags', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('# Title');
      expect(markdown).toContain('## Subtitle');
    });

    it('should convert paragraph tags', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('First paragraph');
      expect(markdown).toContain('Second paragraph');
    });

    it('should convert bold and italic', () => {
      const html = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('**Bold**');
      expect(markdown).toContain('*italic*');
    });

    it('should convert lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('Item 1');
      expect(markdown).toContain('Item 2');
    });

    it('should convert links', () => {
      const html = '<a href="https://example.com">Example</a>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('Example');
      expect(markdown).toContain('https://example.com');
    });

    it('should convert blockquotes', () => {
      const html = '<blockquote>A quote</blockquote>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('A quote');
    });

    it('should handle code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const markdown = exporter.htmlToMarkdown(html);

      expect(markdown).toContain('const x = 1');
    });

    it('should handle empty content', () => {
      const markdown = exporter.htmlToMarkdown('');

      expect(markdown).toBe('');
    });
  });

  describe('htmlToText', () => {
    it('should strip all HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = exporter.htmlToText(html);

      expect(text).toBe('Hello World');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should preserve text content', () => {
      const html = '<h1>Title</h1><p>Content here</p>';
      const text = exporter.htmlToText(html);

      expect(text).toContain('Title');
      expect(text).toContain('Content here');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><span>Nested <strong>content</strong></span></p></div>';
      const text = exporter.htmlToText(html);

      expect(text).toContain('Nested');
      expect(text).toContain('content');
    });

    it('should handle lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const text = exporter.htmlToText(html);

      expect(text).toContain('Item 1');
      expect(text).toContain('Item 2');
    });

    it('should handle empty content', () => {
      const text = exporter.htmlToText('');

      expect(text).toBe('');
    });

    it('should collapse multiple spaces', () => {
      const html = '<p>Text   with    multiple     spaces</p>';
      const text = exporter.htmlToText(html);

      expect(text).not.toContain('   ');
    });
  });

  describe('estimateSize', () => {
    it('should estimate HTML size', () => {
      const content = '<p>Test content</p>';
      const size = exporter.estimateSize(content, 'html');

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should estimate Markdown size', () => {
      const content = '<p>Test content</p>';
      const size = exporter.estimateSize(content, 'markdown');

      expect(size).toBeGreaterThan(0);
    });

    it('should estimate JSON size', () => {
      const content = '<p>Test content</p>';
      const size = exporter.estimateSize(content, 'json');

      expect(size).toBeGreaterThan(0);
    });

    it('should estimate text size', () => {
      const content = '<p>Test content</p>';
      const size = exporter.estimateSize(content, 'text');

      expect(size).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const size = exporter.estimateSize('', 'html');

      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should estimate larger content correctly', () => {
      const smallContent = '<p>Small</p>';
      const largeContent = '<p>' + 'x'.repeat(1000) + '</p>';

      const smallSize = exporter.estimateSize(smallContent, 'html');
      const largeSize = exporter.estimateSize(largeContent, 'html');

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for HTML', () => {
      const mimeType = exporter.getMimeType('html');

      expect(mimeType).toBe('text/html');
    });

    it('should return correct MIME type for Markdown', () => {
      const mimeType = exporter.getMimeType('markdown');

      expect(mimeType).toBe('text/markdown');
    });

    it('should return correct MIME type for JSON', () => {
      const mimeType = exporter.getMimeType('json');

      expect(mimeType).toBe('application/json');
    });

    it('should return correct MIME type for text', () => {
      const mimeType = exporter.getMimeType('text');

      expect(mimeType).toBe('text/plain');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct extension for HTML', () => {
      const ext = exporter.getFileExtension('html');

      expect(ext).toBe('.html');
    });

    it('should return correct extension for Markdown', () => {
      const ext = exporter.getFileExtension('markdown');

      expect(ext).toBe('.md');
    });

    it('should return correct extension for JSON', () => {
      const ext = exporter.getFileExtension('json');

      expect(ext).toBe('.json');
    });

    it('should return correct extension for text', () => {
      const ext = exporter.getFileExtension('text');

      expect(ext).toBe('.txt');
    });
  });

  describe('Format Conversion Consistency', () => {
    const testContent = '<h1>Test</h1><p>This is a test with <strong>bold</strong> and <em>italic</em>.</p>';

    it('should maintain content across format conversions', async () => {
      const htmlResult = await exporter.export(testContent, 'html');
      const markdownResult = await exporter.export(testContent, 'markdown');
      const textResult = await exporter.export(testContent, 'text');
      const jsonResult = await exporter.export(testContent, 'json');

      const htmlText = htmlResult.toString();
      const markdownText = markdownResult.toString();
      const textText = textResult.toString();
      const jsonText = jsonResult.toString();

      // All formats should contain the core content
      expect(htmlText).toContain('Test');
      expect(markdownText).toContain('Test');
      expect(textText).toContain('Test');
      expect(jsonText).toContain('Test');
    });

    it('should handle special characters in conversion', async () => {
      const specialContent = '<p>Special chars: &amp; &lt; &gt; &quot;</p>';
      const result = await exporter.export(specialContent, 'text');

      const text = result.toString();
      expect(text).toContain('&');
      expect(text).toContain('<');
      expect(text).toContain('>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', async () => {
      const longContent = '<p>' + 'x'.repeat(10000) + '</p>';
      const result = await exporter.export(longContent, 'text');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<p>Unclosed paragraph<div>Nested without close</p></div>';
      const result = await exporter.export(malformedHtml, 'text');

      expect(result).toBeInstanceOf(Buffer);
      const text = result.toString();
      expect(text).toContain('Unclosed');
      expect(text).toContain('Nested');
    });

    it('should handle HTML with only whitespace', async () => {
      const whitespaceHtml = '<p>   </p><div>   </div>';
      const result = await exporter.export(whitespaceHtml, 'text');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle mixed content types', async () => {
      const mixedContent = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <blockquote>A quote</blockquote>
        <pre><code>code block</code></pre>
      `;

      const formats: Array<'html' | 'markdown' | 'json' | 'text'> = ['html', 'markdown', 'json', 'text'];

      for (const format of formats) {
        const result = await exporter.export(mixedContent, format);
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});
