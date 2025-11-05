/**
 * Content Service Port Interface
 * Business logic abstraction.
 *
 * Implementation: ContentService
 * References: DEV-UI-08 specification (Section 5.3)
 */

import {
  ContentDTO,
  ContentVersionDTO,
  CreateContentRequest,
  UpdateContentRequest,
  ExportContentRequest,
  ListContentResponse,
  ExportContentResponse,
  ContentStatistics,
} from '../../types/content';

/**
 * Custom error types for domain-specific exceptions
 */
export class ValidationError extends Error {
  constructor(public field: string, public details: Record<string, unknown>, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class PayloadTooLargeError extends Error {
  constructor(public actual: number, public max: number, message?: string) {
    super(message || `Payload too large: ${actual} > ${max}`);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Content Service Port
 *
 * Orchestrates business logic:
 * - CRUD operations with permission checks
 * - Content sanitization
 * - Version management
 * - Multi-format export
 * - Request validation
 */
export interface IContentService {
  /**
   * Create new content
   * Validates input, sanitizes HTML, persists to database.
   *
   * @param userId Content owner
   * @param input Create request payload
   * @returns Created content DTO
   * @throws ValidationError if input invalid
   */
  createContent(userId: string, input: CreateContentRequest): Promise<ContentDTO>;

  /**
   * Get content by ID
   * Permission-enforced: only owner can retrieve.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @returns Content DTO
   * @throws NotFoundError if content doesn't exist
   * @throws ForbiddenError if user doesn't own content
   */
  getContent(userId: string, contentId: string): Promise<ContentDTO>;

  /**
   * Update content
   * Creates new version automatically.
   * Permission-enforced: only owner can update.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @param input Update request payload
   * @returns Updated content DTO
   * @throws NotFoundError if content doesn't exist
   * @throws ForbiddenError if user doesn't own content
   * @throws ValidationError if input invalid
   */
  updateContent(userId: string, contentId: string, input: UpdateContentRequest): Promise<ContentDTO>;

  /**
   * Delete content (soft delete)
   * Sets deleted_at timestamp; content hidden from lists.
   * Permission-enforced: only owner can delete.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @throws NotFoundError if content doesn't exist
   * @throws ForbiddenError if user doesn't own content
   */
  deleteContent(userId: string, contentId: string): Promise<void>;

  /**
   * List user's active content with pagination
   * Excludes soft-deleted content.
   *
   * @param userId Content owner
   * @param options Pagination and sorting
   * @returns Paginated list with metadata
   */
  listContent(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at' | 'title';
      order?: 'asc' | 'desc';
    }
  ): Promise<ListContentResponse>;

  /**
   * Export content in multiple formats
   * Permission-enforced: only owner can export.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @param format Output format
   * @returns File buffer and metadata
   * @throws NotFoundError if content doesn't exist
   * @throws ForbiddenError if user doesn't own content
   */
  exportContent(userId: string, contentId: string, format: ExportContentRequest['format']): Promise<ExportContentResponse>;

  /**
   * Get version history
   * Returns versions in descending order (newest first).
   * Permission-enforced: only owner can view.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @returns Array of version DTOs
   * @throws NotFoundError if content doesn't exist
   * @throws ForbiddenError if user doesn't own content
   */
  getVersions(userId: string, contentId: string): Promise<ContentVersionDTO[]>;

  /**
   * Get specific version
   * Permission-enforced: only owner can view.
   *
   * @param userId Requesting user
   * @param contentId Content UUID
   * @param version Version number
   * @returns Version DTO
   * @throws NotFoundError if content or version doesn't exist
   * @throws ForbiddenError if user doesn't own content
   */
  getVersion(userId: string, contentId: string, version: number): Promise<ContentVersionDTO>;

  /**
   * Calculate content statistics
   * Computes metadata: word count, character count, reading time, etc.
   *
   * @param content HTML or text content
   * @returns Statistics object
   */
  calculateStatistics(content: string): ContentStatistics;

  /**
   * Validate content constraints
   * Checks size limits, title length, etc.
   *
   * @param input Content to validate
   * @throws ValidationError if validation fails
   */
  validateContent(input: CreateContentRequest | UpdateContentRequest): void;
}
