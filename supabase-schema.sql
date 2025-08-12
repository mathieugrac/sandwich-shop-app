-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'sandwich',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table (NEW)
CREATE TABLE locations (
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

-- Sells table (UPDATED - removed unique constraint on sell_date, added location_id)
CREATE TABLE sells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_date DATE NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  announcement_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sell inventory (quantities for each product per sell)
CREATE TABLE sell_inventory (
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

-- Clients table (NEW)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Orders table (UPDATED - added client_id reference)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  sell_id UUID REFERENCES sells(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  pickup_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table (NEW - for multiple images per product)
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users (shop owner/staff)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to get next active sell (UPDATED - considers location delivery timeframes)
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

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (active = true);

-- Public read access for active locations
CREATE POLICY "Public can view active locations" ON locations
  FOR SELECT USING (active = true);

-- Public read access for active sells
CREATE POLICY "Public can view active sells" ON sells
  FOR SELECT USING (status = 'active');

-- Public read access for sell inventory
CREATE POLICY "Public can view sell inventory" ON sell_inventory
  FOR SELECT USING (true);

-- Authenticated admin access for all tables
CREATE POLICY "Admin can manage locations" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage sells" ON sells
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage sell inventory" ON sell_inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage order items" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage product images" ON product_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can insert orders (customer orders)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Public can insert order items
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Sample locations data
INSERT INTO locations (name, district, address, google_maps_link, delivery_timeframe) VALUES
('Impact Hub', 'Penha da França', 'Rua Fialho de Almeida 3, 1170-131 Lisboa', 'https://maps.google.com/?q=Impact+Hub+Lisboa', '12:00-14:00');

-- Sample products data
INSERT INTO products (name, description, price, category, sort_order) VALUES
('Nutty Beet', 'honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint', 9, 'sandwich', 1),
('Umami Mush', 'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter', 10, 'sandwich', 2),
('Burgundy Beef', 'wine-glazed beef cheek, caramelized onions, pickled carrots, arugula and garlic butter', 11, 'sandwich', 3);

-- Sample sell data (linked to Impact Hub)
INSERT INTO sells (sell_date, location_id, status, notes) VALUES
(CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM locations WHERE name = 'Impact Hub'), 'draft', 'First test sell'),
(CURRENT_DATE + INTERVAL '8 days', (SELECT id FROM locations WHERE name = 'Impact Hub'), 'draft', 'Second test sell');

-- Sample sell inventory data
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
WHERE s.status = 'draft'; 