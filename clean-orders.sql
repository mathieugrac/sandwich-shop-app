-- Clean all orders from the database
-- Run this in Supabase SQL Editor

-- 1. Delete all order items first (due to foreign key constraints)
DELETE FROM order_items;

-- 2. Delete all orders
DELETE FROM orders;

-- 3. Verify the cleanup
SELECT 'Orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Order items count:' as info, COUNT(*) as count FROM order_items;

-- 4. Show remaining data
SELECT 'Sells count:' as info, COUNT(*) as count FROM sells;
SELECT 'Products count:' as info, COUNT(*) as count FROM products;
SELECT 'Sell inventory count:' as info, COUNT(*) as count FROM sell_inventory;

-- 5. Show sell inventory details (should still exist)
SELECT 'Sell inventory details:' as info,
       s.sell_date,
       p.name as product_name,
       si.total_quantity,
       si.reserved_quantity,
       si.available_quantity
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
JOIN products p ON si.product_id = p.id
ORDER BY s.sell_date, p.name;

-- Database is now clean of orders! 