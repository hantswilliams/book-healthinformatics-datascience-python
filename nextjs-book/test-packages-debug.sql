-- Debug script to check if packages column exists and has data

-- Check if the packages column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chapters' AND column_name = 'packages';

-- Check current chapters and their packages
SELECT id, title, packages, created_at 
FROM chapters 
ORDER BY created_at DESC 
LIMIT 10;

-- Add sample packages to the chapter you're testing (replace the ID with your chapter ID)
-- UPDATE chapters 
-- SET packages = '["pandas", "numpy", "matplotlib"]'::jsonb 
-- WHERE id = '0b919fc6-ed79-4093-8633-adf0f5d268ef';

-- Verify the update
-- SELECT id, title, packages 
-- FROM chapters 
-- WHERE id = '0b919fc6-ed79-4093-8633-adf0f5d268ef';