# DEV-UI-08: Content Editing Integration — Architectural Specification

**Issue**: DEV-UI-08  
**Status**: In Design (awaiting review)  
**Related**: Portal UI (`docs/design/portal-ui`), Prompt Service (`docs/design/prompt-service`)  
**Date**: Oct 30, 2025

---

## 1. Executive Summary

This specification defines the architecture for **Content Editing Integration (DEV-UI-08)**, a feature that enables users to create, edit, and manage rich text content within the MaxAI portal. The content editor is built on Quill.js and integrates with the portal's existing authentication, permissions, and content persistence layers.

**Primary Use Cases**:
- Users create custom AI prompt templates
- Users edit response templates and content
- Users manage content workflows with versioning
- Users export content in multiple formats (HTML, Markdown, JSON, plain text)

**Success Criteria**:
- ✅ Rich text editing UI with toolbar and preview
- ✅ Backend content persistence with ownership/RBAC
- ✅ Content versioning and audit trail
- ✅ Export in multiple formats
- ✅ Automatic sanitization for security
- ✅ Performance: <200ms API response (p90)
- ✅ ≥95% test coverage
- ✅ Zero XSS vulnerabilities in sanitization

---

## 2. Feature Overview & Scope

### 2.1 In Scope ✅

| Feature | Description | Priority |
|---------|-------------|----------|
| **Rich Text Editor** | Quill.js-based editor with toolbar (bold, italic, underline, links, lists, headings) | P0 |
| **Content Persistence** | Save/load content to backend with ownership tracking | P0 |
| **RBAC Integration** | Enforce ownership and edit permissions | P0 |
| **Content Versioning** | Track content history with timestamps and author info | P1 |
| **Multi-Format Export** | Export to HTML, Markdown, JSON, plain text | P1 |
| **Content Sanitization** | XSS protection via HTML sanitization | P0 |
| **Preview Mode** | Toggle between edit and preview view | P1 |
| **Sample Content** | Pre-populated content examples for users | P2 |
| **Word Count** | Display content statistics (character/word count) | P2 |

### 2.2 Out of Scope ❌

- Real-time collaborative editing (multi-user simultaneous editing)
- AI-powered content suggestions/generation
- Advanced media embedding (images, videos, embeds beyond basic links)
- Content search/full-text indexing
- Content recommendations or analytics
- Integration with external content management systems (Contentful, Sanity, etc.)

### 2.3 User Stories

**US-1: User Creates Custom Prompt Template**
- As a user, I want to create a new rich text prompt template
- So that I can define custom instructions for AI agents
- Acceptance Criteria:
  - New content can be created via "New Content" button
  - Content is immediately associated with my user account
  - Content is persisted to backend on save
  - I can see confirmation of successful save

**US-2: User Edits Existing Content**
- As a user, I want to edit content I previously created
- So that I can refine my prompts and templates over time
- Acceptance Criteria:
  - Content list shows all my content with timestamps
  - Clicking content loads it into editor
  - Changes are tracked with timestamps
  - I can see version history

**US-3: User Exports Content in Multiple Formats**
- As a user, I want to export my content in different formats
- So that I can use it in other systems (external tools, email, etc.)
- Acceptance Criteria:
  - Export dialog offers format selection (HTML, Markdown, JSON, text)
  - Export downloads file with correct format
  - Content is properly formatted for each output type

**US-4: User Sees Sanitized Content**
- As a user, I want to know my content is secure
- So that I don't have to worry about XSS attacks
- Acceptance Criteria:
  - All content is sanitized on display
  - Dangerous HTML tags are removed
  - Event handlers are stripped
  - Content is still readable and properly formatted

---

## 3. Architecture Overview

