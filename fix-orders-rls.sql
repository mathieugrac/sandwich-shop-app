-- Fix RLS policies for orders and order_items
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Public can read order items" ON order_items;

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

-- Also ensure inventory policies are correct
DROP POLICY IF EXISTS "Public can view current inventory" ON daily_inventory;
CREATE POLICY "Public can view current inventory" ON daily_inventory
  FOR SELECT USING (date >= CURRENT_DATE);

-- Allow inventory updates for order processing
CREATE POLICY "Anyone can update inventory" ON daily_inventory
  FOR UPDATE USING (true); 