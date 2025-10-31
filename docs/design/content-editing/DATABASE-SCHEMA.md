# DEV-UI-08-03: Database Schema & Migrations

**Date**: Oct 31, 2025  
**Status**: ✅ Complete  
**Issue**: #160 (DEV-UI-08-03: Database — PostgreSQL Schema & Migrations)  
**Related**: #159 (DEV-UI-08-02: Backend REST API)

---

## Overview

This document describes the PostgreSQL schema for the Content Editing feature (DEV-UI-08). The schema supports:

- **Content Persistence**: User-created content with ownership tracking
- **Versioning**: Immutable version history with point-in-time snapshots
- **Soft Deletes**: Logical deletion with audit trail preservation
- **Performance**: Optimized indexes for common query patterns
- **Referential Integrity**: Foreign key constraints with cascade behavior

---

## Schema Design

### 1. Contents Table

**Purpose**: Stores current version of user-created content

**Columns**:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY | Auto-generated via `gen_random_uuid()` |
| `user_id` | UUID | NOT NULL, FK → users(id) CASCADE | Owner of content |
| `title` | VARCHAR(255) | NOT NULL, CHECK length > 0 | Content title |
| `content` | TEXT | NOT NULL, CHECK length ≤ 1MB | Raw HTML (unsanitized) |
| `sanitized_content` | TEXT | NOT NULL, CHECK length ≤ 1MB | XSS-safe sanitized version |
| `content_type` | VARCHAR(50) | NOT NULL, DEFAULT 'text/html' | MIME type |
| `version` | INTEGER | NOT NULL, DEFAULT 1 | Current version number |
| `deleted_at` | TIMESTAMP | NULL | Soft delete marker; NULL = active |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update (auto via trigger) |

**Constraints**:

- `CONSTRAINT content_length`: `char_length(content) <= 1000000` (1MB)
- `CONSTRAINT sanitized_content_length`: `char_length(sanitized_content) <= 1000000` (1MB)
- `CONSTRAINT title_not_empty`: `char_length(title) > 0`
- Foreign key cascade: `ON DELETE CASCADE` (if user deleted, all content deleted)

**Indexes**:

- `idx_contents_user_id`: Query content by owner
- `idx_contents_user_id_deleted_at`: Query active content for user (WHERE deleted_at IS NULL)
- `idx_contents_created_at`: Time-series queries
- `idx_contents_updated_at`: Recent updates

**Trigger**:

- `trigger_update_contents_updated_at`: Automatically updates `updated_at` on every UPDATE

### 2. Content Versions Table

**Purpose**: Stores immutable version history

**Columns**:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `content_id` | UUID | NOT NULL, FK → contents(id) CASCADE | Parent content |
| `version` | INTEGER | NOT NULL | Version number (unique per content) |
| `content` | TEXT | NOT NULL, CHECK length > 0 | Immutable snapshot |
| `change_message` | VARCHAR(500) | NULL | Optional user note |
| `created_by` | UUID | NOT NULL, FK → users(id) | Who created version |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When created |

**Constraints**:

- `UNIQUE (content_id, version)`: One version per content ID
- `CHECK version > 0`: Versions are 1-based
- Foreign key cascade: `ON DELETE CASCADE` (versions deleted if content deleted)

**Indexes**:

- `idx_content_versions_content_id`: Query all versions of content
- `idx_content_versions_created_by`: Query versions created by user

---

## Entity Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                         Users (existing)                      │
│                          (user_id)                            │
└──────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │ 1:N                                │ 1:N
           │                                    │
           │ user_id                            │ created_by
           │                                    │
┌──────────────────────────────────────────────────────────────┐
│                     Contents (NEW)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id, title, content, sanitized_content               │   │
│  │ version, deleted_at, created_at, updated_at         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
           ▲
           │ 1:N
           │ content_id
           │
┌──────────────────────────────────────────────────────────────┐
│                Content Versions (NEW)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id, version, content, change_message                │   │
│  │ created_at                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Relationships**:

- **Users → Contents** (1:N via user_id): One user has many content items
- **Users → Content Versions** (1:N via created_by): One user creates many versions
- **Contents → Content Versions** (1:N via content_id): One content has many versions
- **Content Versions → Contents** (N:1): Each version belongs to one content
- **Content Versions → Users** (N:1): Each version created by one user

---

## Migration Details

### File Location

```
client/api/src/database/migrations/001_create_content_tables.sql
```

### Execution

