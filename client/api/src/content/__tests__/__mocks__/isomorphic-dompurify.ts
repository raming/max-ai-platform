/**
 * Mock for isomorphic-dompurify
 * Used in Jest tests when DOMPurify cannot be loaded in Node.js environment
 */

export default {
  sanitize: (html: string): string => {
    // Mock sanitizer that removes script tags and event handlers
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  },
  setConfig: (): void => {
    // No-op for mock
  },
};