### 3.1 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Portal UI (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Content Editor Page Component                 │  │
│  │  (/app/content or /dashboard/content/[id])           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ - Quill Editor Instance                              │  │
│  │ - Preview Toggle                                     │  │
│  │ - Save/Export Buttons                                │  │
│  │ - Version History Sidebar                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Content Management Hooks (useContent hook)        │  │
│  │  - useSaveContent(contentId, data)                   │  │
│  │  - useLoadContent(contentId)                         │  │
│  │  - useDeleteContent(contentId)                       │  │
│  │  - useListContent()                                  │  │
│  │  - useExportContent(contentId, format)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                   HTTP/REST Calls
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Content Controller / Route Handlers             │  │
│  │  POST   /api/content          - Create new content   │  │
│  │  GET    /api/content/:id      - Get content by ID    │  │
│  │  PUT    /api/content/:id      - Update content       │  │
│  │  DELETE /api/content/:id      - Delete content       │  │
│  │  GET    /api/content          - List user's content  │  │
│  │  POST   /api/content/:id/export - Export content     │  │
│  │  GET    /api/content/:id/versions - Get history      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Content Service (Business Logic)               │  │
│  │  - validateContent(data)                             │  │
│  │  - sanitizeContent(html)                             │  │
│  │  - exportContent(content, format)                    │  │
│  │  - enforcePermissions(user, content)                 │  │
│  │  - createVersion(content, metadata)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Content Repository / DAO                       │  │
│  │  - saveContent(content)                              │  │
│  │  - loadContent(id)                                   │  │
│  │  - deleteContent(id)                                 │  │
│  │  - listByUser(userId)                                │  │
│  │  - saveVersion(contentId, snapshot)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    Database Queries
                           │
                           ▼
                    ┌──────────────────┐
                    │  PostgreSQL DB   │
                    │ (contents table  │
                    │  versions table)  │
                    └──────────────────┘
```

### 3.2 Ports & Adapters Pattern

The content editing feature follows the ports & adapters pattern:

**Ports (Interfaces)**:
- `IContentRepository` - Persistence port (adapter: PostgreSQL via ORM)
- `IContentService` - Business logic port
- `ISanitizer` - HTML sanitization port (adapter: DOMPurify or similar)
- `IExporter` - Multi-format export port

**Adapters**:
- `PostgreSQLContentRepository` - Database adapter (implements `IContentRepository`)
- `DOMPurifyAdapter` - HTML sanitizer adapter (implements `ISanitizer`)
- `ContentExporterAdapter` - Export orchestrator (implements `IExporter`)

---

## 4. Frontend Layer Specification

### 4.1 Component Hierarchy

```
ContentEditorLayout
├── ContentHeader
│   ├── Title / Breadcrumbs
│   ├── Statistics (character count, word count)
│   └── Action Buttons (Preview toggle, Save, Export, Delete)
├── ContentEditor (main editor container)
│   ├── QuillEditor (Quill.js instance)
│   │   ├── Toolbar (formatting tools)
│   │   └── Editor (editable content area)
│   └── PreviewPane (toggle mode)
├── SampleContentSidebar (P2 - optional)
│   ├── BasicText (sample clickable)
│   ├── FormattedContent (sample clickable)
│   └── AdvancedFeatures (sample clickable)
├── ExportModal (dialog)
│   ├── FormatSelector (radio buttons)
│   ├── FilenameInput
│   ├── PreviewTextarea (read-only)
│   └── DownloadButton
└── VersionHistorySidebar (P1)
    ├── VersionList
    ├── VersionDetails (timestamp, author)
    └── RestoreButton
```

### 4.2 Component Props Interfaces (TypeScript)

```typescript
// Main page component
interface ContentEditorPageProps {
  params: {
    contentId?: string;  // undefined = new content
  };
}

// Editor component
interface QuillEditorProps {
  ref: React.Ref<QuillEditorRef>;
  value: string;                    // HTML content
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';       // Quill themes
}

interface QuillEditorRef {
  getText(): string;                // Get plain text
  getHTML(): string;                // Get HTML
  getLength(): number;              // Character count
  setContents(content: string): void; // Set content programmatically
  clear(): void;                    // Clear editor
}

