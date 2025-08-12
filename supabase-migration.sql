-- Migration script to update existing database schema
-- Run this after your existing schema is in place

-- 1. Create new tables that don't exist yet

-- Locations table (NEW)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  google_maps_link TEXT,
  delivery_timeframe VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table (NEW - for multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (NEW)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- 2. Modify existing tables

-- Add location_id to sells table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sells' AND column_name = 'location_id') THEN
    ALTER TABLE sells ADD COLUMN location_id UUID;
  END IF;
END $$;

-- Add foreign key constraint for location_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sells' 
    AND constraint_name = 'sells_location_id_fkey'
  ) THEN
    ALTER TABLE sells ADD CONSTRAINT sells_location_id_fkey 
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Remove unique constraint on sell_date if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'sells' AND constraint_name = 'sells_sell_date_key') THEN
    ALTER TABLE sells DROP CONSTRAINT sells_sell_date_key;
  END IF;
END $$;

-- Add client_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'client_id') THEN
    ALTER TABLE orders ADD COLUMN client_id UUID;
  END IF;
END $$;

-- Add sell_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'sell_id') THEN
    ALTER TABLE orders ADD COLUMN sell_id UUID;
  END IF;
END $$;

-- Remove pickup_date from orders if it exists (since we now use sell_id)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pickup_date') THEN
    ALTER TABLE orders DROP COLUMN pickup_date;
  END IF;
END $$;

-- Update order status enum if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
    -- First, drop the existing constraint if it exists
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- Check if 'ready' status exists and update to 'prepared' if needed
    UPDATE orders SET status = 'prepared' WHERE status = 'ready';
    
    -- Now add the new constraint
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled'));
  END IF;
END $$;

-- 3. Create or replace functions

-- Function to get next active sell (UPDATED - considers location delivery timeframes)
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS get_next_active_sell();

CREATE OR REPLACE FUNCTION get_next_active_sell()
RETURNS TABLE (id UUID, sell_date DATE, status VARCHAR(20), location_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.sell_date, s.status, s.location_id
  FROM sells s
  JOIN locations l ON s.location_id = l.id
  WHERE s.status = 'active' 
    AND s.sell_date >= CURRENT_DATE
    AND l.active = true
  ORDER BY s.sell_date ASC, l.delivery_timeframe ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve sell inventory
CREATE OR REPLACE FUNCTION reserve_sell_inventory(
  p_sell_id UUID, p_product_id UUID, p_quantity INTEGER)
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

-- Function to auto-complete sells after delivery timeframe (NEW)
CREATE OR REPLACE FUNCTION auto_complete_expired_sells()
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER := 0;
  sell_record RECORD;
BEGIN
  -- Find sells that should be auto-completed (30 minutes after delivery timeframe)
  FOR sell_record IN
    SELECT s.id, s.sell_date, l.delivery_timeframe
    FROM sells s
    JOIN locations l ON s.location_id = l.id
    WHERE s.status = 'active'
      AND s.sell_date <= CURRENT_DATE
      AND l.delivery_timeframe IS NOT NULL
  LOOP
    -- For now, we'll use a simple logic - complete sells from previous days
    -- In production, you'd want to parse the delivery_timeframe and check actual time
    IF sell_record.sell_date < CURRENT_DATE THEN
      UPDATE sells 
      SET status = 'completed', updated_at = NOW()
      WHERE id = sell_record.id;
      completed_count := completed_count + 1;
    END IF;
  END LOOP;
  
  RETURN completed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create client (NEW)
CREATE OR REPLACE FUNCTION get_or_create_client(
  p_name VARCHAR(100), p_email VARCHAR(255), p_phone VARCHAR(20))
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Try to find existing client by email
  SELECT id INTO client_id
  FROM clients
  WHERE email = p_email;
  
  IF client_id IS NOT NULL THEN
    -- Update existing client info if name/phone changed
    UPDATE clients 
    SET name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = client_id;
    RETURN client_id;
  ELSE
    -- Create new client
    INSERT INTO clients (name, email, phone)
    VALUES (p_name, p_email, p_phone)
    RETURNING id INTO client_id;
    RETURN client_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for new tables

-- Public read access for active locations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Public can view active locations') THEN
    CREATE POLICY "Public can view active locations" ON locations
      FOR SELECT USING (active = true);
  END IF;
END $$;

-- Authenticated admin access for locations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Admin can manage locations') THEN
    CREATE POLICY "Admin can manage locations" ON locations
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated admin access for product images
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Admin can manage product images') THEN
    CREATE POLICY "Admin can manage product images" ON product_images
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Authenticated admin access for clients
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Admin can manage clients') THEN
    CREATE POLICY "Admin can manage clients" ON clients
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 6. Insert sample data

-- Sample locations data (only if locations table is empty)
INSERT INTO locations (name, district, address, google_maps_link, delivery_timeframe)
SELECT 'Impact Hub', 'Penha da França', 'Rua Fialho de Almeida 3, 1170-131 Lisboa', 'https://maps.google.com/?q=Impact+Hub+Lisboa', '12:00-14:00'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Impact Hub');

-- 7. Update existing sells to have a location (if they don't have one)
UPDATE sells 
SET location_id = (SELECT id FROM locations WHERE name = 'Impact Hub' LIMIT 1)
WHERE location_id IS NULL;

-- 8. Create sell_inventory entries for existing sells if they don't exist
INSERT INTO sell_inventory (sell_id, product_id, total_quantity, reserved_quantity)
SELECT 
  s.id,
  p.id,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 20
    WHEN p.name = 'Umami Mush' THEN 25
    WHEN p.name = 'Burgundy Beef' THEN 15
    ELSE 20
  END,
  0
FROM sells s, products p
WHERE s.status = 'draft'
  AND NOT EXISTS (
    SELECT 1 FROM sell_inventory si 
    WHERE si.sell_id = s.id AND si.product_id = p.id
  );
