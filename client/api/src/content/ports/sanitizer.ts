/**
 * HTML Sanitizer Port Interface
 * XSS protection abstraction.
 *
 * Implementation: DOMPurifyAdapter
 * References: DEV-UI-08 specification, ADR-0008 Security & Compliance
 */

/**
 * Sanitization result metadata
 */
export interface SanitizationResult {
  content: string; // Sanitized HTML
  inputLength: number; // Original input length
  outputLength: number; // Sanitized output length
  tagsRemovedCount: number; // Count of dangerous tags removed
  tagsRemovedTypes: string[]; // List of removed tag types
}

/**
 * Sanitizer Port
 *
 * Removes XSS attack vectors while preserving safe HTML.
 * Uses whitelist approach: only allow known-safe tags and attributes.
 */
export interface ISanitizer {
  /**
   * Sanitize HTML content
   * Removes dangerous tags, event handlers, scripts, etc.
   *
   * Allowed tags:
   * - Text: p, br, strong, em, u, h1-h6, blockquote, hr
   * - Lists: ul, ol, li
   * - Code: code, pre
   * - Links: a (href, title, target)
   * - Images: img (src, alt, title, width, height)
   * - Tables: table, thead, tbody, tr, th, td
   *
   * Blocked tags and attributes:
   * - script, iframe, embed, object
   * - Event handlers: onclick, onerror, onload, etc.
   * - Dangerous attrs: on*, data-*, javascript: protocol
   *
   * @param dirtyHtml HTML to sanitize
   * @returns Sanitized content and metadata
   */
  sanitize(dirtyHtml: string): SanitizationResult;

  /**
   * Check if content contains detected XSS attempts
   * Returns true if suspicious patterns detected.
   *
   * @param content HTML content
   * @returns true if XSS attempt detected
   */
  hasXssPattens(content: string): boolean;

  /**
   * Get sanitization statistics
   * For observability/metrics.
   *
   * @returns Statistics about past sanitizations
   */
  getStatistics(): {
    totalSanitizations: number;
    averageTagsRemoved: number;
    xssAttemptsDetected: number;
  };
}
