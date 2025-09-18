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
INSERT INTO locations (name, district, address, location_url, pickup_hour_start, pickup_hour_end) VALUES
('Impact Hub', 'Príncipe Real', 'Rua Fialho de Almeida 3, 1170-131 Lisboa', 'https://maps.google.com/?q=Impact+Hub+Lisboa', '12:00', '13:00');

-- Sample products data (matching production)
INSERT INTO products (name, description, category, sell_price, production_cost, sort_order) VALUES
('Nutty Beet', 'honey-roasted beetroot, creamy labneh, zaatar, crunchy hazelnuts, pickled oignons and fresh mint', 'sandwich', 9.00, 6.50, 1),
('Umami Mush', 'Marinated oyster mushrooms, crispy buckwheat, pickled apple, fresh coriander and miso butter', 'sandwich', 10.00, 7.00, 2),
('Burgundy Beef', 'wine-glazed beef cheek, caramelized onions, pickled carrots, arugula and garlic butter', 'sandwich', 11.00, 8.50, 3),
('Fresh Lemonade', 'Homemade lemonade with mint', 'beverage', 3.50, 1.50, 4),
('Chocolate Brownie', 'Rich chocolate brownie with walnuts', 'dessert', 4.50, 2.00, 5);

-- Sample drops data (active and upcoming test drops)
-- Create an active drop for today so orders can be placed
INSERT INTO drops (date, location_id, status, notes) 
SELECT 
  CURRENT_DATE,
  l.id,
  'active',
  'Active test drop for local development - orders can be placed'
FROM locations l 
WHERE l.name = 'Impact Hub';

INSERT INTO drops (date, location_id, status, notes) 
SELECT 
  CURRENT_DATE + INTERVAL '1 day',
  l.id,
  'upcoming',
  'Test drop for local development'
FROM locations l 
WHERE l.name = 'Impact Hub';

INSERT INTO drops (date, location_id, status, notes) 
SELECT 
  CURRENT_DATE + INTERVAL '8 days',
  l.id,
  'upcoming', 
  'Second test drop for local development'
FROM locations l 
WHERE l.name = 'Impact Hub';

-- Sample drop products data (inventory for the test drops)
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
FROM drops d
CROSS JOIN products p
WHERE d.status IN ('active', 'upcoming')
ON CONFLICT (drop_id, product_id) DO NOTHING;
