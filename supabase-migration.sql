-- ========================================
-- MIGRATION FROM OLD SCHEMA TO NEW SCHEMA
-- ========================================
-- This file helps transition from the old "sells" based model to the new "drops" based model

-- Step 1: Create new tables with temporary names to avoid conflicts
CREATE TABLE products_new (
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

CREATE TABLE product_images_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products_new(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE locations_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  location_url TEXT,
  pickup_hour_start TIME NOT NULL,
  pickup_hour_end TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE drops_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location_id UUID REFERENCES locations_new(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE drop_products_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID REFERENCES drops_new(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products_new(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
  selling_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(drop_id, product_id)
);

CREATE TABLE clients_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

CREATE TABLE orders_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  drop_id UUID REFERENCES drops_new(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients_new(id) ON DELETE SET NULL,
  pickup_time TIME NOT NULL,
  order_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'prepared', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_products_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders_new(id) ON DELETE CASCADE,
  drop_product_id UUID REFERENCES drop_products_new(id) ON DELETE RESTRICT,
  order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Migrate data from old tables to new tables

-- Migrate products (add production_cost, update category constraints)
INSERT INTO products_new (id, name, description, category, sell_price, production_cost, active, sort_order, created_at, updated_at)
SELECT 
  id,
  name,
  description,
  CASE 
    WHEN category = 'drink' THEN 'beverage'
    ELSE category
  END,
  price as sell_price,
  0.00 as production_cost, -- Will be set manually in admin
  active,
  sort_order,
  created_at,
  updated_at
FROM products;

-- Migrate locations (convert delivery_timeframe to pickup hours)
INSERT INTO locations_new (id, name, address, location_url, pickup_hour_start, pickup_hour_end, active, created_at, updated_at)
SELECT 
  id,
  name,
  address,
  google_maps_link as location_url,
  '00:00'::TIME as pickup_hour_start, -- Will be set manually in admin
  '00:00'::TIME as pickup_hour_end,   -- Will be set manually in admin
  active,
  created_at,
  updated_at
FROM locations;

-- Migrate sells to drops
INSERT INTO drops_new (id, date, location_id, status, notes, created_at, updated_at)
SELECT 
  id,
  sell_date as date,
  location_id,
  CASE 
    WHEN status = 'draft' THEN 'upcoming'
    ELSE status
  END,
  notes,
  created_at,
  updated_at
FROM sells;

-- Migrate sell_inventory to drop_products
INSERT INTO drop_products_new (id, drop_id, product_id, stock_quantity, reserved_quantity, selling_price, created_at, updated_at)
SELECT 
  id,
  sell_id as drop_id,
  product_id,
  total_quantity as stock_quantity,
  reserved_quantity,
  (SELECT sell_price FROM products_new WHERE id = product_id) as selling_price,
  created_at,
  updated_at
FROM sell_inventory;

-- Migrate clients (if they exist)
INSERT INTO clients_new (id, name, email, phone, created_at, updated_at)
SELECT 
  id,
  name,
  email,
  phone,
  created_at,
  updated_at
FROM clients;

-- Migrate orders
INSERT INTO orders_new (id, order_number, drop_id, client_id, pickup_time, order_date, status, total_amount, special_instructions, created_at, updated_at)
SELECT 
  o.id,
  o.order_number,
  o.sell_id as drop_id,
  o.client_id,
  o.pickup_time,
  COALESCE(o.created_at::DATE, CURRENT_DATE) as order_date,
  o.status,
  o.total_amount,
  o.special_instructions,
  o.created_at,
  o.updated_at
FROM orders o;

-- Migrate order_items to order_products (this is more complex due to structure change)
-- We need to find the corresponding drop_product_id for each order_item
INSERT INTO order_products_new (id, order_id, drop_product_id, order_quantity, created_at)
SELECT 
  oi.id,
  oi.order_id,
  dp.id as drop_product_id,
  oi.quantity as order_quantity,
  oi.created_at
FROM order_items oi
JOIN orders_new o ON oi.order_id = o.id
JOIN drop_products_new dp ON dp.drop_id = o.drop_id AND dp.product_id = oi.product_id;

-- Step 3: Drop old tables and rename new ones
-- Since this is early phase with no important data, we can proceed directly

-- Drop old tables
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS sell_inventory;
DROP TABLE IF EXISTS sells;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS orders;

-- Rename new tables
ALTER TABLE products_new RENAME TO products;
ALTER TABLE product_images_new RENAME TO product_images;
ALTER TABLE locations_new RENAME TO locations;
ALTER TABLE drops_new RENAME TO drops;
ALTER TABLE drop_products_new RENAME TO drop_products;
ALTER TABLE clients_new RENAME TO clients;
ALTER TABLE orders_new RENAME TO orders;
ALTER TABLE order_products_new RENAME TO order_products;

-- Step 4: Recreate indexes and constraints (after renaming)
-- This will be done automatically when you run the new schema

-- Step 5: Update any existing functions or views that reference old table names
-- You'll need to update your application code to use the new table names

-- ========================================
-- ROLLBACK PLAN (if needed)
-- ========================================
-- If you need to rollback, you can:
-- 1. Keep the old tables with "_old" suffix
-- 2. Restore from backup
-- 3. Re-run the old schema

-- ========================================
-- POST-MIGRATION TASKS
-- ========================================
-- 1. Update your application code to use new table names
-- 2. Update API endpoints to reference new structure
-- 3. Test all functionality with new schema
-- 4. Update any database queries in your code
-- 5. Update TypeScript types to match new structure
