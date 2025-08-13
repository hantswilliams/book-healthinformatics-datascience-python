-- Fixed Row Level Security (RLS) Policies
-- Updated to work with current auth setup without JWT metadata

-- First, drop existing policies and functions
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Owners and admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "New users can insert themselves" ON users;

DROP FUNCTION IF EXISTS public.user_organization_id();
DROP FUNCTION IF EXISTS public.user_role();

-- Create updated helper functions that query the users table
CREATE OR REPLACE FUNCTION public.user_organization_id() 
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id 
  FROM users 
  WHERE id = auth.uid() AND is_active = true;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_role() 
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM users 
  WHERE id = auth.uid() AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (id = public.user_organization_id());

CREATE POLICY "Owners and admins can update their organization" ON organizations
  FOR UPDATE USING (
    id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN')
  );

-- Updated Users policies - CRITICAL FIX: Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

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