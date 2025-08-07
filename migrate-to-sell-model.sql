-- Migration script to update database schema for sell-based business model
-- Run this in Supabase SQL editor

-- Step 1: Create new sells table
CREATE TABLE IF NOT EXISTS sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_date DATE NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  announcement_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create sell_inventory table
CREATE TABLE IF NOT EXISTS sell_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_id UUID REFERENCES sells(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  total_quantity INTEGER NOT NULL,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sell_id, product_id)
);

-- Step 3: Add sell_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sell_id UUID REFERENCES sells(id) ON DELETE CASCADE;

-- Step 4: Update order status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled'));

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sells_date ON sells(sell_date);
CREATE INDEX IF NOT EXISTS idx_sells_status ON sells(status);
CREATE INDEX IF NOT EXISTS idx_orders_sell_id ON orders(sell_id);
CREATE INDEX IF NOT EXISTS idx_sell_inventory_sell_id ON sell_inventory(sell_id);

-- Step 6: Enable RLS on new tables
ALTER TABLE sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_inventory ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for sells
CREATE POLICY "Public can view active sells" ON sells
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admin can manage sells" ON sells
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 8: Create RLS policies for sell_inventory
CREATE POLICY "Public can view active sell inventory" ON sell_inventory
  FOR SELECT USING (
    sell_id IN (
      SELECT id FROM sells WHERE status = 'active'
    )
  );

CREATE POLICY "Admin can manage sell inventory" ON sell_inventory
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Create function to get next active sell
CREATE OR REPLACE FUNCTION get_next_active_sell()
RETURNS TABLE (
  id UUID,
  sell_date DATE,
  status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.sell_date, s.status
  FROM sells s
  WHERE s.status = 'active'
  AND s.sell_date >= CURRENT_DATE
  ORDER BY s.sell_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create function to reserve inventory for sell
CREATE OR REPLACE FUNCTION reserve_sell_inventory(p_sell_id UUID, p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM sell_inventory
  WHERE sell_id = p_sell_id AND product_id = p_product_id;

  IF available_qty >= p_quantity THEN
    UPDATE sell_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE sell_id = p_sell_id AND product_id = p_product_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Insert sample sell for testing (optional)
-- INSERT INTO sells (sell_date, status, announcement_sent) 
-- VALUES (CURRENT_DATE + INTERVAL '1 day', 'active', false);

-- Step 12: Create sample sell inventory (optional)
-- INSERT INTO sell_inventory (sell_id, product_id, total_quantity, reserved_quantity)
-- SELECT 
--   s.id,
--   p.id,
--   CASE 
--     WHEN p.name = 'Nutty Beet' THEN 0
--     WHEN p.name = 'Umami Mush' THEN 20
--     WHEN p.name = 'Burgundy Beef' THEN 3
--     ELSE 10
--   END,
--   0
-- FROM sells s
-- CROSS JOIN products p
-- WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day'
-- AND p.active = true;

-- Migration complete!
-- Note: You may need to update existing orders to link to sells
-- and migrate existing daily_inventory data to sell_inventory 