-- Migration: Create code_executions table for tracking learner code attempts
-- Run this in your Supabase SQL editor

-- Create code_executions table
CREATE TABLE IF NOT EXISTS code_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  section_id VARCHAR(255) NOT NULL, -- Identifier for specific code block within chapter
  code_content TEXT NOT NULL, -- The actual code that was executed
  execution_result TEXT, -- Output/result of the code execution (nullable)
  execution_status VARCHAR(20) NOT NULL CHECK (execution_status IN ('success', 'error', 'timeout')),
  error_message TEXT, -- Error details if execution failed (nullable)
  execution_mode VARCHAR(20) NOT NULL CHECK (execution_mode IN ('shared', 'isolated')),
  context_id VARCHAR(255) NOT NULL, -- Context identifier (chapter ID for shared, section ID for isolated)
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id UUID -- To group related executions (optional)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_code_executions_user_id ON code_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_chapter_id ON code_executions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_organization_id ON code_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_executed_at ON code_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_executions_status ON code_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_code_executions_user_chapter ON code_executions(user_id, chapter_id);

-- Enable Row Level Security
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for code_executions table

-- Users can view their own code executions
CREATE POLICY "Users can view their own code executions" ON code_executions
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own code executions
CREATE POLICY "Users can insert their own code executions" ON code_executions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    organization_id = public.user_organization_id()
  );

-- Instructors and admins can view all code executions in their organization
CREATE POLICY "Instructors and admins can view organization code executions" ON code_executions
  FOR SELECT USING (
    organization_id = public.user_organization_id() AND 
    public.user_role() IN ('OWNER', 'ADMIN', 'INSTRUCTOR')
  );

-- Add helpful view for admin dashboard
CREATE OR REPLACE VIEW admin_code_execution_stats AS
SELECT 
  ce.organization_id,
  ce.user_id,
  u.first_name,
  u.last_name,
  u.email,
  ce.chapter_id,
  c.title as chapter_title,
  ce.section_id,
  COUNT(*) as total_executions,
  COUNT(CASE WHEN ce.execution_status = 'success' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN ce.execution_status = 'error' THEN 1 END) as error_executions,
  MAX(ce.executed_at) as last_execution,
  MIN(ce.executed_at) as first_execution
FROM code_executions ce
JOIN users u ON ce.user_id = u.id
JOIN chapters c ON ce.chapter_id = c.id
GROUP BY ce.organization_id, ce.user_id, u.first_name, u.last_name, u.email, 
         ce.chapter_id, c.title, ce.section_id;

-- Grant access to the view (RLS is handled by underlying tables)
GRANT SELECT ON admin_code_execution_stats TO authenticated;