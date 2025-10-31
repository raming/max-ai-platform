/**
 * Content Service Implementation
 * Business logic orchestration for content management.
 *
 * Implements: IContentService
 * References: DEV-UI-08 specification (Section 5.3)
 */

import {
  ContentDTO,
  ContentListItemDTO,
  ContentVersionDTO,
  CreateContentRequest,
  UpdateContentRequest,
  ExportContentResponse,
  ListContentResponse,
  ContentStatistics,
  CONTENT_CONSTRAINTS,
} from '../../types/content';
import {
  IContentService,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
} from '../ports/content.service';
import { IContentRepository, ListOptions } from '../ports/content.repository';
import { ISanitizer } from '../ports/sanitizer';
import { IExporter } from '../ports/exporter';
import {
  mapContentRowToDTO,
  mapVersionRowToDTO,
  calculateContentStatistics,
} from '../entities/content.entity';
import {
  CreateContentSchema,
  UpdateContentSchema,
  ExportContentSchema,
  ListContentSchema,
  validateInput,
} from '../validators/content.validator';

/**
 * Content Service Implementation
 * Orchestrates business logic for content management.
 */
export class ContentService implements IContentService {
  constructor(
    private repository: IContentRepository,
    private sanitizer: ISanitizer,
    private exporter: IExporter
  ) {}

  /**
   * Create new content
   */
  async createContent(userId: string, input: CreateContentRequest): Promise<ContentDTO> {
    // Validate input
    this.validateContent(input);
    const validatedInput = validateInput(CreateContentSchema, input);

    // Sanitize HTML
    const sanitizationResult = this.sanitizer.sanitize(validatedInput.content);

    // Log sanitization
    console.log(
      `[DEBUG] Sanitizing HTML: input=${sanitizationResult.inputLength} chars, output=${sanitizationResult.outputLength} chars, tags removed: ${sanitizationResult.tagsRemovedCount}`
    );

    // Create content in repository
    const contentRow = await this.repository.save(userId, {
      title: validatedInput.title,
      content: validatedInput.content,
      sanitized_content: sanitizationResult.content,
      content_type: validatedInput.contentType || 'text/html',
      version: 1,
      deleted_at: null,
    });

    // Create initial version
    await this.repository.saveVersion(contentRow.id, {
      version: 1,
      content: validatedInput.content,
      change_message: validatedInput.changeMessage || 'Initial version',
      created_by: userId,
    });

    console.log(`[DEBUG] POST /api/content: created for userId=${userId}, contentLength=${validatedInput.content.length}`);

    return mapContentRowToDTO(contentRow);
  }

