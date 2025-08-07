-- Setup fresh test environment
-- Run this AFTER clean-database.sql in Supabase SQL Editor

-- 1. Create a test sell for tomorrow
INSERT INTO sells (sell_date, status, announcement_sent, notes) 
VALUES (CURRENT_DATE + INTERVAL '1 day', 'active', false, 'Fresh test sell for development')
ON CONFLICT (sell_date) DO NOTHING;

-- 2. Create a test sell for the day after tomorrow (for testing multiple sells)
INSERT INTO sells (sell_date, status, announcement_sent, notes) 
VALUES (CURRENT_DATE + INTERVAL '2 days', 'draft', false, 'Future test sell')
ON CONFLICT (sell_date) DO NOTHING;

-- 3. Get the created sells
SELECT 'Created sells:' as info, id, sell_date, status FROM sells ORDER BY sell_date;

-- 4. Create inventory for tomorrow's sell
INSERT INTO sell_inventory (sell_id, product_id, total_quantity, reserved_quantity)
SELECT 
  s.id,
  p.id,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 0
    WHEN p.name = 'Umami Mush' THEN 15
    WHEN p.name = 'Burgundy Beef' THEN 5
    ELSE 8
  END,
  0
FROM sells s
CROSS JOIN products p
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day'
AND p.active = true
ON CONFLICT (sell_id, product_id) DO NOTHING;

-- 5. Create inventory for the day after tomorrow's sell
INSERT INTO sell_inventory (sell_id, product_id, total_quantity, reserved_quantity)
SELECT 
  s.id,
  p.id,
  CASE 
    WHEN p.name = 'Nutty Beet' THEN 10
    WHEN p.name = 'Umami Mush' THEN 20
    WHEN p.name = 'Burgundy Beef' THEN 8
    ELSE 12
  END,
  0
FROM sells s
CROSS JOIN products p
WHERE s.sell_date = CURRENT_DATE + INTERVAL '2 days'
AND p.active = true
ON CONFLICT (sell_id, product_id) DO NOTHING;

-- 6. Check inventory was created
SELECT 'Tomorrow inventory:' as info, COUNT(*) as items
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day';

SELECT 'Day after tomorrow inventory:' as info, COUNT(*) as items
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '2 days';

-- 7. Test the function
SELECT 'Next active sell:' as info, * FROM get_next_active_sell();

-- 8. Show all sells with their status
SELECT 'All sells:' as info, id, sell_date, status, announcement_sent FROM sells ORDER BY sell_date DESC;

-- 9. Show inventory details
SELECT 'Inventory details:' as info,
       s.sell_date,
       p.name as product_name,
       si.total_quantity,
       si.reserved_quantity,
       si.available_quantity
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
JOIN products p ON si.product_id = p.id
ORDER BY s.sell_date, p.name;

-- Fresh test environment is ready! 