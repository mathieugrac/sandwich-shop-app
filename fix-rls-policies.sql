-- Fix RLS policies to allow inventory management
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view current inventory" ON daily_inventory;

-- Create new policies that allow inventory management
CREATE POLICY "Public can view current inventory" ON daily_inventory
  FOR SELECT USING (date >= CURRENT_DATE);

-- Allow inserting inventory (for admin setup)
CREATE POLICY "Anyone can insert inventory" ON daily_inventory
  FOR INSERT WITH CHECK (true);

-- Allow updating inventory (for admin management)
CREATE POLICY "Anyone can update inventory" ON daily_inventory
  FOR UPDATE USING (true);

-- Also fix the orders policy to allow public inserts
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Allow public to insert order items
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Allow public to read order items for their orders
CREATE POLICY "Public can read order items" ON order_items
  FOR SELECT USING (true); 