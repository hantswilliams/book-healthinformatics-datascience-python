-- Additional Migration: Add auth_user_id column
-- Run this AFTER running migration-multi-org.sql

-- STEP 5: Add auth_user_id column to track Supabase Auth user ID separately from record ID
-- This allows multiple user records per auth user (one per organization)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
  ON public.users USING btree (auth_user_id) TABLESPACE pg_default;

-- Update existing records to set auth_user_id = id for backward compatibility
UPDATE public.users SET auth_user_id = id WHERE auth_user_id IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.users.auth_user_id IS 
  'References the Supabase Auth user ID - multiple user records can share the same auth_user_id for multi-org support';