-- Migration: Create Content Editing Tables
-- Date: 2025-10-31
-- Description: Creates contents and content_versions tables with proper indexing and constraints
-- References: DEV-UI-08 specification (Section 5.2)

-- ============================================================================
-- Create Contents Table
-- ============================================================================
-- Stores user-created content with versioning support
-- Each row represents the current version of a piece of content

CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sanitized_content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL DEFAULT 'text/html',
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) <= 1000000),
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT sanitized_content_length CHECK (char_length(sanitized_content) <= 1000000)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_user_id_deleted_at ON contents(user_id, deleted_at) 
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
CREATE INDEX IF NOT EXISTS idx_contents_updated_at ON contents(updated_at);

-- ============================================================================
-- Create Content Versions Table
-- ============================================================================
-- Stores version history for content
-- Each update to content creates a new version record

CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_message VARCHAR(500),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (content_id, version),
  CONSTRAINT version_positive CHECK (version > 0),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Create indexes for version queries
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_by ON content_versions(created_by);

-- ============================================================================
-- Create or Replace Helper Functions
-- ============================================================================

-- Function to update the updated_at timestamp on contents table
CREATE OR REPLACE FUNCTION update_contents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_update_contents_updated_at ON contents;

-- Trigger to automatically update updated_at on content changes
CREATE TRIGGER trigger_update_contents_updated_at
BEFORE UPDATE ON contents
FOR EACH ROW
EXECUTE FUNCTION update_contents_updated_at();

-- ============================================================================
-- Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE contents IS 'Stores user-created content with current version tracking';
COMMENT ON COLUMN contents.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN contents.user_id IS 'Foreign key to users table; ON DELETE CASCADE';
COMMENT ON COLUMN contents.title IS 'Content title (max 255 chars)';
COMMENT ON COLUMN contents.content IS 'Raw HTML content (max 1MB)';
COMMENT ON COLUMN contents.sanitized_content IS 'XSS-safe sanitized content (max 1MB)';
COMMENT ON COLUMN contents.content_type IS 'MIME type (default: text/html)';
COMMENT ON COLUMN contents.version IS 'Current version number; increments on update';
COMMENT ON COLUMN contents.deleted_at IS 'Soft delete timestamp; NULL = not deleted';
COMMENT ON COLUMN contents.created_at IS 'When content was created';
COMMENT ON COLUMN contents.updated_at IS 'When content was last updated (auto-updated)';

COMMENT ON TABLE content_versions IS 'Stores version history for content';
COMMENT ON COLUMN content_versions.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN content_versions.content_id IS 'Foreign key to contents table; ON DELETE CASCADE';
COMMENT ON COLUMN content_versions.version IS 'Version number (unique per content_id)';
COMMENT ON COLUMN content_versions.content IS 'Content snapshot at this version';
COMMENT ON COLUMN content_versions.change_message IS 'Optional user-provided change description';
COMMENT ON COLUMN content_versions.created_by IS 'User ID who created this version';
COMMENT ON COLUMN content_versions.created_at IS 'When this version was created';
