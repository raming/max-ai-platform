/**
 * Content Exporter Port Interface
 * Multi-format export abstraction.
 *
 * Implementation: MultiFormatExporter
 * References: DEV-UI-08 specification (Section 5.3)
 */

/**
 * Supported export formats
 */
export type ExportFormat = 'html' | 'markdown' | 'json' | 'text';

/**
 * Export metadata and options
 */
export interface ExportOptions {
  title?: string; // Include title in output
  includeMetadata?: boolean; // Include timestamps, author, etc. (JSON only)
  includeVersionInfo?: boolean; // Include version number (JSON only)
}

/**
 * Exporter Port
 *
 * Converts sanitized HTML content to multiple output formats.
 * Preserves content structure and semantics in each format.
 */
export interface IExporter {
  /**
   * Export content to specified format
   *
   * Format-specific behavior:
   * - html: Return sanitized HTML as-is
   * - markdown: Convert HTML to Markdown syntax
   * - json: Return structured object with content and metadata
   * - text: Strip all HTML tags, return plain text
   *
   * @param content Sanitized HTML content
   * @param format Target export format
   * @param options Export options
   * @returns Buffer with exported content
   */
  export(content: string, format: ExportFormat, options?: ExportOptions): Promise<Buffer>;

  /**
   * Export with full metadata (JSON only)
   * Includes title, timestamps, version info, author.
   *
   * @param content Sanitized HTML
   * @param metadata Content metadata
   * @returns JSON buffer
   */
  exportAsJson(
    content: string,
    metadata: {
      title: string;
      createdAt: Date;
      updatedAt: Date;
      version: number;
      createdBy?: string;
    }
  ): Promise<Buffer>;

  /**
   * Convert HTML to Markdown
   * Preserves structure, converts tags to Markdown syntax.
   *
   * @param html Sanitized HTML
   * @returns Markdown string
   */
  htmlToMarkdown(html: string): string;

  /**
   * Strip HTML tags
   * Returns plain text with whitespace normalized.
   *
   * @param html Sanitized HTML
   * @returns Plain text
   */
  htmlToText(html: string): string;

  /**
   * Estimate file size for format
   * Used for bandwidth/storage estimation.
   *
   * @param content HTML content
   * @param format Target format
   * @returns Estimated size in bytes
   */
  estimateSize(content: string, format: ExportFormat): number;

  /**
   * Get MIME type for format
   * @param format Export format
   * @returns MIME type string
   */
  getMimeType(format: ExportFormat): string;

  /**
   * Get file extension for format
   * @param format Export format
   * @returns File extension with dot (e.g., ".md")
   */
  getFileExtension(format: ExportFormat): string;
}
