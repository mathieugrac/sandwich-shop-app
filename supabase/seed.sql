-- ========================================
-- SEED DATA FOR LOCAL DEVELOPMENT
-- ========================================

-- This file contains sample data for local development
-- It will be loaded automatically when running `supabase db reset`

-- Create admin user for local development
INSERT INTO admin_users (email, name, role) 
VALUES ('admin@fome.local', 'Local Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Note: You also need to create the auth user manually via Supabase Auth API:
-- Email: admin@fome.local
-- Password: admin123
-- This can be done via the Supabase Studio UI or API call

-- Sample locations data (matching production)
INSERT INTO locations (name, code, district, address, location_url, pickup_hour_start, pickup_hour_end) VALUES
('Impact Hub', 'IH', 'Penha', 'R. Neves Ferreira 13, 1170-273 Lisboa, 1170-131 Lisboa', 'https://maps.app.goo.gl/Ud6AwJZuqFuaSRYi9', '12:00', '13:30');

-- Sample products data (matching production)
INSERT INTO products (name, description, category, sell_price, production_cost, sort_order) VALUES
('Nutty Beet', 'Honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint', 'sandwich', 8.00, 2.80, 1),
('Umami Mush', 'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter', 'sandwich', 9.00, 3.00, 2);

-- Sample customer data
INSERT INTO clients (email) VALUES
('mathieugrac@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Sample drops data (active, upcoming, and completed test drops)
-- Create a completed drop (-4 days) for testing order history
INSERT INTO drops (date, location_id, drop_number, status, notes) 
SELECT 
  CURRENT_DATE - INTERVAL '4 days',
  l.id,
  get_next_drop_number(l.id),
  'completed',
  'Completed test drop for local development - has sample order'
FROM locations l 
WHERE l.name = 'Impact Hub';

-- Create an active drop for today so orders can be placed
INSERT INTO drops (date, location_id, drop_number, status, notes) 
SELECT 
  CURRENT_DATE,
  l.id,
  get_next_drop_number(l.id),
  'active',
  'Active test drop for local development - orders can be placed'
FROM locations l 
WHERE l.name = 'Impact Hub';

-- Create an upcoming drop (+8 days)
INSERT INTO drops (date, location_id, drop_number, status, notes) 
SELECT 
  CURRENT_DATE + INTERVAL '8 days',
  l.id,
  get_next_drop_number(l.id),
  'upcoming', 
  'Upcoming test drop for local development'
FROM locations l 
WHERE l.name = 'Impact Hub';

-- Sample drop products data (inventory for the test drops)
-- Completed drop (-4 days): 2 qty each product
INSERT INTO drop_products (drop_id, product_id, stock_quantity, selling_price)
SELECT 
  d.id,
  p.id,
  2, -- 2 qty for completed drop
  p.sell_price
FROM drops d
CROSS JOIN products p
WHERE d.status = 'completed'
ON CONFLICT (drop_id, product_id) DO NOTHING;

-- Active and upcoming drops: 4 qty each product
INSERT INTO drop_products (drop_id, product_id, stock_quantity, selling_price)
SELECT 
  d.id,
  p.id,
  4, -- 4 qty for active and upcoming drops
  p.sell_price
FROM drops d
CROSS JOIN products p
WHERE d.status IN ('active', 'upcoming')
ON CONFLICT (drop_id, product_id) DO NOTHING;

-- Sample order data (from completed drop)
-- Create order from mathieugrac@gmail.com for the completed drop
INSERT INTO orders (
  public_code, 
  sequence_number, 
  drop_id, 
  client_id, 
  customer_name, 
  pickup_time, 
  order_date, 
  status, 
  total_amount, 
  special_instructions,
  payment_intent_id,
  payment_method
)
SELECT 
  'IH01-001', -- Order code without # (as per user preference)
  1, -- First order in this drop
  d.id,
  c.id,
  'Mathieu Grac', -- Customer name for delivery
  '12:30', -- Pickup time within location hours (12:00-13:30)
  d.date, -- Order date matches drop date
  'delivered', -- Order has been delivered
  17.00, -- Total: 8.00 (Nutty Beet) + 9.00 (Umami Mush)
  'Sample completed order for testing',
  'pi_test_1234567890abcdef', -- Fake Stripe payment intent ID
  'stripe'
FROM drops d
CROSS JOIN clients c
WHERE d.status = 'completed' 
  AND c.email = 'mathieugrac@gmail.com';

-- Sample order products data (1 qty of each sandwich)
-- Create order items for both Nutty Beet and Umami Mush
INSERT INTO order_products (order_id, drop_product_id, order_quantity)
SELECT 
  o.id,
  dp.id,
  1 -- 1 quantity of each product
FROM orders o
JOIN drops d ON o.drop_id = d.id
JOIN drop_products dp ON dp.drop_id = d.id
JOIN products p ON dp.product_id = p.id
WHERE o.public_code = 'IH01-001'
  AND p.name IN ('Nutty Beet', 'Umami Mush');
