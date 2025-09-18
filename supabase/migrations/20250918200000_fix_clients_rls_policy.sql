-- Fix RLS policy for clients table to allow public access for order creation
-- This allows customers to create orders without authentication

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admin can manage clients" ON clients;

-- Create new policies that allow public access for order creation
CREATE POLICY "Admin can manage clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public to create clients (for order creation)
CREATE POLICY "Anyone can create clients" ON clients
  FOR INSERT WITH CHECK (true);

-- Allow public to read clients (needed for the get_or_create_client function)
CREATE POLICY "Anyone can read clients" ON clients
  FOR SELECT USING (true);

-- Allow public to update clients (needed for the get_or_create_client function)
CREATE POLICY "Anyone can update clients" ON clients
  FOR UPDATE USING (true);
