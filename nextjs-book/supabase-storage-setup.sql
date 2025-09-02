-- Supabase Storage Setup for Course Content Images
-- This script creates the storage bucket and policies for image uploads
-- Run this script in your Supabase SQL editor

-- Create the storage bucket for course content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-content', 
  'course-content', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload images to their organization folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for course content" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage images in their organization folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images in their organization folder" ON storage.objects;

-- Policy: Allow authenticated users to upload images (simplified for now)
CREATE POLICY "Authenticated users can upload to course-content"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'course-content' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access for course content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-content');

-- Policy: Allow authenticated users to manage their uploads
CREATE POLICY "Authenticated users can update course content"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete course content"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-content'
  AND auth.role() = 'authenticated'
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'course-content';