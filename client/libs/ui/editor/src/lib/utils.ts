import DOMPurify from 'dompurify';
import { ExportOptions, QuillDelta } from './types';

/**
 * Sanitizes HTML content using DOMPurify
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img', 'video',
      'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'src', 'alt', 'width', 'height',
      'style', 'class', 'id'
    ]
  });
}

/**
 * Converts Quill Delta to HTML
 */
export function deltaToHtml(delta: QuillDelta): string {
  // Simple Delta to HTML conversion
  // In a real implementation, you'd use a proper Delta parser
  let html = '';

  delta.ops.forEach(op => {
    if (op.insert) {
      let content = typeof op.insert === 'string' ? op.insert : '';

      // Apply formatting
      if (op.attributes) {
        if (op.attributes.bold) content = `<strong>${content}</strong>`;
        if (op.attributes.italic) content = `<em>${content}</em>`;
        if (op.attributes.underline) content = `<u>${content}</u>`;
        if (op.attributes.strike) content = `<strike>${content}</strike>`;
        if (op.attributes.header) {
          const level = op.attributes.header;
          content = `<h${level}>${content}</h${level}>`;
        }
        if (op.attributes.list === 'bullet') content = `<li>${content}</li>`;
        if (op.attributes.list === 'ordered') content = `<li>${content}</li>`;
        if (op.attributes.link) content = `<a href="${op.attributes.link}">${content}</a>`;
      }

      html += content;
    }
  });

  return html;
}

/**
 * Converts HTML to Markdown (basic implementation)
 */
export function htmlToMarkdown(html: string): string {
  // Simple HTML to Markdown conversion
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
    .replace(/<strike>(.*?)<\/strike>/g, '~~$1~~')
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<li>(.*?)<\/li>/g, '- $1\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n')
    .replace(/<br\s*\/?>/g, '\n');
}

/**
 * Exports content in various formats
 */
export function exportContent(
  content: string | QuillDelta,
  options: ExportOptions
): string {
  const { format, sanitize = true } = options;

  let processedContent = content;

  // Convert Delta to HTML if needed
  if (typeof content !== 'string' && format !== 'json') {
    processedContent = deltaToHtml(content);
  }

  // Sanitize if requested
  if (sanitize && typeof processedContent === 'string') {
    processedContent = sanitizeHtml(processedContent);
  }

  switch (format) {
    case 'html':
      return typeof processedContent === 'string' ? processedContent : deltaToHtml(processedContent);

    case 'markdown':
      {
        const html = typeof processedContent === 'string' ? processedContent : deltaToHtml(processedContent);
        return htmlToMarkdown(html);
      }

    case 'json':
      return JSON.stringify(content, null, 2);

    case 'text':
      {
        if (typeof processedContent === 'string') {
          // Strip HTML tags for plain text
          return processedContent.replace(/<[^>]*>/g, '');
        }
        return deltaToHtml(processedContent).replace(/<[^>]*>/g, '');
      }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Validates content size
 */
export function validateContentSize(
  content: string,
  maxSizeKB = 1024
): { valid: boolean; size: number; message?: string } {
  const size = new Blob([content]).size;
  const sizeKB = size / 1024;

  if (sizeKB > maxSizeKB) {
    return {
      valid: false,
      size: sizeKB,
      message: `Content size (${sizeKB.toFixed(2)}KB) exceeds maximum allowed size (${maxSizeKB}KB)`
    };
  }

  return {
    valid: true,
    size: sizeKB
  };
}

/**
 * Gets word count from content
 */
export function getWordCount(content: string): number {
  // Strip HTML tags and count words
  // Replace closing tags with spaces to separate words properly
  const text = content.replace(/<\/[^>]+>/g, ' ').replace(/<[^>]*>/g, '').trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Gets character count from content
 */
export function getCharacterCount(content: string): number {
  // Strip HTML tags and count characters
  return content.replace(/<[^>]*>/g, '').length;
}