-- Migration: Secure order_sequences table with RLS
-- This prevents unauthorized access to order sequence data

-- Enable Row Level Security on order_sequences table
ALTER TABLE order_sequences ENABLE ROW LEVEL SECURITY;

-- Create policy: Only service role can access order_sequences
-- This table should only be accessed by the generate_order_number() function
CREATE POLICY "Service role only access" ON order_sequences
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy: No public access to order_sequences
-- Explicitly deny all public access
CREATE POLICY "No public access" ON order_sequences
  FOR ALL 
  TO public
  USING (false)
  WITH CHECK (false);

-- Add comment explaining the security model
COMMENT ON TABLE order_sequences IS 'Tracks sequential order numbering per drop date. Access restricted to service role only for security.';
