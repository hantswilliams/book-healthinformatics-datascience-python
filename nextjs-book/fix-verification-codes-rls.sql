-- Fix RLS policy for verification_codes table
-- This allows inserts and deletes for verification codes

-- Enable RLS on the table (if not already enabled)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert verification codes (for signup/login)
CREATE POLICY "Allow anonymous inserts for verification codes" 
ON public.verification_codes 
FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (true);

-- Allow anonymous users to select verification codes (for code verification)
CREATE POLICY "Allow anonymous selects for verification codes" 
ON public.verification_codes 
FOR SELECT 
TO anon, authenticated, service_role
USING (true);

-- Allow deleting expired or used verification codes
CREATE POLICY "Allow deletes for verification codes" 
ON public.verification_codes 
FOR DELETE 
TO anon, authenticated, service_role
USING (true);

-- Allow updates for verification codes (to mark as used, increment attempts)
CREATE POLICY "Allow updates for verification codes" 
ON public.verification_codes 
FOR UPDATE 
TO anon, authenticated, service_role
USING (true);