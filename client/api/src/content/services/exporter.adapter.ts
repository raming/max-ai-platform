/**
 * Multi-Format Content Exporter Adapter
 * Converts sanitized HTML to multiple output formats.
 *
 * Implements: IExporter
 * References: DEV-UI-08 specification (Section 5.3)
 */

import { IExporter, ExportFormat, ExportOptions } from '../ports/exporter';

/**
 * Multi-Format Exporter Adapter
 * Converts sanitized HTML content to HTML, Markdown, JSON, and plain text formats.
 */
export class MultiFormatExporter implements IExporter {
  /**
   * Export content to specified format
   */
  async export(content: string, format: ExportFormat, options?: ExportOptions): Promise<Buffer> {
    let output: string;

    switch (format) {
      case 'html':
        output = content;
        break;

      case 'markdown':
        output = this.htmlToMarkdown(content);
        break;

      case 'json':
        output = JSON.stringify(
          {
            content,
            format: 'json',
            exportedAt: new Date().toISOString(),
            ...(options?.includeMetadata && {
              metadata: {
                title: options.title,
              },
            }),
          },
          null,
          2
        );
        break;

      case 'text':
        output = this.htmlToText(content);
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return Buffer.from(output, 'utf-8');
  }

  /**
   * Export with full metadata (JSON only)
   */
  async exportAsJson(
    content: string,
    metadata: {
      title: string;
      createdAt: Date;
      updatedAt: Date;
      version: number;
      createdBy?: string;
    }
  ): Promise<Buffer> {
    const output = JSON.stringify(
      {
        content,
        metadata: {
          title: metadata.title,
          version: metadata.version,
          createdAt: metadata.createdAt.toISOString(),
          updatedAt: metadata.updatedAt.toISOString(),
          createdBy: metadata.createdBy,
        },
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );

    return Buffer.from(output, 'utf-8');
  }

  /**
   * Convert HTML to Markdown
   * Preserves structure, converts tags to Markdown syntax.
   */
  htmlToMarkdown(html: string): string {
    let markdown = html;

    // Headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');

    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Bold
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

    // Italic
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Underline (no direct Markdown equivalent, use emphasis)
    markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');

    // Links
    markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Images
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');

    // Lists
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
      return items.map((item: string) => '- ' + item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1')).join('\n') + '\n';
    });

    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
      return items
        .map((item: string, index: number) => `${index + 1}. ` + item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1'))
        .join('\n') + '\n';
    });

    // Code blocks
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');

    // Line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<hr\s*\/?>/gi, '---\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Normalize whitespace
    markdown = markdown.replace(/\n\n\n+/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
  }

  /**
   * Strip HTML tags
   * Returns plain text with whitespace normalized.
   */
  htmlToText(html: string): string {
    let text = html;

    // Remove script and style tags
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Replace line breaks and paragraphs with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');

    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = this.decodeHtmlEntities(text);

    // Normalize whitespace
    text = text.replace(/\n\n+/g, '\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();

    return text;
  }

  /**
   * Estimate file size for format
   */
  estimateSize(content: string, format: ExportFormat): number {
    switch (format) {
      case 'html':
        return Buffer.byteLength(content, 'utf-8');

      case 'markdown':
        const markdown = this.htmlToMarkdown(content);
        return Buffer.byteLength(markdown, 'utf-8');

      case 'json':
        const json = JSON.stringify({ content }, null, 2);
        return Buffer.byteLength(json, 'utf-8');

      case 'text':
        const text = this.htmlToText(content);
        return Buffer.byteLength(text, 'utf-8');

      default:
        return 0;
    }
  }

  /**
   * Get MIME type for format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'html':
        return 'text/html';
      case 'markdown':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      case 'text':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Get file extension for format
   */
  getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'html':
        return '.html';
      case 'markdown':
        return '.md';
      case 'json':
        return '.json';
      case 'text':
        return '.txt';
      default:
        return '.bin';
    }
  }

  /**
   * Decode HTML entities
   * Converts &lt;, &gt;, &amp;, etc. to their character equivalents.
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };

    return text.replace(/&[a-z]+;/gi, (entity) => entities[entity] || entity);
  }
}
