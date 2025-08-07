-- Check which sell the order is linked to
-- Run this in Supabase SQL Editor

-- 1. Check all orders and their sell_id
SELECT 'All orders:' as info,
       o.id,
       o.order_number,
       o.customer_name,
       o.status,
       o.sell_id,
       s.sell_date,
       s.status as sell_status
FROM orders o
LEFT JOIN sells s ON o.sell_id = s.id
ORDER BY o.created_at DESC;

-- 2. Check the next active sell
SELECT 'Next active sell:' as info, * FROM get_next_active_sell();

-- 3. Check if there are any orders without sell_id
SELECT 'Orders without sell_id:' as info, COUNT(*) as count
FROM orders 
WHERE sell_id IS NULL;

-- 4. Show all sells
SELECT 'All sells:' as info, id, sell_date, status FROM sells ORDER BY sell_date; 