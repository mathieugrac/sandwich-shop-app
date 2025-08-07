-- Clean everything and start fresh
-- Run this in Supabase SQL Editor

-- 1. Delete all order items first (due to foreign key constraints)
DELETE FROM order_items;

-- 2. Delete all orders
DELETE FROM orders;

-- 3. Delete all sell inventory
DELETE FROM sell_inventory;

-- 4. Delete all sells
DELETE FROM sells;

-- 5. Verify the cleanup
SELECT 'Orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Order items count:' as info, COUNT(*) as count FROM order_items;
SELECT 'Sells count:' as info, COUNT(*) as count FROM sells;
SELECT 'Sell inventory count:' as info, COUNT(*) as count FROM sell_inventory;

-- 6. Show remaining products (should still exist)
SELECT 'Products count:' as info, COUNT(*) as count FROM products;
SELECT 'Active products:' as info, name, active FROM products WHERE active = true;

-- Database is now completely clean and ready for fresh testing! 