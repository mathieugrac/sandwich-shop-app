-- ========================================
-- FOMÉ SANDWICH SHOP - NEW DATA MODEL
-- ========================================

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  status_changed_at TIMESTAMP WITH TIME ZONE
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
-- People who order food through the app
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
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
  pickup_time TIME NOT NULL, -- 15-min slot within location pickup hours
  order_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'delivered')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
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

-- Admin users table (shop owner/staff)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
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

-- Function to get next active drop
CREATE OR REPLACE FUNCTION get_next_active_drop()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status = 'active' 
    AND d.date >= CURRENT_DATE
    AND l.active = true
  ORDER BY d.date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve drop product inventory
CREATE OR REPLACE FUNCTION reserve_drop_product_inventory(
  p_drop_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM drop_products
  WHERE id = p_drop_product_id;
  
  IF available_qty >= p_quantity THEN
    UPDATE drop_products
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_drop_product_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
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

-- Function to auto-complete drops after pickup hours
CREATE OR REPLACE FUNCTION auto_complete_expired_drops()
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER := 0;
  drop_record RECORD;
BEGIN
  -- Find drops that should be auto-completed (30 minutes after pickup hours end)
  FOR drop_record IN
    SELECT d.id, d.date, l.pickup_hour_end
    FROM drops d
    JOIN locations l ON d.location_id = l.id
    WHERE d.status = 'active'
      AND d.date <= CURRENT_DATE
      AND l.pickup_hour_end IS NOT NULL
  LOOP
    -- For now, complete drops from previous days
    -- In production, parse pickup_hour_end and check actual time
    IF drop_record.date < CURRENT_DATE THEN
      UPDATE drops 
      SET status = 'completed', updated_at = NOW()
      WHERE id = drop_record.id;
      completed_count := completed_count + 1;
    END IF;
  END LOOP;
  
  RETURN completed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create client
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
-- SAMPLE DATA
-- ========================================

-- Sample locations data (pickup hours will be set manually in admin)
INSERT INTO locations (name, address, location_url, pickup_hour_start, pickup_hour_end) VALUES
('Impact Hub', 'Rua Fialho de Almeida 3, 1170-131 Lisboa', 'https://maps.google.com/?q=Impact+Hub+Lisboa', '00:00', '00:00');

-- Sample products data (production_cost will be set manually in admin)
INSERT INTO products (name, description, category, sell_price, production_cost, sort_order) VALUES
('Nutty Beet', 'honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint', 'sandwich', 9.00, 0.00, 1),
('Umami Mush', 'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter', 'sandwich', 10.00, 0.00, 2),
('Burgundy Beef', 'wine-glazed beef cheek, caramelized onions, pickled carrots, arugula and garlic butter', 'sandwich', 11.00, 0.00, 3),
('Fresh Lemonade', 'Homemade lemonade with mint', 'beverage', 3.50, 0.00, 4),
('Chocolate Brownie', 'Rich chocolate brownie with walnuts', 'dessert', 4.50, 0.00, 5);

-- Sample drops data (linked to Impact Hub)
INSERT INTO drops (date, location_id, status, notes) VALUES
(CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM locations WHERE name = 'Impact Hub'), 'upcoming', 'First test drop'),
(CURRENT_DATE + INTERVAL '8 days', (SELECT id FROM locations WHERE name = 'Impact Hub'), 'upcoming', 'Second test drop');

-- Sample drop products data
INSERT INTO drop_products (drop_id, product_id, stock_quantity, selling_price)
SELECT 
  d.id,
  p.id,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 20
    WHEN p.name = 'Umami Mush' THEN 25
    WHEN p.name = 'Burgundy Beef' THEN 15
    WHEN p.name = 'Fresh Lemonade' THEN 30
    WHEN p.name = 'Chocolate Brownie' THEN 20
    ELSE 20
  END,
  p.sell_price
FROM drops d, products p
WHERE d.status = 'upcoming';

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