// Service layer
interface ContentDTO {
  id: string;
  userId: string;
  title: string;
  content: string;                  // HTML
  sanitizedContent: string;         // Sanitized HTML for display
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface ExportRequest {
  contentId: string;
  format: 'html' | 'markdown' | 'json' | 'text';
  filename?: string;
}
```

### 4.3 State Management

**Client State** (Zustand):
```typescript
interface ContentStore {
  // State
  currentContent: ContentDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  unsavedChanges: boolean;

  // Actions
  setCurrentContent: (content: ContentDTO) => void;
  setContent: (html: string) => void;  // Marks unsaved changes
  resetUnsavedChanges: () => void;
  setError: (error: string | null) => void;
}
```

**Server State** (TanStack Query):
- Query: `useContentQuery(contentId)` - Load content
- Query: `useContentListQuery()` - List user's content
- Mutation: `useSaveContentMutation()` - Save/update content
- Mutation: `useDeleteContentMutation()` - Delete content
- Mutation: `useExportContentMutation()` - Export content

### 4.4 User Interface Flows

**Flow 1: Create New Content**
```
User clicks "New Content"
  → Page mounts with contentId = undefined
  → Empty editor loaded
  → User types content
  → User clicks "Save"
  → POST /api/content { title, content }
  → Backend creates content, returns id
  → Redirect to /content/[id]
  → Success message shown
```

**Flow 2: Edit Existing Content**
```
User navigates to /content/[id]
  → useContentQuery loads content
  → Editor displays loaded HTML
  → User edits content
  → onChange fires, marks unsavedChanges
  → User clicks "Save"
  → PUT /api/content/[id] { content }
  → Backend updates, creates version
  → Success message shown
  → Browser unsaved changes warning cleared
```

**Flow 3: Export Content**
```
User selects format (HTML, Markdown, JSON, text)
  → User enters filename
  → User clicks "Download"
  → POST /api/content/[id]/export { format }
  → Backend converts content
  → Server returns file binary
  → Browser downloads file
  → User receives file with correct extension
```

---

## 5. Backend Layer Specification

### 5.1 API Endpoints

#### 5.1.1 Create Content

**Endpoint**: `POST /api/content`

**Request**:
```json
{
  "title": "Custom Prompt Template",
  "content": "<h1>Instruction</h1><p>Be helpful...</p>",
  "contentType": "prompt_template"  // enum: prompt_template, response_template, workflow
}
```

**Response** (201 Created):
```json
{
  "id": "uuid-v4",
  "userId": "user-id",
  "title": "Custom Prompt Template",
  "content": "<h1>Instruction</h1><p>Be helpful...</p>",
  "sanitizedContent": "<h1>Instruction</h1><p>Be helpful...</p>",
  "contentType": "prompt_template",
  "version": 1,
  "createdAt": "2025-10-30T12:00:00Z",
  "updatedAt": "2025-10-30T12:00:00Z"
}
```

**Error Handling**:
- 400: Invalid content (empty, exceeds max length)
- 401: Unauthorized (not authenticated)
- 413: Payload too large (content > 1MB)
- 500: Server error with correlation ID for logging

#### 5.1.2 Get Content by ID

**Endpoint**: `GET /api/content/:contentId`

**Response** (200 OK):
```json
{
  "id": "uuid-v4",
  "userId": "user-id",
  "title": "Custom Prompt Template",
  "content": "<h1>Instruction</h1><p>Be helpful...</p>",
  "sanitizedContent": "<h1>Instruction</h1><p>Be helpful...</p>",
  "contentType": "prompt_template",
  "version": 1,
  "createdAt": "2025-10-30T12:00:00Z",
  "updatedAt": "2025-10-30T12:00:00Z"
}
```

**Error Handling**:
- 401: Unauthorized
- 403: Forbidden (content belongs to different user)
- 404: Not found
- 500: Server error

#### 5.1.3 Update Content

**Endpoint**: `PUT /api/content/:contentId`

**Request**:
```json
{
  "title": "Updated Title",  // optional
  "content": "<p>Updated content...</p>"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid-v4",
  "userId": "user-id",
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "sanitizedContent": "<p>Updated content...</p>",
  "version": 2,
  "createdAt": "2025-10-30T12:00:00Z",
  "updatedAt": "2025-10-30T12:00:30Z"
}
```

**Behavior**:
- Creates a new version after each update
- Old version stored in `content_versions` table
- Returns updated content with new version number

#### 5.1.4 Delete Content

**Endpoint**: `DELETE /api/content/:contentId`

**Response** (204 No Content)

**Behavior**:
- Soft delete (mark as deleted, don't purge from DB)
- Maintains audit trail
- Content no longer appears in list queries

#### 5.1.5 List User's Content

**Endpoint**: `GET /api/content`

**Query Parameters**:
```
?limit=20&offset=0&sortBy=updatedAt&order=desc
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": "uuid-1",
      "title": "Prompt 1",
      "contentType": "prompt_template",
      "createdAt": "2025-10-30T12:00:00Z",
      "updatedAt": "2025-10-30T12:00:00Z",
      "version": 3
    },
    {
      "id": "uuid-2",
      "title": "Response Template",
      "contentType": "response_template",
      "createdAt": "2025-10-29T10:00:00Z",
      "updatedAt": "2025-10-29T15:00:00Z",
      "version": 1
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### 5.1.6 Export Content

**Endpoint**: `POST /api/content/:contentId/export`

**Request**:
```json
{
  "format": "markdown"  // enum: html, markdown, json, text
}
```

**Response** (200 OK - Content-Disposition: attachment):
```
Content-Type: text/markdown
Content-Disposition: attachment; filename="content.md"

# Instruction

Be helpful and concise.

- Provide clear answers
- Reference sources
```

**Error Handling**:
- 400: Invalid format
- 404: Content not found
- 500: Export conversion failed

#### 5.1.7 Get Content Versions (P1)

**Endpoint**: `GET /api/content/:contentId/versions`

**Response** (200 OK):
```json
{
  "items": [
    {
      "version": 3,
      "content": "<p>Latest...</p>",
      "createdAt": "2025-10-30T12:00:30Z",
      "author": "user-id",
      "changeMessage": "Fixed typo"
    },
    {
      "version": 2,
      "content": "<p>Previous...</p>",
      "createdAt": "2025-10-30T12:00:00Z",
      "author": "user-id",
      "changeMessage": "Initial version"
    }
  ],
  "current": 3
}
```

### 5.2 Data Model (PostgreSQL)

#### 5.2.1 Contents Table

```sql
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sanitized_content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT content_length CHECK (char_length(content) <= 1000000)
);

CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_contents_updated_at ON contents(updated_at);
```

#### 5.2.2 Content Versions Table

```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_message VARCHAR(500),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE (content_id, version)
);

CREATE INDEX idx_content_versions_content_id ON content_versions(content_id);
```

#### 5.2.3 Entity Relationships

```
users
  ├─ has many: contents (1:N) via user_id
  └─ has many: content_versions (1:N) via created_by

contents
  ├─ belongs to: users (N:1) via user_id
  └─ has many: content_versions (1:N) via content_id

content_versions
  ├─ belongs to: contents (N:1) via content_id
  └─ belongs to: users (N:1) via created_by
```

### 5.3 Business Logic Layer

#### 5.3.1 Content Service

**Responsibilities**:
- Validate content before persistence
- Sanitize HTML to prevent XSS
- Enforce RBAC (only owner can edit)
- Create versions on update
- Generate export formats

**Key Methods**:

```typescript
interface IContentService {
  // Create new content
  createContent(
    userId: string,
    input: { title: string; content: string; contentType: string }
  ): Promise<ContentDTO>;

  // Load content by ID
  getContent(userId: string, contentId: string): Promise<ContentDTO>;

  // Update content (creates version)
  updateContent(
    userId: string,
    contentId: string,
    input: { title?: string; content: string }
  ): Promise<ContentDTO>;

  // Delete content (soft delete)
  deleteContent(userId: string, contentId: string): Promise<void>;

  // List user's content
  listContent(
    userId: string,
    options: { limit?: number; offset?: number; sortBy?: string }
  ): Promise<{ items: ContentDTO[]; total: number }>;

  // Export to different formats
  exportContent(
    userId: string,
    contentId: string,
    format: 'html' | 'markdown' | 'json' | 'text'
  ): Promise<Buffer>;

  // Get version history
  getVersions(userId: string, contentId: string): Promise<VersionDTO[]>;
}
```

#### 5.3.2 Sanitization Logic

**Requirements**:
- Remove potentially dangerous HTML tags (script, iframe, etc.)
- Strip JavaScript event handlers (onclick, onload, etc.)
- Preserve safe formatting (bold, italic, links, lists, etc.)
- Use DOMPurify or equivalent library

**Allowed Tags**:
```
h1, h2, h3, h4, h5, h6
p, br, hr
strong, em, u, s, del
ul, ol, li
a (href only, must be http/https)
blockquote, pre, code
table, thead, tbody, tr, th, td
```

**Sanitization Flow**:
```
User Input (HTML)
    ↓
[DOMPurify.sanitize(html, config)]
    ↓
Sanitized HTML (safe for display)
    ↓
Store in DB
    ↓
Serve to Frontend
```

#### 5.3.3 Permission Enforcement

**Rule**: Only content owner can read/update/delete

```typescript
function enforceOwnership(
  requestUserId: string,
  contentUserId: string
): void {
  if (requestUserId !== contentUserId) {
    throw new ForbiddenError('You do not have permission to access this content');
  }
}
```

#### 5.3.4 Export Logic

**HTML Export**: Return content as-is (already HTML)

**Markdown Export**: Use html-to-markdown or similar library
```
<h1>Title</h1> → # Title
<p>Text</p> → Text
<strong>Bold</strong> → **Bold**
<em>Italic</em> → *Italic*
```

**JSON Export**: Return structured format
```json
{
  "title": "Content Title",
  "content": "<p>HTML content</p>",
  "contentType": "prompt_template",
  "version": 1,
  "createdAt": "2025-10-30T12:00:00Z"
}
```

**Plain Text Export**: Strip all HTML tags
```
Content Title

HTML content
```

---

## 6. Integration Layer

### 6.1 Authentication & Authorization

**Integration Point**: NextAuth.js + Portal IAM

- All API endpoints require JWT token in `Authorization: Bearer <token>` header
- Token payload includes `userId` and `role`
- Frontend automatically includes token via API interceptor
- Backend validates token and extracts `userId` for all operations
- RBAC: Users can only access their own content (no admin override in MVP)

### 6.2 Portal Navigation Integration

**Navigation Item**:
```
Portal Sidebar
├── Dashboard
├── Connections
├── Content Editor ← NEW
├── Settings
└── Billing
```

**Route**: `/dashboard/content` or `/content`

### 6.3 Error Handling & Observability

**Frontend Error Handling**:
- Display user-friendly error messages
- Log errors to observability service with correlation ID
- Show loading states during operations
- Warn user before leaving if unsaved changes exist

**Backend Error Handling**:
- All errors return JSON with: code, message, correlationId, timestamp
- Log all operations: created, updated, deleted, exported
- Track performance: API latency (target: <200ms p90)
- Structured logging with correlation IDs for tracing

**Example Error Response**:
```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "The requested content does not exist.",
    "statusCode": 404,
    "correlationId": "req-12345-abc-def",
    "timestamp": "2025-10-30T12:00:00Z"
  }
}
```

### 6.4 Observability Requirements

**Metrics to Track**:
- `content.create` - Number of contents created
- `content.update` - Number of contents updated
- `content.delete` - Number of contents deleted
- `content.export` - Number of exports by format
- `content.api.latency` - API endpoint latencies
- `content.sanitization.time` - HTML sanitization duration
- `content.db.query.time` - Database query performance

**Logs**:
- Every CRUD operation logged with userId, contentId, action
- Audit trail for data modifications
- Error logs include stack traces and correlation IDs
- Performance warnings if operations exceed thresholds

**Debug Logging**:
- `[DEBUG] Loading content: contentId=${id}, userId=${userId}`
- `[DEBUG] Sanitizing HTML: length=${length}, tags=${tagCount}`
- `[DEBUG] Exporting content: format=${format}, contentId=${id}`

---

## 7. Data Contracts & Validation

### 7.1 Request/Response JSON Schemas

**CreateContentRequest Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["title", "content", "contentType"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "pattern": "^[\\w\\s\\-\\.,:;!?()]+$"
    },
    "content": {
      "type": "string",
      "minLength": 1,
      "maxLength": 1000000
    },
    "contentType": {
      "type": "string",
      "enum": ["prompt_template", "response_template", "workflow"]
    }
  }
}
```

**ContentDTO Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "userId", "title", "content", "version", "createdAt", "updatedAt"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "userId": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "content": { "type": "string" },
    "sanitizedContent": { "type": "string" },
    "contentType": { "type": "string" },
    "version": { "type": "integer", "minimum": 1 },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
}
```

