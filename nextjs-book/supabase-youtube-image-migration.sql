-- Supabase Migration: Add YouTube Video and Image Support to Sections
-- This script extends the section_type enum to support YouTube videos and images
-- Run this script in your Supabase SQL editor

-- Add new values to the existing section_type enum
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'YOUTUBE';
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'IMAGE';

-- The sections table already exists with the structure we need:
-- - content TEXT: will store YouTube URL/ID for videos, image URL/base64 for images
-- - type section_type: now supports 'MARKDOWN', 'PYTHON', 'YOUTUBE', 'IMAGE'
-- - title TEXT: will store video title or image caption
-- - All other fields remain the same

-- No table structure changes needed - the existing content field can handle:
-- For YouTube: Store the full YouTube URL (e.g., "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
-- For Images: Store image URL or we can extend this later for file uploads

-- Optional: Add a metadata column for additional properties (annotations, timestamps, etc.)
-- Uncomment the next line if you want to add metadata support:
-- ALTER TABLE sections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Verify the enum values were added successfully
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'section_type'
) ORDER BY enumlabel;