-- ========================================
-- FOMÉ SANDWICH SHOP - CLEAN INITIAL SCHEMA
-- ========================================
-- This migration creates the complete database schema from scratch
-- All tables, functions, RLS policies, and sample data in one clean migration

-- Products table
-- The catalogue of food products being sold
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('sandwich', 'side', 'dessert', 'beverage')),
  sell_price DECIMAL(10,2) NOT NULL,
  production_cost DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allergens TEXT
);

-- Add comment for allergens field
COMMENT ON COLUMN products.allergens IS 'Free-text field for allergen information (e.g., "Contains gluten, dairy, nuts")';

-- Product images table (multiple images per product)
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
-- Places where orders can be delivered/picked up
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  location_url TEXT, -- Google Maps or other location link
  pickup_hour_start TIME NOT NULL,
  pickup_hour_end TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (shop owner/staff)
-- Note: Created before drops table because drops references it
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drops table (replaces "sells" - a sell event at specific time & location)
CREATE TABLE drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_by UUID REFERENCES admin_users(id),
  status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop products table (quantities of products available for a specific drop)
CREATE TABLE drop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
  selling_price DECIMAL(10,2) NOT NULL, -- Captured price at drop level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drop_id, product_id)
);

-- Clients table
-- People who order food through the app (identified by email/phone only)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Orders table
-- Customer orders for a specific drop
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL, -- Name for delivery bag (order-specific)
  pickup_time TIME NOT NULL, -- 15-min slot within location pickup hours
  order_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('active', 'confirmed', 'delivered')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  payment_intent_id TEXT, -- Stripe payment intent ID
  payment_method TEXT, -- Payment method (stripe, cash, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order products table (products ordered by customers)
CREATE TABLE order_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  drop_product_id UUID REFERENCES drop_products(id) ON DELETE RESTRICT,
  order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to get admin past drops with simple metrics
CREATE OR REPLACE FUNCTION get_admin_past_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- Total items prepared
  total_orders BIGINT,       -- Total orders placed
  total_loss BIGINT,         -- Items not ordered (loss)
  loss_percentage DECIMAL    -- Loss as percentage
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available,
    -- Simple inventory calculation: sum all stock quantities
    COALESCE(SUM(dp.stock_quantity), 0) as total_inventory,
    -- Simple orders count: count orders for this drop
    (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_orders,
    -- Simple loss calculation: inventory - orders
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_loss,
    -- Simple percentage: (loss / inventory) * 100
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
      ELSE 0 
    END as loss_percentage
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('completed', 'cancelled')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date DESC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin upcoming drops with simple metrics
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- Total items prepared
  total_orders BIGINT,       -- Total orders placed
  total_loss BIGINT,         -- Items not ordered (loss)
  loss_percentage DECIMAL    -- Loss as percentage
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available,
    -- Simple inventory calculation: sum all stock quantities
    COALESCE(SUM(dp.stock_quantity), 0) as total_inventory,
    -- Simple orders count: count orders for this drop
    (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_orders,
    -- Simple loss calculation: inventory - orders
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_loss,
    -- Simple percentage: (loss / inventory) * 100
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
      ELSE 0 
    END as loss_percentage
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Reserve multiple drop products inventory in batch
CREATE OR REPLACE FUNCTION reserve_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
  available_qty INTEGER;
  can_reserve BOOLEAN := TRUE;
BEGIN
  -- First check if all items can be reserved
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;
    
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      can_reserve := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  -- If all can be reserved, reserve them
  IF can_reserve THEN
    FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      UPDATE drop_products
      SET reserved_quantity = reserved_quantity + (item->>'order_quantity')::INTEGER,
          updated_at = NOW()
      WHERE id = (item->>'drop_product_id')::UUID;
    END LOOP;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check multiple drop products availability (for payment flow)
CREATE OR REPLACE FUNCTION check_multiple_drop_products_availability(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item JSONB;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;

    -- If any item doesn't have enough stock, return false
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- All items are available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create client (by email/phone only)
CREATE OR REPLACE FUNCTION get_or_create_client(
  p_email text, p_phone text)
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Try to find existing client by email
  SELECT id INTO client_id
  FROM clients
  WHERE email = p_email;
  
  IF client_id IS NOT NULL THEN
    -- Update existing client phone if changed
    UPDATE clients 
    SET phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = client_id;
    RETURN client_id;
  ELSE
    -- Create new client
    INSERT INTO clients (email, phone)
    VALUES (p_email, p_phone)
    RETURNING id INTO client_id;
    RETURN client_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to release multiple drop products inventory
CREATE OR REPLACE FUNCTION release_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
BEGIN
  -- Release reserved quantities for all items
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    UPDATE drop_products
    SET reserved_quantity = GREATEST(0, reserved_quantity - (item->>'order_quantity')::INTEGER),
        updated_at = NOW()
    WHERE id = (item->>'drop_product_id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

-- Public read access for product images
CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (true);

-- Public read access for active locations
CREATE POLICY "Public can view active locations" ON locations
  FOR SELECT USING (active = true);

-- Public read access for active drops
CREATE POLICY "Public can view active drops" ON drops
  FOR SELECT USING (status = 'active');

-- Public read access for drop products
CREATE POLICY "Public can view drop products" ON drop_products
  FOR SELECT USING (true);

-- Authenticated admin access for all tables
CREATE POLICY "Admin can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage product images" ON product_images
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage locations" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage drops" ON drops
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage drop products" ON drop_products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage order products" ON order_products
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can insert orders (customer orders)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Public can insert order products
CREATE POLICY "Anyone can create order products" ON order_products
  FOR INSERT WITH CHECK (true);

-- ========================================
-- CONSTRAINTS & VALIDATIONS
-- ========================================

-- Ensure pickup hours are valid (end time must be after start time)
ALTER TABLE locations ADD CONSTRAINT check_pickup_hours 
CHECK (pickup_hour_end > pickup_hour_start);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Indexes for frequently queried fields
CREATE INDEX idx_drops_date_status ON drops(date, status);
CREATE INDEX idx_drops_location_id ON drops(location_id);
CREATE INDEX idx_drop_products_drop_id ON drop_products(drop_id);
CREATE INDEX idx_drop_products_product_id ON drop_products(product_id);
CREATE INDEX idx_orders_drop_id ON orders(drop_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_order_products_order_id ON order_products(order_id);
CREATE INDEX idx_order_products_drop_product_id ON order_products(drop_product_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_locations_active ON locations(active);

-- ========================================
-- SCHEMA COMPLETE
-- ========================================
-- All sample data (locations, products, drops) will be loaded from seed.sql
-- This keeps migrations focused on schema changes only
