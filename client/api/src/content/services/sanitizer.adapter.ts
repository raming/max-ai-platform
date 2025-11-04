/**
 * DOMPurify HTML Sanitizer Adapter
 * XSS protection implementation.
 *
 * Implements: ISanitizer
 * References: DEV-UI-08 specification, ADR-0008 Security & Compliance
 */

import DOMPurify from 'isomorphic-dompurify';
import { ISanitizer, SanitizationResult } from '../ports/sanitizer';

/**
 * Whitelist configuration for DOMPurify
 * Only allows safe HTML tags and attributes.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'hr',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': [], // No global attributes
};

/**
 * DOMPurify Sanitizer Adapter
 * Removes XSS attack vectors while preserving safe HTML.
 */
export class DOMPurifyAdapter implements ISanitizer {
  private stats = {
    totalSanitizations: 0,
    totalTagsRemoved: 0,
    xssAttemptsDetected: 0,
  };

  /**
   * Sanitize HTML content
   * Removes dangerous tags, event handlers, scripts, etc.
   */
  sanitize(dirtyHtml: string): SanitizationResult {
    const inputLength = dirtyHtml.length;

    // Detect XSS attempts before sanitization
    const hasXssPatterns = this.hasXssPattens(dirtyHtml);
    if (hasXssPatterns) {
      this.stats.xssAttemptsDetected++;
    }

    // Configure DOMPurify
    const config = {
      ALLOWED_TAGS,
      ALLOWED_ATTR: Object.keys(ALLOWED_ATTRIBUTES).flatMap((tag) =>
        tag === '*' ? [] : ALLOWED_ATTRIBUTES[tag as keyof typeof ALLOWED_ATTRIBUTES]
      ),
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      FORCE_BODY: false,
      SANITIZE_DOM: true,
      IN_PLACE: false,
    };

    // Sanitize
    const cleanHtml = DOMPurify.sanitize(dirtyHtml, config);
    const outputLength = cleanHtml.length;

    // Count removed tags (rough estimate)
    const tagsRemoved = this.countRemovedTags(dirtyHtml, cleanHtml);
    const tagsRemovedTypes = this.extractRemovedTagTypes(dirtyHtml);

    // Update statistics
    this.stats.totalSanitizations++;
    this.stats.totalTagsRemoved += tagsRemoved;

    return {
      content: cleanHtml,
      inputLength,
      outputLength,
      tagsRemovedCount: tagsRemoved,
      tagsRemovedTypes,
    };
  }

  /**
   * Check if content contains detected XSS attempts
   * Returns true if suspicious patterns detected.
   */
  hasXssPattens(content: string): boolean {
    // Common XSS patterns
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
      /<style[^>]*>[\s\S]*?<\/style>/gi, // Style tags
      /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
      /javascript:/gi, // JavaScript protocol
      /<iframe[^>]*>/gi, // Iframes
      /<embed[^>]*>/gi, // Embed tags
      /<object[^>]*>/gi, // Object tags
      /eval\s*\(/gi, // Eval function
      /expression\s*\(/gi, // CSS expression
    ];

    return xssPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Get sanitization statistics
   */
  getStatistics(): {
    totalSanitizations: number;
    averageTagsRemoved: number;
    xssAttemptsDetected: number;
  } {
    const averageTagsRemoved =
      this.stats.totalSanitizations > 0
        ? Math.round(this.stats.totalTagsRemoved / this.stats.totalSanitizations)
        : 0;

    return {
      totalSanitizations: this.stats.totalSanitizations,
      averageTagsRemoved,
      xssAttemptsDetected: this.stats.xssAttemptsDetected,
    };
  }

  /**
   * Count removed tags (rough estimate)
   * Compares input and output to estimate tag removal.
   */
  private countRemovedTags(input: string, output: string): number {
    const inputTags = (input.match(/<[^>]+>/g) || []).length;
    const outputTags = (output.match(/<[^>]+>/g) || []).length;
    return Math.max(0, inputTags - outputTags);
  }

  /**
   * Extract types of removed tags
   * Identifies which tag types were removed.
   */
  private extractRemovedTagTypes(input: string): string[] {
    const allTags = input.match(/<(\w+)[^>]*>/gi) || [];
    const tagNames = new Set<string>();

    allTags.forEach((tag) => {
      const match = tag.match(/<(\w+)/i);
      if (match) {
        const tagName = match[1].toLowerCase();
        if (!ALLOWED_TAGS.includes(tagName)) {
          tagNames.add(tagName);
        }
      }
    });

    return Array.from(tagNames);
  }
}