### 7.2 Contract Tests

**Contract Test: POST /api/content**
```javascript
describe('POST /api/content', () => {
  it('should create content and return ContentDTO', async () => {
    const request = { title: 'Test', content: '<p>Test</p>', contentType: 'prompt_template' };
    const response = await client.post('/api/content', request);
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchSchema(ContentDTOSchema);
    expect(response.body.id).toBeDefined();
    expect(response.body.userId).toBe(userId);
  });
});
```

---

## 8. Testing Strategy

### 8.1 Unit Tests (95%+ Coverage)

**Frontend Unit Tests**:
- `ContentEditor.test.tsx` - Component rendering, state changes, user interactions
- `useContentHook.test.ts` - Hook state management, API calls
- `contentService.test.ts` - Sanitization, export formatting

**Backend Unit Tests**:
- `contentService.test.ts` - Business logic, validation, permission checks
- `contentRepository.test.ts` - CRUD operations, query building
- `sanitizer.test.ts` - HTML sanitization with XSS payload tests

**Example Unit Test**:
```typescript
describe('sanitizeContent', () => {
  it('should remove script tags', () => {
    const dangerous = '<p>Hello<script>alert("xss")</script></p>';
    const result = sanitizer.sanitizeContent(dangerous);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should remove event handlers', () => {
    const dangerous = '<p onclick="alert()">Click me</p>';
    const result = sanitizer.sanitizeContent(dangerous);
    expect(result).not.toContain('onclick');
  });

  it('should preserve safe formatting', () => {
    const safe = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const result = sanitizer.sanitizeContent(safe);
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });
});
```

