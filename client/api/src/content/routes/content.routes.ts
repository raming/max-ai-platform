/**
 * Content REST API Routes
 * Express route handlers for all 7 content endpoints.
 *
 * References: DEV-UI-08 specification (Section 5.1)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IContentService } from '../ports/content.service';

/**
 * Extend Express Request to include user from JWT middleware
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
} from '../ports/content.service';
import { mapContentRowToDTO } from '../entities/content.entity';

/**
 * Create content routes
 * @param service ContentService instance
 * @returns Express router with all content endpoints
 */
export function createContentRoutes(service: IContentService): Router {
  const router = Router();

  /**
   * POST /api/content
   * Create new content
   *
   * Request body:
   * {
   *   "title": "string (1-255 chars)",
   *   "content": "string (max 1MB)",
   *   "contentType": "string (optional, default: text/html)",
   *   "changeMessage": "string (optional)"
   * }
   *
   * Response: 201 Created
   * {
   *   "id": "uuid",
   *   "userId": "uuid",
   *   "title": "string",
   *   "content": "string",
   *   "sanitizedContent": "string",
   *   "contentType": "string",
   *   "version": 1,
   *   "createdAt": "ISO 8601",
   *   "updatedAt": "ISO 8601",
   *   "deletedAt": null
   * }
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { title, content, contentType, changeMessage } = req.body;

      const result = await service.createContent(userId, {
        title,
        content,
        contentType,
        changeMessage,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/content/:id
   * Get content by ID
   *
   * Response: 200 OK
   * {
   *   "id": "uuid",
   *   "userId": "uuid",
   *   "title": "string",
   *   "content": "string",
   *   "sanitizedContent": "string",
   *   "contentType": "string",
   *   "version": 1,
   *   "createdAt": "ISO 8601",
   *   "updatedAt": "ISO 8601",
   *   "deletedAt": null
   * }
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      const result = await service.getContent(userId, id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/content/:id
   * Update content (creates new version)
   *
   * Request body:
   * {
   *   "title": "string (optional)",
   *   "content": "string (required, max 1MB)",
   *   "contentType": "string (optional)",
   *   "changeMessage": "string (optional)"
   * }
   *
   * Response: 200 OK
   * {
   *   "id": "uuid",
   *   "userId": "uuid",
   *   "title": "string",
   *   "content": "string",
   *   "sanitizedContent": "string",
   *   "contentType": "string",
   *   "version": 2,
   *   "createdAt": "ISO 8601",
   *   "updatedAt": "ISO 8601",
   *   "deletedAt": null
   * }
   */
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;
      const { title, content, contentType, changeMessage } = req.body;

      const result = await service.updateContent(userId, id, {
        title,
        content,
        contentType,
        changeMessage,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/content/:id
   * Soft delete content
   *
   * Response: 204 No Content
   */
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      await service.deleteContent(userId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/content
   * List user's content with pagination
   *
   * Query parameters:
   * - limit: number (1-100, default 50)
   * - offset: number (default 0)
   * - sortBy: 'created_at' | 'updated_at' | 'title' (default 'updated_at')
   * - order: 'asc' | 'desc' (default 'desc')
   *
   * Response: 200 OK
   * {
   *   "items": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "title": "string",
   *       "version": 1,
   *       "createdAt": "ISO 8601",
   *       "updatedAt": "ISO 8601",
   *       "contentType": "string",
   *       "characterCount": 1000,
   *       "wordCount": 200
   *     }
   *   ],
   *   "total": 42,
   *   "limit": 50,
   *   "offset": 0,
   *   "sortBy": "updated_at",
   *   "order": "desc"
   * }
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { limit, offset, sortBy, order } = req.query;

      const result = await service.listContent(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        sortBy: (sortBy as any) || undefined,
        order: (order as any) || undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/content/:id/export
   * Export content in multiple formats
   *
   * Request body:
   * {
   *   "format": "html" | "markdown" | "json" | "text",
   *   "includeMetadata": boolean (optional, default false)
   * }
   *
   * Response: 200 OK
   * Content-Type: application/octet-stream (or format-specific MIME type)
   * Content-Disposition: attachment; filename="content-title.html"
   * [Binary file content]
   */
  router.post('/:id/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;
      const { format } = req.body;

      const result = await service.exportContent(userId, id, format);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(result.data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/content/:id/versions
   * Get version history for content
   *
   * Response: 200 OK
   * [
   *   {
   *     "id": "uuid",
   *     "version": 2,
   *     "content": "string",
   *     "changeMessage": "string",
   *     "createdBy": "uuid",
   *     "createdAt": "ISO 8601"
   *   },
   *   {
   *     "id": "uuid",
   *     "version": 1,
   *     "content": "string",
   *     "changeMessage": "Initial version",
   *     "createdBy": "uuid",
   *     "createdAt": "ISO 8601"
   *   }
   * ]
   */
  router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      const result = await service.getVersions(userId, id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Error handling middleware for content routes
 * Converts domain errors to HTTP responses
 */
export function contentErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message,
      },
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: err.message,
      },
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message,
      },
    });
  }

  if (err instanceof PayloadTooLargeError) {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: err.message,
        details: {
          field: 'content',
          actual: err.actual,
          max: err.max,
        },
      },
    });
  }

  // Generic server error
  const correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.error(`[ERROR] Correlation ID: ${correlationId}`);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
  });
}
