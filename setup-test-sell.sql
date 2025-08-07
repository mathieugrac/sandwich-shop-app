-- Setup test sell for development
-- Run this in Supabase SQL Editor

-- 1. Create a test sell for tomorrow
INSERT INTO sells (sell_date, status, announcement_sent, notes) 
VALUES (CURRENT_DATE + INTERVAL '1 day', 'active', false, 'Test sell for development')
ON CONFLICT (sell_date) DO NOTHING;

-- 2. Get the created sell
SELECT 'Created sell:' as info, id, sell_date, status FROM sells WHERE sell_date = CURRENT_DATE + INTERVAL '1 day';

-- 3. Create inventory for the test sell
INSERT INTO sell_inventory (sell_id, product_id, total_quantity, reserved_quantity)
SELECT 
  s.id,
  p.id,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 0
    WHEN p.name = 'Umami Mush' THEN 20
    WHEN p.name = 'Burgundy Beef' THEN 3
    ELSE 10
  END,
  0
FROM sells s
CROSS JOIN products p
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day'
AND p.active = true
ON CONFLICT (sell_id, product_id) DO NOTHING;

-- 4. Check inventory was created
SELECT 'Inventory created:' as info, COUNT(*) as items
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day';

-- 5. Test the function
SELECT 'Function test:' as info, * FROM get_next_active_sell();

-- 6. Show all sells
SELECT 'All sells:' as info, id, sell_date, status, announcement_sent FROM sells ORDER BY sell_date DESC; 