### 8.2 Integration Tests (80%+ Coverage)

**API Integration Tests**:
- `content.integration.test.ts` - Full CRUD workflows
  - Create → Read → Update → Delete
  - Export in all formats
  - Version history tracking
  - Permission enforcement
  - Error cases

**Frontend-Backend Integration Tests**:
- `contentEditor.integration.test.tsx` - User workflows
  - Create and save content
  - Load and edit content
  - Export content
  - Handle API errors gracefully

**Example Integration Test**:
```typescript
describe('Content CRUD Workflow', () => {
  it('should create, update, and export content', async () => {
    // Create
    const created = await api.post('/api/content', {
      title: 'Test',
      content: '<p>Hello</p>',
      contentType: 'prompt_template'
    });
    expect(created.status).toBe(201);

    // Read
    const retrieved = await api.get(`/api/content/${created.body.id}`);
    expect(retrieved.body.title).toBe('Test');

    // Update
    const updated = await api.put(`/api/content/${created.body.id}`, {
      content: '<p>Updated</p>'
    });
    expect(updated.body.version).toBe(2);

    // Export
    const exported = await api.post(
      `/api/content/${created.body.id}/export`,
      { format: 'markdown' }
    );
    expect(exported.status).toBe(200);
    expect(exported.headers['content-type']).toContain('markdown');

    // Cleanup
    await api.delete(`/api/content/${created.body.id}`);
  });
});
```

