-- Multi-Organization User Support Migration
-- This script updates the database schema to allow users with the same email 
-- to be associated with multiple organizations

-- STEP 1: Drop existing unique constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;

-- STEP 2: Add new composite unique constraints
-- Email + Organization combo must be unique (same user can exist in multiple orgs)
ALTER TABLE public.users ADD CONSTRAINT users_email_org_unique 
  UNIQUE (email, organization_id);

-- Username + Organization combo must be unique (usernames unique per org)
ALTER TABLE public.users ADD CONSTRAINT users_username_org_unique 
  UNIQUE (username, organization_id);

-- STEP 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_org 
  ON public.users USING btree (email, organization_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_username_org 
  ON public.users USING btree (username, organization_id) TABLESPACE pg_default;

-- STEP 4: Update existing indexes (drop old ones, they'll be recreated above)
DROP INDEX IF EXISTS idx_users_email;

-- The organization_id index already exists, so we keep it
-- CREATE INDEX IF NOT EXISTS idx_users_organization_id 
--   ON public.users USING btree (organization_id) TABLESPACE pg_default;

-- STEP 5: Add auth_user_id column to track Supabase Auth user ID separately from record ID
-- This allows multiple user records per auth user (one per organization)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
  ON public.users USING btree (auth_user_id) TABLESPACE pg_default;

-- Update existing records to set auth_user_id = id for backward compatibility
UPDATE public.users SET auth_user_id = id WHERE auth_user_id IS NULL;

-- OPTIONAL: Add a comment to document the change
COMMENT ON CONSTRAINT users_email_org_unique ON public.users IS 
  'Allows same email across different organizations while preventing duplicates within same org';

COMMENT ON CONSTRAINT users_username_org_unique ON public.users IS 
  'Allows same username across different organizations while preventing duplicates within same org';

COMMENT ON COLUMN public.users.auth_user_id IS 
  'References the Supabase Auth user ID - multiple user records can share the same auth_user_id for multi-org support';