/**
 * Content Editing TypeScript Interfaces
 * Implements types from DEV-UI-08 specification
 * Path: /docs/design/content-editing/DEV-UI-08-specification.md
 */

/**
 * Content Data Transfer Object
 * Represents a piece of content with versioning and ownership
 */
export interface ContentDTO {
  id: string;
  userId: string;
  title: string;
  content: string; // HTML content from Quill
  sanitizedContent: string; // Sanitized HTML for display (XSS-safe)
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt?: Date | null; // Soft delete timestamp
}

/**
 * Content list item (partial DTO for list views)
 * Used for content listing and search results
 */
export interface ContentListItemDTO {
  id: string;
  title: string;
  updatedAt: Date;
  version: number;
}

/**
 * Content version history entry
 * Represents a snapshot of content at a specific time
 */
export interface ContentVersionDTO {
  id: string;
  contentId: string;
  version: number;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  changeNotes?: string; // Optional notes about what changed
}

/**
 * Export request parameters
 * Defines what format and options for exporting content
 */
export interface ExportRequest {
  contentId: string;
  format: 'html' | 'markdown' | 'json' | 'text';
  filename?: string;
}

/**
 * Export response data
 * Returns the exported content ready for download
 */
export interface ExportResponse {
  data: string; // The exported content
  mimeType: string; // MIME type (text/html, text/markdown, etc.)
  filename: string; // Suggested filename for download
}

/**
 * Quill Editor Component Props
 * Configuration for the Quill editor instance
 */
export interface QuillEditorProps {
  value: string; // HTML content
  onChange: (content: string) => void; // Callback when content changes
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble'; // Quill theme
  modules?: Record<string, unknown>; // Quill modules configuration
  formats?: string[]; // Allowed formats
}

/**
 * Quill Editor Reference
 * Methods available on editor ref for imperative operations
 */
export interface QuillEditorRef {
  getText(): string; // Get plain text
  getHTML(): string; // Get HTML
  getLength(): number; // Character count
  setContents(content: string): void; // Set content programmatically
  clear(): void; // Clear editor
  focus(): void; // Focus editor
  getModule(name: string): Record<string, unknown> | undefined; // Get Quill module
}

/**
 * Content save request
 * Data sent when saving content to backend
 */
export interface SaveContentRequest {
  title: string;
  content: string; // HTML from editor
}

/**
 * Content update request
 * Data sent when updating existing content
 */
export interface UpdateContentRequest extends SaveContentRequest {
  id: string;
}

/**
 * Quill toolbar configuration
 * Maps toolbar items to formatting options
 */
export interface ToolbarConfig {
  container: (string | string[])[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers?: Record<string, (value: any) => void>;
}

/**
 * Content editor state
 * Represents the full state of the editor component
 */
export interface ContentEditorState {
  content: ContentDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  unsavedChanges: boolean;
  editMode: 'edit' | 'preview';
}

/**
 * API Error Response
 * Standard error format from backend
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
}

/**
 * Content permissions
 * RBAC-related permissions for content
 */
export interface ContentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canShare?: boolean;
}

/**
 * Content statistics
 * Content metrics for display in UI
 */
export interface ContentStatistics {
  characterCount: number;
  wordCount: number;
  paragraphCount: number;
  estimatedReadingTimeMinutes: number;
}

/**
 * Quill delta format
 * Internal representation used by Quill
 */
export interface QuillDelta {
  ops: DeltaOp[];
}

/**
 * Delta operation for Quill
 * Atomic change in document
 */
export interface DeltaOp {
  insert?: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
  delete?: number;
  retain?: number;
}
