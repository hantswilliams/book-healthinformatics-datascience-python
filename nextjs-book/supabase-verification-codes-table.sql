-- Create verification_codes table for 6-digit login codes
CREATE TABLE verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_verification_codes_email ON verification_codes(email);

-- Create index on expires_at for cleanup queries
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow anonymous users to read verification codes (for verification)
CREATE POLICY "Allow anonymous read access" ON verification_codes
  FOR SELECT
  TO anon
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON verification_codes
  FOR ALL
  TO service_role
  USING (true);

-- Allow authenticated users to update their verification attempts
CREATE POLICY "Allow authenticated users to update verification codes" ON verification_codes
  FOR UPDATE
  TO authenticated
  USING (true);

-- Function to clean up expired codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE verification_codes IS 'Stores 6-digit verification codes for passwordless login';