  /**
   * Get content by ID
   */
  async getContent(userId: string, contentId: string): Promise<ContentDTO> {
    // Load content
    const contentRow = await this.repository.loadByOwner(contentId, userId);

    if (!contentRow) {
      // Check if content exists but user doesn't own it
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to access this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Check if soft deleted
    if (contentRow.deleted_at) {
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    console.log(`[DEBUG] GET /api/content/:id: loaded contentId=${contentId}, version=${contentRow.version}`);

    return mapContentRowToDTO(contentRow);
  }

  /**
   * Update content
   */
  async updateContent(userId: string, contentId: string, input: UpdateContentRequest): Promise<ContentDTO> {
    // Validate input
    this.validateContent(input);
    const validatedInput = validateInput(UpdateContentSchema, input);

    // Load content with ownership check
    const contentRow = await this.repository.loadByOwner(contentId, userId);

    if (!contentRow) {
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to access this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    if (contentRow.deleted_at) {
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Sanitize new content
    const sanitizationResult = this.sanitizer.sanitize(validatedInput.content);

    console.log(
      `[DEBUG] Sanitizing HTML: input=${sanitizationResult.inputLength} chars, output=${sanitizationResult.outputLength} chars, tags removed: ${sanitizationResult.tagsRemovedCount}`
    );

    // Update content (increments version)
    const updatedRow = await this.repository.update(contentId, {
      title: validatedInput.title,
      content: validatedInput.content,
      sanitized_content: sanitizationResult.content,
    });

    // Create version snapshot
    await this.repository.saveVersion(contentId, {
      version: updatedRow.version,
      content: validatedInput.content,
      change_message: validatedInput.changeMessage || `Updated to version ${updatedRow.version}`,
      created_by: userId,
    });

    console.log(
      `[DEBUG] PUT /api/content/:id: updated contentId=${contentId}, new version=${updatedRow.version}, contentLength=${validatedInput.content.length}`
    );

    return mapContentRowToDTO(updatedRow);
  }

  /**
   * Delete content (soft delete)
   */
  async deleteContent(userId: string, contentId: string): Promise<void> {
    // Check ownership
    const isOwner = await this.repository.isOwner(contentId, userId);

    if (!isOwner) {
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to delete this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Soft delete
    await this.repository.softDelete(contentId);

    console.log(`[DEBUG] DELETE /api/content/:id: soft deleted contentId=${contentId}, userId=${userId}`);
  }

  /**
   * List user's active content with pagination
   */
  async listContent(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'created_at' | 'updated_at' | 'title';
      order?: 'asc' | 'desc';
    }
  ): Promise<ListContentResponse> {
    // Validate pagination options
    const validatedOptions = validateInput(ListContentSchema, options || {});

    const listOptions: ListOptions = {
      limit: validatedOptions.limit,
      offset: validatedOptions.offset,
      sortBy: validatedOptions.sortBy,
      order: validatedOptions.order,
    };

    // Query repository
    const result = await this.repository.listByUser(userId, listOptions);

    console.log(
      `[DEBUG] GET /api/content: listed for userId=${userId}, limit=${listOptions.limit}, offset=${listOptions.offset}, total=${result.total}`
    );

    return {
      items: result.items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      sortBy: listOptions.sortBy,
      order: listOptions.order,
    };
  }

  /**
   * Export content in multiple formats
   */
  async exportContent(userId: string, contentId: string, format: 'html' | 'markdown' | 'json' | 'text'): Promise<ExportContentResponse> {
    // Validate format
    const validatedInput = validateInput(ExportContentSchema, { format });

    // Load content with ownership check
    const contentRow = await this.repository.loadByOwner(contentId, userId);

    if (!contentRow) {
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to access this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    if (contentRow.deleted_at) {
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Export content
    const buffer = await this.exporter.export(contentRow.sanitized_content, validatedInput.format);
    const mimeType = this.exporter.getMimeType(validatedInput.format);
    const extension = this.exporter.getFileExtension(validatedInput.format);
    const filename = `${contentRow.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}${extension}`;

    console.log(
      `[DEBUG] Exporting content: format=${validatedInput.format}, contentId=${contentId}, outputSize=${buffer.length}`
    );

    return {
      data: buffer,
      filename,
      mimeType,
    };
  }

  /**
   * Get version history
   */
  async getVersions(userId: string, contentId: string): Promise<ContentVersionDTO[]> {
    // Check ownership
    const isOwner = await this.repository.isOwner(contentId, userId);

    if (!isOwner) {
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to access this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Get versions
    const versionRows = await this.repository.getVersions(contentId);

    console.log(`[DEBUG] GET /api/content/:id/versions: loaded ${versionRows.length} versions for contentId=${contentId}`);

    return versionRows.map((row) => mapVersionRowToDTO(row));
  }

  /**
   * Get specific version
   */
  async getVersion(userId: string, contentId: string, version: number): Promise<ContentVersionDTO> {
    // Check ownership
    const isOwner = await this.repository.isOwner(contentId, userId);

    if (!isOwner) {
      const exists = await this.repository.exists(contentId);
      if (exists) {
        throw new ForbiddenError('You do not have permission to access this content');
      }
      throw new NotFoundError(`Content not found: ${contentId}`);
    }

    // Get version
    const versionRow = await this.repository.getVersion(contentId, version);

    if (!versionRow) {
      throw new NotFoundError(`Version not found: ${version}`);
    }

    return mapVersionRowToDTO(versionRow);
  }

  /**
   * Calculate content statistics
   */
  calculateStatistics(content: string): ContentStatistics {
    return calculateContentStatistics(content);
  }

  /**
   * Validate content constraints
   */
  validateContent(input: CreateContentRequest | UpdateContentRequest): void {
    // Check content length
    if (input.content.length > CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH) {
      throw new PayloadTooLargeError(
        input.content.length,
        CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH,
        `Content exceeds maximum size of ${CONTENT_CONSTRAINTS.MAX_CONTENT_LENGTH} characters (1MB)`
      );
    }

    // Check title length (for create requests)
    if ('title' in input && input.title) {
      if (input.title.length < CONTENT_CONSTRAINTS.MIN_TITLE_LENGTH) {
        throw new ValidationError('title', {}, 'Title cannot be empty');
      }
      if (input.title.length > CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH) {
        throw new ValidationError(
          'title',
          { max: CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH, actual: input.title.length },
          `Title cannot exceed ${CONTENT_CONSTRAINTS.MAX_TITLE_LENGTH} characters`
        );
      }
    }

    // Check change message length
    if (input.changeMessage && input.changeMessage.length > CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH) {
      throw new ValidationError(
        'changeMessage',
        { max: CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH, actual: input.changeMessage.length },
        `Change message cannot exceed ${CONTENT_CONSTRAINTS.MAX_CHANGE_MESSAGE_LENGTH} characters`
      );
    }
  }
}
