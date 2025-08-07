-- Clean database for fresh testing
-- Run this in Supabase SQL Editor

-- 1. Delete all orders (they're linked to the old model)
DELETE FROM orders;

-- 2. Delete all sell inventory
DELETE FROM sell_inventory;

-- 3. Delete all sells
DELETE FROM sells;

-- 4. Reset the order number sequence (if it exists)
-- Note: This might not exist depending on your setup
-- SELECT setval('orders_order_number_seq', 1, false);

-- 5. Verify the cleanup
SELECT 'Orders count:' as info, COUNT(*) as count FROM orders;
SELECT 'Sells count:' as info, COUNT(*) as count FROM sells;
SELECT 'Sell inventory count:' as info, COUNT(*) as count FROM sell_inventory;

-- 6. Show remaining products (should still exist)
SELECT 'Products count:' as info, COUNT(*) as count FROM products;
SELECT 'Active products:' as info, name, active FROM products WHERE active = true;

-- Database is now clean and ready for testing! 