The migration is idempotent (uses `IF NOT EXISTS` clauses), so it can be run multiple times safely:

```bash
# Using psql
psql -h localhost -U postgres -d max_ai_db -f client/api/src/database/migrations/001_create_content_tables.sql

# Or within a migration tool (e.g., TypeORM, Migrate.js)
# See backend implementation for migration runner configuration
```

### Components Created

1. **Contents Table** with:
   - UUID primary key
   - Foreign key to users table
   - Soft delete support via `deleted_at` column
   - Auto-updating `updated_at` via trigger
   - 4 performance indexes

2. **Content Versions Table** with:
   - Immutable version storage
   - Unique constraint on (content_id, version)
   - 2 performance indexes

3. **Helper Functions**:
   - `update_contents_updated_at()`: Trigger function for auto-update timestamps

4. **Documentation**:
   - Column comments for schema clarity
   - Table comments for entity descriptions

---

## Performance Considerations

### Indexes

| Index | Query Pattern | Coverage |
|-------|---------------|----------|
| `idx_contents_user_id` | "Get all content for user" | Used by GET /api/content |
| `idx_contents_user_id_deleted_at` | "Get active content for user" | Filtered soft-delete queries |
| `idx_contents_created_at` | "Recent content" | Ordering/filtering |
| `idx_contents_updated_at` | "Recently updated" | Activity feeds |
| `idx_content_versions_content_id` | "Get version history" | GET /api/content/:id/versions |
| `idx_content_versions_created_by` | "Versions by author" | Audit queries |

### Query Estimates (P90)

Expected response times for key queries:

- `SELECT * FROM contents WHERE user_id = ? AND deleted_at IS NULL` → **< 10ms** (with index)
- `SELECT * FROM content_versions WHERE content_id = ? ORDER BY version DESC` → **< 5ms** (with index)
- `SELECT COUNT(*) FROM contents WHERE user_id = ?` → **< 10ms** (indexed aggregation)

### Soft Delete Impact

- **Soft delete queries**: Use `WHERE deleted_at IS NULL` to filter active content
- **Partial index**: `idx_contents_user_id_deleted_at` provides fast queries for active content
- **Storage**: Deleted rows remain in table; periodic archival/purge needed for very old data

---

## Constraints and Validation

### Size Limits

- **Content**: Max 1MB (1,000,000 characters)
- **Title**: Max 255 characters, min 1 character
- **Change Message**: Max 500 characters
- **Content Type**: Max 50 characters

These are enforced both at database (CHECK constraints) and application level (validation).

### Referential Integrity

- **ON DELETE CASCADE**: If a user is deleted, all their content and versions are deleted
- Foreign keys prevent:
  - Creating content with non-existent user_id
  - Creating versions with non-existent content_id or created_by

---

## Migration Rollback

To rollback (remove tables):

```sql
DROP TRIGGER IF EXISTS trigger_update_contents_updated_at ON contents;
DROP FUNCTION IF EXISTS update_contents_updated_at();
DROP TABLE IF EXISTS content_versions CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
```

⚠️ **WARNING**: This is destructive and removes all data. Use only in development.

---

## Acceptance Criteria

- ✅ `contents` table created with all required columns
- ✅ `content_versions` table created with immutable storage
- ✅ Foreign key constraints enforced (CASCADE delete)
- ✅ Soft delete support via `deleted_at` column
- ✅ Primary keys are UUIDs
- ✅ Timestamps auto-managed (NOW(), trigger)
- ✅ All indexes created for query optimization
- ✅ UNIQUE constraint on (content_id, version)
- ✅ CHECK constraints for size limits
- ✅ Migration is idempotent (IF NOT EXISTS)
- ✅ Comprehensive comments for documentation

---

## Next Steps

**DEV-UI-08-02 (Backend REST API)** can now proceed with:

1. `IContentRepository` interface implementation
2. `ContentService` with business logic (sanitization, versioning, RBAC)
3. 7 REST endpoint handlers
4. Request validation with schemas
5. Error handling and observability

---

## References

- **Specification**: `/docs/design/content-editing/DEV-UI-08-specification.md` (Section 5.2)
- **Frontend Types**: `/client/web/src/types/content.ts`
- **Backend Types**: `/client/api/src/types/content.ts`
- **Migration File**: `/client/api/src/database/migrations/001_create_content_tables.sql`

---

**Migration Created**: 2025-10-31  
**Ready for Backend Implementation**: ✅ YES
