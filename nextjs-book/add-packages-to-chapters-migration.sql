-- Migration to add packages column to chapters table
-- This simplifies the package management from complex tables to simple array storage

-- Add packages column to chapters table to store package names as JSON array
ALTER TABLE chapters ADD COLUMN packages JSONB DEFAULT '[]'::jsonb;

-- Add index for package searches
CREATE INDEX idx_chapters_packages ON chapters USING GIN (packages);

-- Add comment
COMMENT ON COLUMN chapters.packages IS 'Array of Python package names (strings) required for this chapter';

-- Example data update (if needed)
-- UPDATE chapters SET packages = '["numpy", "pandas", "matplotlib"]' WHERE id = 'some-chapter-id';