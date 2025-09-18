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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop products table (inventory for each drop)
-- Links products to drops with specific quantities
CREATE TABLE drop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drop_id, product_id)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES drops(id) ON DELETE RESTRICT,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  pickup_time TIME,
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('active', 'confirmed', 'delivered')),
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_sort_order ON products(sort_order);

-- Product images indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order);

-- Locations indexes
CREATE INDEX idx_locations_active ON locations(active);

-- Drops indexes
CREATE INDEX idx_drops_date ON drops(date);
CREATE INDEX idx_drops_location_id ON drops(location_id);
CREATE INDEX idx_drops_status ON drops(status);
CREATE INDEX idx_drops_date_status ON drops(date, status);

-- Drop products indexes
CREATE INDEX idx_drop_products_drop_id ON drop_products(drop_id);
CREATE INDEX idx_drop_products_product_id ON drop_products(product_id);

-- Orders indexes
CREATE INDEX idx_orders_drop_id ON orders(drop_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are insertable by authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Products are updatable by authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Products are deletable by authenticated users" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Product images policies (public read, admin write)
CREATE POLICY "Product images are viewable by everyone" ON product_images FOR SELECT USING (true);
CREATE POLICY "Product images are insertable by authenticated users" ON product_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Product images are updatable by authenticated users" ON product_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Product images are deletable by authenticated users" ON product_images FOR DELETE USING (auth.role() = 'authenticated');

-- Locations policies (public read, admin write)
CREATE POLICY "Locations are viewable by everyone" ON locations FOR SELECT USING (true);
CREATE POLICY "Locations are insertable by authenticated users" ON locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Locations are updatable by authenticated users" ON locations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Locations are deletable by authenticated users" ON locations FOR DELETE USING (auth.role() = 'authenticated');

-- Drops policies (public read for active drops, admin write)
CREATE POLICY "Drops are viewable by everyone" ON drops FOR SELECT USING (true);
CREATE POLICY "Drops are insertable by authenticated users" ON drops FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Drops are updatable by authenticated users" ON drops FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Drops are deletable by authenticated users" ON drops FOR DELETE USING (auth.role() = 'authenticated');

-- Drop products policies (public read, admin write)
CREATE POLICY "Drop products are viewable by everyone" ON drop_products FOR SELECT USING (true);
CREATE POLICY "Drop products are insertable by authenticated users" ON drop_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Drop products are updatable by authenticated users" ON drop_products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Drop products are deletable by authenticated users" ON drop_products FOR DELETE USING (auth.role() = 'authenticated');

-- Orders policies (customers can read their own orders, admin can read all)
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Orders are insertable by everyone" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders are updatable by authenticated users" ON orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Orders are deletable by authenticated users" ON orders FOR DELETE USING (auth.role() = 'authenticated');

-- Order items policies (follow order policies)
CREATE POLICY "Order items are viewable by everyone" ON order_items FOR SELECT USING (true);
CREATE POLICY "Order items are insertable by everyone" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items are updatable by authenticated users" ON order_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Order items are deletable by authenticated users" ON order_items FOR DELETE USING (auth.role() = 'authenticated');

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drops_updated_at BEFORE UPDATE ON drops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drop_products_updated_at BEFORE UPDATE ON drop_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check inventory availability
CREATE OR REPLACE FUNCTION check_inventory_availability(
  p_drop_id UUID,
  p_product_id UUID,
  p_requested_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_quantity INTEGER;
BEGIN
  SELECT (quantity - reserved_quantity) INTO available_quantity
  FROM drop_products
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  RETURN COALESCE(available_quantity, 0) >= p_requested_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_drop_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_quantity INTEGER;
BEGIN
  -- Get current availability
  SELECT (quantity - reserved_quantity) INTO available_quantity
  FROM drop_products
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  -- Check if enough inventory is available
  IF COALESCE(available_quantity, 0) < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Reserve the inventory
  UPDATE drop_products
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to release inventory (when order is cancelled)
CREATE OR REPLACE FUNCTION release_inventory(
  p_drop_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE drop_products
  SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ========================================

-- Insert sample location
INSERT INTO locations (name, district, address, pickup_hour_start, pickup_hour_end) VALUES
('Impact Hub Lisbon', 'Príncipe Real', 'Rua Rodrigues Faria 103, 1300-501 Lisboa', '12:00', '14:00');

-- Insert sample products
INSERT INTO products (name, description, category, sell_price, production_cost, sort_order) VALUES
('Classic Ham & Cheese', 'Traditional Portuguese ham with aged cheese on fresh bread', 'sandwich', 6.50, 3.20, 1),
('Tuna Melt', 'Premium tuna with melted cheese and fresh vegetables', 'sandwich', 7.00, 3.50, 2),
('Vegetarian Delight', 'Fresh vegetables, hummus, and avocado on whole grain bread', 'sandwich', 6.00, 2.80, 3),
('Portuguese Bifana', 'Traditional pork sandwich with secret sauce', 'sandwich', 5.50, 2.90, 4),
('Chips', 'Crispy potato chips', 'side', 2.00, 0.80, 5),
('Fresh Juice', 'Daily fresh orange juice', 'beverage', 3.50, 1.20, 6),
('Chocolate Cookie', 'Homemade chocolate chip cookie', 'dessert', 2.50, 1.00, 7);
