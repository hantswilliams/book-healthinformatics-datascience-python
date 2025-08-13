-- Row Level Security (RLS) Policies - Clean Install
-- Multi-tenant security enforcement at the database level

-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update their organization" ON organizations;

DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Owners and admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "New users can insert themselves" ON users;

DROP POLICY IF EXISTS "Users can view invitations for their organization" ON invitations;
DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON invitations;

DROP POLICY IF EXISTS "Users can view books accessible to their organization" ON books;
DROP POLICY IF EXISTS "Content creators can manage their books" ON books;
DROP POLICY IF EXISTS "Admins and instructors can create books" ON books;

DROP POLICY IF EXISTS "Users can view book access for their organization" ON book_access;
DROP POLICY IF EXISTS "Admins can manage book access" ON book_access;

DROP POLICY IF EXISTS "Users can view chapters of accessible books" ON chapters;
DROP POLICY IF EXISTS "Content creators can manage chapters" ON chapters;

DROP POLICY IF EXISTS "Users can view sections of accessible chapters" ON sections;
DROP POLICY IF EXISTS "Content creators can manage sections" ON sections;

DROP POLICY IF EXISTS "Users can view their own progress" ON progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON progress;
DROP POLICY IF EXISTS "Instructors and admins can view organization progress" ON progress;

DROP POLICY IF EXISTS "Users can view their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can create and update their own exercises" ON exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON exercises;
DROP POLICY IF EXISTS "Instructors and admins can view organization exercises" ON exercises;

DROP POLICY IF EXISTS "Owners can view billing events" ON billing_events;
DROP POLICY IF EXISTS "System can insert billing events" ON billing_events;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.user_organization_id();
DROP FUNCTION IF EXISTS public.user_role();

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization ID from JWT
CREATE OR REPLACE FUNCTION public.user_organization_id() 
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role from JWT
CREATE OR REPLACE FUNCTION public.user_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() -> 'app_metadata' ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (id = public.user_organization_id());

CREATE POLICY "Owners and admins can update their organization" ON organizations
  FOR UPDATE USING (
    id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN')
  );

-- Users policies
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Owners and admins can manage users in their organization" ON users
  FOR ALL USING (
    organization_id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "New users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Invitations policies
CREATE POLICY "Users can view invitations for their organization" ON invitations
  FOR SELECT USING (organization_id = public.user_organization_id());

CREATE POLICY "Owners and admins can manage invitations" ON invitations
  FOR ALL USING (
    organization_id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN')
  );

-- Books policies
CREATE POLICY "Users can view books accessible to their organization" ON books
  FOR SELECT USING (
    -- Organization-specific books
    organization_id = public.user_organization_id() OR 
    -- Public marketplace books
    is_public = TRUE OR
    -- Books with explicit access granted
    id IN (
      SELECT book_id FROM book_access 
      WHERE organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Content creators can manage their books" ON books
  FOR ALL USING (
    organization_id = public.user_organization_id() AND 
    (created_by = auth.uid() OR public.user_role() IN ('OWNER', 'ADMIN'))
  );

CREATE POLICY "Admins and instructors can create books" ON books
  FOR INSERT WITH CHECK (
    organization_id = public.user_organization_id() AND
    created_by = auth.uid() AND
    public.user_role() IN ('OWNER', 'ADMIN', 'INSTRUCTOR')
  );

-- Book access policies
CREATE POLICY "Users can view book access for their organization" ON book_access
  FOR SELECT USING (organization_id = public.user_organization_id());

CREATE POLICY "Admins can manage book access" ON book_access
  FOR ALL USING (
    organization_id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN')
  );

-- Chapters policies
CREATE POLICY "Users can view chapters of accessible books" ON chapters
  FOR SELECT USING (
    book_id IN (
      SELECT id FROM books WHERE 
        organization_id = public.user_organization_id() OR 
        is_public = TRUE OR
        id IN (
          SELECT book_id FROM book_access 
          WHERE organization_id = public.user_organization_id()
        )
    )
  );

CREATE POLICY "Content creators can manage chapters" ON chapters
  FOR ALL USING (
    book_id IN (
      SELECT id FROM books WHERE 
        organization_id = public.user_organization_id() AND 
        (created_by = auth.uid() OR public.user_role() IN ('OWNER', 'ADMIN'))
    )
  );

-- Sections policies
CREATE POLICY "Users can view sections of accessible chapters" ON sections
  FOR SELECT USING (
    chapter_id IN (
      SELECT c.id FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE 
        b.organization_id = public.user_organization_id() OR 
        b.is_public = TRUE OR
        b.id IN (
          SELECT book_id FROM book_access 
          WHERE organization_id = public.user_organization_id()
        )
    )
  );

CREATE POLICY "Content creators can manage sections" ON sections
  FOR ALL USING (
    chapter_id IN (
      SELECT c.id FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE 
        b.organization_id = public.user_organization_id() AND 
        (b.created_by = auth.uid() OR public.user_role() IN ('OWNER', 'ADMIN'))
    )
  );

-- Progress policies
CREATE POLICY "Users can view their own progress" ON progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their own progress" ON progress
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Instructors and admins can view organization progress" ON progress
  FOR SELECT USING (
    public.user_role() IN ('OWNER', 'ADMIN', 'INSTRUCTOR') AND
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
  );

-- Exercises policies
CREATE POLICY "Users can view their own exercises" ON exercises
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create and update their own exercises" ON exercises
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their own exercises" ON exercises
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Instructors and admins can view organization exercises" ON exercises
  FOR SELECT USING (
    public.user_role() IN ('OWNER', 'ADMIN', 'INSTRUCTOR') AND
    user_id IN (
      SELECT id FROM users WHERE organization_id = public.user_organization_id()
    )
  );

-- Billing events policies (owners only)
CREATE POLICY "Owners can view billing events" ON billing_events
  FOR SELECT USING (
    organization_id = public.user_organization_id() AND 
    public.user_role() = 'OWNER'
  );

CREATE POLICY "System can insert billing events" ON billing_events
  FOR INSERT WITH CHECK (true); -- This will be restricted by service role key

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;