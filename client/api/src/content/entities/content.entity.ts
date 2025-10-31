/**
 * Content Entity Mappers
 * Converts between database rows and API DTOs.
 *
 * References: DEV-UI-08 specification (Section 5.2)
 */

import { ContentRow, ContentVersionRow, ContentDTO, ContentVersionDTO, ContentListItemDTO } from '../../types/content';

/**
 * Map database ContentRow to API ContentDTO
 * Converts snake_case columns to camelCase, formats timestamps as ISO 8601.
 *
 * @param row Database row from contents table
 * @returns API DTO
 */
export function mapContentRowToDTO(row: ContentRow): ContentDTO {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    sanitizedContent: row.sanitized_content,
    contentType: row.content_type,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
  };
}

/**
 * Map database ContentRow to ContentListItemDTO
 * Partial DTO for list views (excludes full content for performance).
 *
 * @param row Database row from contents table
 * @returns List item DTO
 */
export function mapContentRowToListItemDTO(row: ContentRow): ContentListItemDTO {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    contentType: row.content_type,
    characterCount: row.content.length,
    wordCount: row.content.split(/\s+/).filter((word) => word.length > 0).length,
  };
}

/**
 * Map database ContentVersionRow to API ContentVersionDTO
 * Converts snake_case columns to camelCase, formats timestamps as ISO 8601.
 *
 * @param row Database row from content_versions table
 * @returns Version DTO
 */
export function mapVersionRowToDTO(row: ContentVersionRow): ContentVersionDTO {
  return {
    id: row.id,
    version: row.version,
    content: row.content,
    changeMessage: row.change_message,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Calculate content statistics
 * Computes word count, character count, paragraph count, and estimated reading time.
 *
 * @param content HTML or text content
 * @returns Statistics object
 */
export function calculateContentStatistics(content: string) {
  // Strip HTML tags for text analysis
  const plainText = content.replace(/<[^>]*>/g, '');

  // Character counts
  const characterCount = plainText.length;
  const characterCountWithoutWhitespace = plainText.replace(/\s/g, '').length;

  // Word count (split on whitespace)
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Paragraph count (split on double newlines or <p> tags)
  const paragraphs = content.split(/<\/p>|<p>|\n\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Estimated reading time (200 words per minute)
  const estimatedReadingTimeSeconds = Math.ceil((wordCount / 200) * 60);

  return {
    characterCount,
    characterCountWithoutWhitespace,
    wordCount,
    paragraphCount,
    estimatedReadingTimeSeconds,
  };
}
