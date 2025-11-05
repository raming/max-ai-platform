/**
 * PostgreSQL Content Repository Implementation
 * Data access layer for content and versions.
 *
 * Implements: IContentRepository
 * References: DEV-UI-08 specification (Section 5.2)
 */

import { Pool } from 'pg';
import {
  ContentRow,
  ContentVersionRow,
  PaginatedResponse,
  ContentListItemDTO,
} from '../../types/content';
import { IContentRepository, ListOptions } from '../ports/content.repository';
import { mapContentRowToListItemDTO } from '../entities/content.entity';

/**
 * PostgreSQL implementation of IContentRepository
 * All queries use parameterized statements to prevent SQL injection.
 */
export class PostgresContentRepository implements IContentRepository {
  constructor(private pool: Pool) {}

  /**
   * Create new content
   */
  async save(userId: string, data: Omit<ContentRow, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ContentRow> {
    const query = `
      INSERT INTO contents (user_id, title, content, sanitized_content, content_type, version, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, title, content, sanitized_content, content_type, version, deleted_at, created_at, updated_at
    `;

    const result = await this.pool.query(query, [
      userId,
      data.title,
      data.content,
      data.sanitized_content,
      data.content_type || 'text/html',
      data.version || 1,
      data.deleted_at || null,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Failed to create content');
    }

    return this.parseContentRow(result.rows[0]);
  }

  /**
   * Load single content by ID
   */
  async load(contentId: string): Promise<ContentRow | null> {
    const query = `
      SELECT id, user_id, title, content, sanitized_content, content_type, version, deleted_at, created_at, updated_at
      FROM contents
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [contentId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseContentRow(result.rows[0]);
  }

  /**
   * Load single content with ownership check
   */
  async loadByOwner(contentId: string, userId: string): Promise<ContentRow | null> {
    const query = `
      SELECT id, user_id, title, content, sanitized_content, content_type, version, deleted_at, created_at, updated_at
      FROM contents
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.pool.query(query, [contentId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseContentRow(result.rows[0]);
  }

  /**
   * Update content
   */
  async update(
    contentId: string,
    data: {
      title?: string;
      content: string;
      sanitized_content: string;
    }
  ): Promise<ContentRow> {
    const query = `
      UPDATE contents
      SET 
        title = COALESCE($2, title),
        content = $3,
        sanitized_content = $4,
        version = version + 1,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id, title, content, sanitized_content, content_type, version, deleted_at, created_at, updated_at
    `;

    const result = await this.pool.query(query, [contentId, data.title || null, data.content, data.sanitized_content]);

    if (result.rows.length === 0) {
      throw new Error('Content not found');
    }

    return this.parseContentRow(result.rows[0]);
  }

  /**
   * Soft delete content
   */
  async softDelete(contentId: string): Promise<void> {
    const query = `
      UPDATE contents
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;

    await this.pool.query(query, [contentId]);
  }

  /**
   * Check if content exists
   */
  async exists(contentId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM contents WHERE id = $1
    `;

    const result = await this.pool.query(query, [contentId]);
    return result.rows.length > 0;
  }

  /**
   * Check if user owns content
   */
  async isOwner(contentId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM contents WHERE id = $1 AND user_id = $2
    `;

    const result = await this.pool.query(query, [contentId, userId]);
    return result.rows.length > 0;
  }

  /**
   * List active content for user with pagination
   */
  async listByUser(
    userId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<ContentListItemDTO>> {
    const limit = Math.min(options?.limit || 50, 100);
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || 'updated_at';
    const order = options?.order || 'desc';

    // Validate sortBy to prevent SQL injection
    const validSortFields = ['created_at', 'updated_at', 'title'];
    if (!validSortFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contents
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const query = `
      SELECT id, user_id, title, content, sanitized_content, content_type, version, deleted_at, created_at, updated_at
      FROM contents
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY ${sortBy} ${order.toUpperCase()}
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);

    const items = result.rows.map((row) => mapContentRowToListItemDTO(this.parseContentRow(row)));

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  /**
   * Save new version
   */
  async saveVersion(
    contentId: string,
    data: Omit<ContentVersionRow, 'id' | 'created_at' | 'content_id'>
  ): Promise<ContentVersionRow> {
    const query = `
      INSERT INTO content_versions (content_id, version, content, change_message, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, content_id, version, content, change_message, created_by, created_at
    `;

    const result = await this.pool.query(query, [
      contentId,
      data.version,
      data.content,
      data.change_message || null,
      data.created_by,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Failed to create version');
    }

    return this.parseVersionRow(result.rows[0]);
  }

  /**
   * Get version history for content
   */
  async getVersions(contentId: string): Promise<ContentVersionRow[]> {
    const query = `
      SELECT id, content_id, version, content, change_message, created_by, created_at
      FROM content_versions
      WHERE content_id = $1
      ORDER BY version DESC
    `;

    const result = await this.pool.query(query, [contentId]);
    return result.rows.map((row) => this.parseVersionRow(row));
  }

  /**
   * Get specific version
   */
  async getVersion(contentId: string, version: number): Promise<ContentVersionRow | null> {
    const query = `
      SELECT id, content_id, version, content, change_message, created_by, created_at
      FROM content_versions
      WHERE content_id = $1 AND version = $2
    `;

    const result = await this.pool.query(query, [contentId, version]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.parseVersionRow(result.rows[0]);
  }

  /**
   * Get total version count for content
   */
  async getVersionCount(contentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM content_versions
      WHERE content_id = $1
    `;

    const result = await this.pool.query(query, [contentId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if version exists
   */
  async versionExists(contentId: string, version: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM content_versions WHERE content_id = $1 AND version = $2
    `;

    const result = await this.pool.query(query, [contentId, version]);
    return result.rows.length > 0;
  }

  /**
   * Parse database row to ContentRow type
   * Ensures timestamps are Date objects.
   */
  private parseContentRow(row: any): ContentRow {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content: row.content,
      sanitized_content: row.sanitized_content,
      content_type: row.content_type,
      version: row.version,
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Parse database row to ContentVersionRow type
   * Ensures timestamps are Date objects.
   */
  private parseVersionRow(row: any): ContentVersionRow {
    return {
      id: row.id,
      content_id: row.content_id,
      version: row.version,
      content: row.content,
      change_message: row.change_message,
      created_by: row.created_by,
      created_at: new Date(row.created_at),
    };
  }
}
