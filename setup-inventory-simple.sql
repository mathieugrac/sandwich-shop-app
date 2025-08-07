-- Simple inventory setup script
-- Run this in your Supabase SQL editor

-- Temporarily disable RLS for inventory setup
ALTER TABLE daily_inventory DISABLE ROW LEVEL SECURITY;

-- Clear existing inventory for today
DELETE FROM daily_inventory WHERE date = CURRENT_DATE;

-- Insert inventory for today
INSERT INTO daily_inventory (product_id, date, total_quantity, reserved_quantity)
SELECT 
  p.id,
  CURRENT_DATE,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 0
    WHEN p.name = 'Umami Mush' THEN 20
    WHEN p.name = 'Burgundy Beef' THEN 3
    ELSE 10
  END,
  0
FROM products p;

-- Re-enable RLS
ALTER TABLE daily_inventory ENABLE ROW LEVEL SECURITY;

-- Create proper policies
DROP POLICY IF EXISTS "Public can view current inventory" ON daily_inventory;
CREATE POLICY "Public can view current inventory" ON daily_inventory
  FOR SELECT USING (date >= CURRENT_DATE);

-- Allow admin operations (you can restrict this later)
CREATE POLICY "Admin can manage inventory" ON daily_inventory
  FOR ALL USING (true);

-- Verify the data
SELECT 
  p.name,
  di.total_quantity,
  di.reserved_quantity,
  di.available_quantity
FROM daily_inventory di
JOIN products p ON di.product_id = p.id
WHERE di.date = CURRENT_DATE
ORDER BY p.sort_order; 