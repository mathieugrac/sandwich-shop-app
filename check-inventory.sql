-- Check inventory status
-- Run this in Supabase SQL Editor

-- 1. Check if inventory exists for the active sell
SELECT 'Inventory check:' as info, COUNT(*) as inventory_items
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day';

-- 2. Show all sell_inventory records
SELECT 'All sell inventory:' as info, 
       si.id, 
       si.sell_id, 
       si.product_id, 
       si.total_quantity, 
       si.reserved_quantity, 
       si.available_quantity,
       p.name as product_name
FROM sell_inventory si
JOIN products p ON si.product_id = p.id
ORDER BY p.name;

-- 3. Check the specific sell
SELECT 'Active sell:' as info, id, sell_date, status FROM sells WHERE sell_date = CURRENT_DATE + INTERVAL '1 day';

-- 4. Check if products are active
SELECT 'Active products:' as info, id, name, active FROM products WHERE active = true; 