### 8.3 Contract Tests (100% Coverage)

**OpenAPI Contract Tests**:
- Verify all endpoints exist and return correct schemas
- Validate error responses match contract
- Test parameter validation

**Example Contract Test**:
```typescript
describe('POST /api/content Contract', () => {
  it('should return ContentDTO with required fields', async () => {
    const response = await client.post('/api/content', createRequest);
    
    const contract = OpenAPI.schemas.ContentDTO;
    expect(response.body).toMatchSchema(contract);
  });

  it('should return 400 for invalid content', async () => {
    const response = await client.post('/api/content', { title: '' });
    
    expect(response.status).toBe(400);
    expect(response.body).toMatchSchema(OpenAPI.schemas.ErrorResponse);
  });
});
```

### 8.4 E2E Tests (Smoke)

**Playwright E2E Tests**:
- `contentEditor.e2e.spec.ts` - User workflows in real browser
  - Navigate to content editor
  - Create new content
  - Edit and save
  - Export content
  - Verify visual rendering

**Example E2E Test**:
```typescript
test('User can create and export content', async ({ page }) => {
  // Navigate to content editor
  await page.goto('/dashboard/content/new');

  // Type in editor
  const editor = page.locator('[data-testid="quill-editor"]');
  await editor.click();
  await editor.type('<h1>Hello</h1>');

  // Save
  await page.click('button:has-text("Save Content")');
  await expect(page.locator('text=Content saved')).toBeVisible();

  // Export
  await page.click('button:has-text("Export")');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download HTML")')
  ]);
  expect(download.suggestedFilename()).toContain('.html');
});
```

