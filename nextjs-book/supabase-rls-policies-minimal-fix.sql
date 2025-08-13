-- Minimal fix for RLS policies - just add the missing policy for users to read their own profile

-- Add the critical missing policy that allows users to read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Update the helper functions to work with our current setup (without dropping)
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