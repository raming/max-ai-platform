/**
 * Content Repository Port Interface
 * Abstraction over data access layer.
 *
 * Implementation: PostgresContentRepository
 * References: DEV-UI-08 specification (Section 5.3)
 */

import {
  ContentRow,
  ContentVersionRow,
  PaginatedResponse,
  ContentListItemDTO,
} from '../../types/content';

/**
 * Query options for list operations
 */
export interface ListOptions {
  limit?: number; // default 50, max 100
  offset?: number; // default 0
  sortBy?: 'created_at' | 'updated_at' | 'title'; // default 'updated_at'
  order?: 'asc' | 'desc'; // default 'desc'
}

/**
 * Content Repository Port
 *
 * Handles all data persistence for content and versions.
 * No business logic; pure CRUD and queries.
 */
export interface IContentRepository {
  /**
   * Create new content
   * @param userId Owner's user ID
   * @param data Content to create (without user_id, id, created_at, updated_at)
   * @returns Created content row with generated ID
   */
  save(
    userId: string,
    data: Omit<ContentRow, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<ContentRow>;

  /**
   * Load single content by ID
   * @param contentId Content UUID
   * @returns Content row or null if not found
   */
  load(contentId: string): Promise<ContentRow | null>;

  /**
   * Load single content with ownership check
   * @param contentId Content UUID
   * @param userId User requesting the content
   * @returns Content row or null if not found or not owner
   */
  loadByOwner(contentId: string, userId: string): Promise<ContentRow | null>;

  /**
   * Update content
   * Updates title, content, sanitized_content, and increments version.
   * Sets updated_at automatically.
   *
   * @param contentId Content UUID
   * @param data Fields to update
   * @returns Updated content row
   */
  update(
    contentId: string,
    data: {
      title?: string;
      content: string;
      sanitized_content: string;
    }
  ): Promise<ContentRow>;

  /**
   * Soft delete content
   * Sets deleted_at timestamp; does not remove row.
   *
   * @param contentId Content UUID
   */
  softDelete(contentId: string): Promise<void>;

  /**
   * Check if content exists
   * @param contentId Content UUID
   * @returns true if exists (including soft-deleted)
   */
  exists(contentId: string): Promise<boolean>;

  /**
   * Check if user owns content
   * @param contentId Content UUID
   * @param userId User ID
   * @returns true if user_id matches
   */
  isOwner(contentId: string, userId: string): Promise<boolean>;

  /**
   * List active content for user with pagination
   * Excludes soft-deleted content.
   *
   * @param userId User ID
   * @param options Pagination and sorting options
   * @returns Paginated list of content
   */
  listByUser(
    userId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<ContentListItemDTO>>;

  /**
   * Save new version
   * Creates immutable version snapshot.
   *
   * @param contentId Content UUID
   * @param data Version to save (without id, created_at, content_id)
   * @returns Created version row
   */
  saveVersion(
    contentId: string,
    data: Omit<ContentVersionRow, 'id' | 'created_at' | 'content_id'>
  ): Promise<ContentVersionRow>;

  /**
   * Get version history for content
   * Returns versions in descending order (newest first).
   *
   * @param contentId Content UUID
   * @returns Array of version rows
   */
  getVersions(contentId: string): Promise<ContentVersionRow[]>;

  /**
   * Get specific version
   * @param contentId Content UUID
   * @param version Version number
   * @returns Version row or null if not found
   */
  getVersion(contentId: string, version: number): Promise<ContentVersionRow | null>;

  /**
   * Get total version count for content
   * @param contentId Content UUID
   * @returns Number of versions
   */
  getVersionCount(contentId: string): Promise<number>;

  /**
   * Check if version exists
   * @param contentId Content UUID
   * @param version Version number
   * @returns true if exists
   */
  versionExists(contentId: string, version: number): Promise<boolean>;
}