### 8.5 Security Tests

**XSS Prevention Tests**:
- Test with OWASP XSS payload vectors
- Verify sanitization effectiveness
- Ensure no encoded XSS bypasses

**Example Security Test**:
```typescript
describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(\'xss\')"></iframe>'
  ];

  xssPayloads.forEach(payload => {
    it(`should prevent XSS: ${payload}`, () => {
      const result = sanitizer.sanitizeContent(payload);
      expect(result).not.toMatch(/script|onerror|onload|javascript:/i);
    });
  });
});
```

---

## 9. Non-Functional Requirements (NFRs)

| NFR | Requirement | Measurement |
|-----|------------|-------------|
| **Performance** | API endpoint response time | <200ms p90 (non-cached) |
| **Throughput** | Max concurrent users | 1,000 users editing simultaneously |
| **Availability** | Uptime SLA | 99.9% monthly |
| **Scalability** | Content size limit | 1MB per content item |
| **Reliability** | Data durability | 99.99% (PostgreSQL backups) |
| **Security** | XSS prevention | 100% (verified via contract tests) |
| **Accessibility** | WCAG compliance | WCAG 2.1 AA |
| **Maintainability** | Code coverage | ≥95% (unit + integration) |
| **Testability** | Test automation | 100% of happy paths, 80% of edge cases |

---

