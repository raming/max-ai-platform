/**
 * Content Editing — Database Schema Types
 * References: DEV-UI-08 specification (Section 5.2)
 *
 * Type definitions for database entities and API contracts.
 * These types are derived directly from the PostgreSQL schema in migrations/001_create_content_tables.sql
 */

/**
 * Database Row Type: Contents Table
 * Represents the stored row in the contents table.
 * This is the internal database representation.
 */
export interface ContentRow {
  id: string; // UUID
  user_id: string; // UUID (references users.id)
  title: string; // VARCHAR(255)
  content: string; // TEXT (max 1MB)
  sanitized_content: string; // TEXT (max 1MB, XSS-safe)
  content_type: string; // VARCHAR(50), default 'text/html'
  version: number; // INTEGER, default 1
  deleted_at: Date | null; // TIMESTAMP, null = not deleted (soft delete)
  created_at: Date; // TIMESTAMP
  updated_at: Date; // TIMESTAMP (auto-updated via trigger)
}

/**
 * Database Row Type: Content Versions Table
 * Represents a version snapshot stored in the content_versions table.
 * Each row is immutable and represents a point-in-time snapshot.
 */
export interface ContentVersionRow {
  id: string; // UUID
  content_id: string; // UUID (references contents.id)
  version: number; // INTEGER (unique per content_id)
  content: string; // TEXT (immutable snapshot)
  change_message: string | null; // VARCHAR(500), optional
  created_by: string; // UUID (references users.id)
  created_at: Date; // TIMESTAMP
}

/**
 * API Data Transfer Object: Content
 * Mapped from ContentRow for API responses.
 * Includes computed fields and excludes sensitive data.
 */
export interface ContentDTO {
  id: string;
  userId: string;
  title: string;
  content: string; // Raw HTML
  sanitizedContent: string; // XSS-safe for display
  contentType: string; // MIME type
  version: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601, null if not deleted
}

/**
 * API Data Transfer Object: Content List Item
 * Partial DTO for list views (excludes full content for performance).
 */
export interface ContentListItemDTO {
  id: string;
  userId: string;
  title: string;
  version: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  contentType: string;
  characterCount?: number; // Optional: computed from content length
  wordCount?: number; // Optional: computed from word count
}

/**
 * API Data Transfer Object: Content Version
 * Mapped from ContentVersionRow for API responses.
 */
export interface ContentVersionDTO {
  id: string;
  version: number;
  content: string; // Content snapshot
  changeMessage: string | null;
  createdBy: string; // User ID
  createdAt: string; // ISO 8601
}

/**
 * Paginated List Response
 * Generic paginated response wrapper for list endpoints.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Request Payload: Create Content
 */
export interface CreateContentRequest {
  title: string; // min 1, max 255 chars
  content: string; // HTML content, max 1MB
  contentType?: string; // default 'text/html'
  changeMessage?: string; // optional initial version message
}

/**
 * Request Payload: Update Content
 */
export interface UpdateContentRequest {
  title?: string; // optional
  content: string; // HTML content, max 1MB
  contentType?: string; // optional
  changeMessage?: string; // optional version note
}

/**
 * Request Payload: Export Content
 */
export interface ExportContentRequest {
  format: 'html' | 'markdown' | 'json' | 'text';
  includeMetadata?: boolean; // include title, timestamps in JSON
}

/**
 * Response Payload: List Content
 */
export interface ListContentResponse extends PaginatedResponse<ContentListItemDTO> {
  sortBy?: string; // what field was sorted by
  order?: 'asc' | 'desc';
}

/**
 * Response Payload: Export Content (Binary)
 * In practice, the API returns the file as a buffer/blob with appropriate headers.
 * This type is for documentation purposes.
 */
export interface ExportContentResponse {
  data: Buffer; // File content
  filename: string; // e.g., "content-title.html"
  mimeType: string; // e.g., "text/html"
}

/**
 * Error Response
 * Standardized error format for all endpoints.
 */
export interface ErrorResponse {
  error: {
    code: string; // e.g., 'INVALID_INPUT', 'NOT_FOUND', 'UNAUTHORIZED'
    message: string; // Human-readable error message
    details?: Record<string, unknown>; // Field-specific errors or additional context
    correlationId?: string; // Request correlation ID for logging
  };
}

/**
 * Content Statistics
 * Computed metadata about content.
 */
export interface ContentStatistics {
  characterCount: number;
  characterCountWithoutWhitespace: number;
  wordCount: number;
  paragraphCount: number;
  estimatedReadingTimeSeconds: number; // ~200 words per minute
}

/**
 * Constraints from Database Schema
 * Reference for application-level validation.
 */
export const CONTENT_CONSTRAINTS = {
  MAX_CONTENT_LENGTH: 1_000_000, // 1MB in characters
  MAX_TITLE_LENGTH: 255,
  MAX_CHANGE_MESSAGE_LENGTH: 500,
  MAX_CONTENT_TYPE_LENGTH: 50,
  MIN_TITLE_LENGTH: 1,
};
