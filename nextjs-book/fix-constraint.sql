-- Fix the foreign key constraint issue
-- Run this in your Supabase SQL editor

ALTER TABLE code_executions 
DROP CONSTRAINT IF EXISTS code_executions_user_chapter_idx;