## 10. Risk Analysis & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **XSS Vulnerability** | High (data breach, account compromise) | Medium | Use battle-tested sanitizer (DOMPurify), 100% security test coverage, OWASP payload testing |
| **Performance Degradation** | Medium (poor UX) | Medium | Load testing with 1,000 concurrent users, database indexing on user_id/created_at, API response caching |
| **Data Loss** | High (critical) | Low | Database transactions, automated backups, soft deletes for recoverability |
| **Concurrency Issues** | Medium (data corruption) | Low | Optimistic locking via version field, database constraints, conflict resolution |
| **Permission Bypass** | High (unauthorized access) | Low | Enforce ownership checks on every operation, unit + integration tests, code review |
| **Unbounded Content Growth** | Medium (storage costs) | Low | 1MB per content limit enforced, soft delete reclaim, monitor database growth |

---

## 11. Success Metrics

**Definition of Done (DoDcheckl)**:
- ✅ All API endpoints implemented and tested
- ✅ Frontend components rendering correctly with user interactions
- ✅ Content persistence working (CRUD operations)
- ✅ Authentication & RBAC enforced
- ✅ Sanitization prevents all XSS payloads
- ✅ Export functionality works for all formats
- ✅ ≥95% test coverage (unit + integration)
- ✅ API performance <200ms p90
- ✅ All error scenarios handled gracefully
- ✅ Documentation complete (API docs, component docs, etc.)
- ✅ Code review passed
- ✅ QA sign-off
- ✅ Deployed to staging
- ✅ End-to-end smoke test on staging passed

**Launch Readiness Checklist**:
- [ ] All tasks completed and tested
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] QA regression testing passed
- [ ] Documentation updated
- [ ] Release notes prepared
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 12. Deliverables & Timeline

### 12.1 Deliverables

1. **Architectural Specification** (this document) ✅
2. **Frontend Component Implementation** (DEV-UI-08-01)
3. **Backend API Implementation** (DEV-UI-08-02)
4. **Database Schema & Migrations** (DEV-UI-08-03)
5. **Integration Tests** (DEV-UI-08-04)
6. **Security Testing** (DEV-UI-08-05)
7. **Documentation** (DEV-UI-08-06)
8. **Deployment & Monitoring** (DEV-UI-08-07)

### 12.2 Estimated Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| DEV-UI-08-01 (Frontend) | 3-4 days | Spec approved |
| DEV-UI-08-02 (Backend API) | 3-4 days | Spec approved |
| DEV-UI-08-03 (DB Schema) | 1 day | Spec approved |
| DEV-UI-08-04 (Integration Tests) | 2 days | Dev (01, 02, 03) |
| DEV-UI-08-05 (Security) | 1 day | Dev (01, 02) |
| DEV-UI-08-06 (Docs) | 1 day | All tasks |
| DEV-UI-08-07 (Deployment) | 0.5 days | All tasks |

**Total**: ~11-12 days (2.5 weeks with code review, QA)

---

## 13. References & Related Documentation

- [Portal UI Architecture](../portal-ui/README.md)
- [IAM & Authentication](../iam/README.md)
- [Database Portability Policy](../db-portability-architecture-spec.md)
- [Ports & Adapters Pattern](../ports-and-adapters.md)
- [AI Agent Conventions](../../ops/rules/agent-conventions.md)
- [Architect Design Checklist](../../ops/rules/architect-design-checklist.md)

---

## 14. Approval & Sign-Off

**Document Status**: ⏳ Awaiting Review

| Role | Name | Sign-Off | Date |
|------|------|----------|------|
| Architect | morgan-lee | ⏳ Pending | - |
| Team Lead | casey-brooks | ⏳ Pending | - |
| QA Lead | mina-li | ⏳ Pending | - |

---

**Next Steps**:
1. ✅ Architect specification complete
2. ⏳ Team Lead reviews for scope/feasibility
3. ⏳ QA lead reviews testing strategy
4. ⏳ Create development tasks (DEV-UI-08-01 through DEV-UI-08-07)
5. ⏳ Open PR for team review
6. ⏳ Dev implementation begins after approval

