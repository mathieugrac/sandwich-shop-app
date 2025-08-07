-- Debug inventory mismatch between database and customer side
-- Run this in Supabase SQL Editor

-- 1. Check the active sell
SELECT 'Active sell:' as info, id, sell_date, status FROM sells WHERE status = 'active' ORDER BY sell_date LIMIT 1;

-- 2. Check inventory for the active sell
SELECT 'Active sell inventory:' as info,
       s.sell_date,
       p.name as product_name,
       si.total_quantity,
       si.reserved_quantity,
       si.available_quantity,
       p.active as product_active
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.status = 'active'
ORDER BY s.sell_date, p.name;

-- 3. Check what the API should return (products with available stock)
SELECT 'API should return:' as info,
       p.name as product_name,
       si.available_quantity as availableStock,
       p.active as product_active
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.status = 'active'
AND p.active = true
AND si.available_quantity > 0
ORDER BY p.name;

-- 4. Check all products and their status
SELECT 'All products:' as info, name, active, category FROM products ORDER BY name;

-- 5. Check if there are multiple active sells
SELECT 'All sells:' as info, id, sell_date, status FROM sells ORDER BY sell_date;

-- 6. Test the function directly
SELECT 'get_next_active_sell() result:' as info, * FROM get_next_active_sell(); 