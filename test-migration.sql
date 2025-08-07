-- Test script to verify the sell-based migration worked correctly
-- Run this in Supabase SQL Editor

-- Test 1: Check if tables exist
SELECT 'Tables Check:' as test_type;
SELECT table_name, 
       CASE WHEN table_name IN ('sells', 'sell_inventory') THEN '✅ Created' ELSE '❌ Missing' END as status
FROM information_schema.tables 
WHERE table_name IN ('sells', 'sell_inventory');

-- Test 2: Check if functions exist
SELECT 'Functions Check:' as test_type;
SELECT routine_name, 
       CASE WHEN routine_name IN ('get_next_active_sell', 'reserve_sell_inventory') THEN '✅ Created' ELSE '❌ Missing' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_next_active_sell', 'reserve_sell_inventory');

-- Test 3: Check if orders table has sell_id column
SELECT 'Orders Table Check:' as test_type;
SELECT column_name, 
       CASE WHEN column_name = 'sell_id' THEN '✅ Added' ELSE '❌ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'sell_id';

-- Test 4: Create a test sell
INSERT INTO sells (sell_date, status, announcement_sent, notes) 
VALUES (CURRENT_DATE + INTERVAL '1 day', 'active', false, 'Test sell for migration verification')
ON CONFLICT (sell_date) DO NOTHING;

-- Test 5: Get the test sell
SELECT 'Test Sell Created:' as test_type, id, sell_date, status FROM sells WHERE sell_date = CURRENT_DATE + INTERVAL '1 day';

-- Test 6: Create test inventory for the sell
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

-- Test 7: Check if inventory was created
SELECT 'Test Inventory Created:' as test_type, COUNT(*) as inventory_items
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day';

-- Test 8: Test the get_next_active_sell function
SELECT 'Function Test:' as test_type, * FROM get_next_active_sell();

-- Test 9: Test the reserve_sell_inventory function
SELECT 'Reserve Function Test:' as test_type,
       reserve_sell_inventory(
         (SELECT id FROM sells WHERE sell_date = CURRENT_DATE + INTERVAL '1 day'),
         (SELECT id FROM products WHERE name = 'Umami Mush'),
         1
       ) as reservation_result;

-- Test 10: Check if reservation worked
SELECT 'Reservation Check:' as test_type,
       si.total_quantity,
       si.reserved_quantity,
       si.available_quantity
FROM sell_inventory si
JOIN sells s ON si.sell_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.sell_date = CURRENT_DATE + INTERVAL '1 day'
AND p.name = 'Umami Mush';

-- Migration verification complete!
-- If all tests pass, the migration was successful 