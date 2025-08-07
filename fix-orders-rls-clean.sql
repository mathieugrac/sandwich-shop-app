-- Fix RLS policies for orders and order_items (clean version)
-- Run this in your Supabase SQL editor

-- Drop existing policies for orders
DROP POLICY IF EXISTS "Admin can manage orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;

-- Drop existing policies for order_items
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can read order items" ON order_items;

-- Drop existing policies for daily_inventory
DROP POLICY IF EXISTS "Public can view current inventory" ON daily_inventory;
DROP POLICY IF EXISTS "Anyone can insert inventory" ON daily_inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON daily_inventory;
DROP POLICY IF EXISTS "Admin can manage inventory" ON daily_inventory;

-- Create new policies for orders
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON orders
  FOR UPDATE USING (true);

-- Create new policies for order_items
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read order items" ON order_items
  FOR SELECT USING (true);

-- Create new policies for daily_inventory
CREATE POLICY "Public can view current inventory" ON daily_inventory
  FOR SELECT USING (date >= CURRENT_DATE);

CREATE POLICY "Anyone can update inventory" ON daily_inventory
  FOR UPDATE USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'daily_inventory')
ORDER BY tablename, policyname; 