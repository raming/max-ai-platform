'use client';

/**
 * Preview Pane Component
 * Displays content in read-only preview mode
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md
 */

import React from 'react';
import DOMPurify from 'dompurify';

export interface PreviewPaneProps {
  content: string;
  className?: string;
  sanitize?: boolean;
}

/**
 * Preview Pane - displays sanitized HTML content in read-only mode
 * Prevents XSS by sanitizing content with DOMPurify
 */
export const PreviewPane = React.memo(
  ({ content, className = '', sanitize = true }: PreviewPaneProps) => {
    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = sanitize
      ? DOMPurify.sanitize(content, {
          ALLOWED_TAGS: [
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
            'ul',
            'ol',
            'li',
            'blockquote',
            'code',
            'pre',
            'a',
            'img',
          ],
          ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'target'],
          KEEP_CONTENT: true,
        })
      : content;

    return (
      <div
        className={`prose prose-sm max-w-none p-4 border rounded-lg bg-gray-50 ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  }
);

PreviewPane.displayName = 'PreviewPane';

export default PreviewPane;
