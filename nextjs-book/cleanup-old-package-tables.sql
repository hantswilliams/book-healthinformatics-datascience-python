-- Cleanup script to remove old complex package management tables
-- Run this ONLY if you want to completely remove the old system

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS chapter_packages_with_details;
DROP VIEW IF EXISTS package_set_contents;

-- Drop tables in dependency order
DROP TABLE IF EXISTS package_load_logs;
DROP TABLE IF EXISTS package_set_items;
DROP TABLE IF EXISTS organization_package_sets;
DROP TABLE IF EXISTS chapter_packages;
DROP TABLE IF EXISTS python_packages;

-- Drop any related functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS increment_package_set_usage();

-- Now run the simplified migration
-- Add packages column to chapters table to store package names as JSON array
ALTER TABLE chapters ADD COLUMN packages JSONB DEFAULT '[]'::jsonb;

-- Add index for package searches
CREATE INDEX idx_chapters_packages ON chapters USING GIN (packages);

-- Add comment
COMMENT ON COLUMN chapters.packages IS 'Array of Python package names (strings) required for this chapter';