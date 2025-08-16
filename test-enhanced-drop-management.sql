-- ========================================
-- ENHANCED DROP MANAGEMENT - PHASE 4 TESTING
-- ========================================
-- This script tests all enhanced functions and validates the system

-- Test 1: Verify database schema updates
SELECT 'Testing database schema updates...' as test_name;

-- Check if new columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'drops' 
  AND column_name IN ('pickup_deadline', 'status_changed_at', 'last_modified_by')
ORDER BY column_name;

-- Check if admin_users table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'admin_users';

-- Test 2: Test core functions
SELECT 'Testing core functions...' as test_name;

-- Test get_admin_upcoming_drops
SELECT 'Testing get_admin_upcoming_drops()' as function_name;
SELECT * FROM get_admin_upcoming_drops() LIMIT 3;

-- Test get_admin_past_drops  
SELECT 'Testing get_admin_past_drops()' as function_name;
SELECT * FROM get_admin_past_drops() LIMIT 3;

-- Test get_next_active_drop
SELECT 'Testing get_next_active_drop()' as function_name;
SELECT * FROM get_next_active_drop();

-- Test calculate_pickup_deadline (use actual location ID)
SELECT 'Testing calculate_pickup_deadline()' as function_name;
SELECT 
  l.id as location_id,
  l.name as location_name,
  l.pickup_hour_end,
  calculate_pickup_deadline(CURRENT_DATE, l.id) as calculated_deadline
FROM locations l 
WHERE l.active = true 
LIMIT 3;

-- Test is_drop_orderable (use actual drop ID)
SELECT 'Testing is_drop_orderable()' as function_name;
SELECT 
  d.id as drop_id,
  d.date,
  d.status,
  d.pickup_deadline,
  is_drop_orderable(d.id) as orderable
FROM drops d 
WHERE d.status IN ('active', 'upcoming')
LIMIT 3;

-- Test 3: Verify data integrity
SELECT 'Testing data integrity...' as test_name;

-- Check if all drops have pickup_deadline
SELECT 
  COUNT(*) as total_drops,
  COUNT(pickup_deadline) as drops_with_deadline,
  COUNT(*) - COUNT(pickup_deadline) as drops_missing_deadline
FROM drops;

-- Check drop status distribution
SELECT 
  status,
  COUNT(*) as count,
  COUNT(pickup_deadline) as with_deadline
FROM drops 
GROUP BY status 
ORDER BY status;

-- Check for any orphaned records
SELECT 
  'drop_products without drops' as issue,
  COUNT(*) as count
FROM drop_products dp
LEFT JOIN drops d ON dp.drop_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT 
  'orders without drops' as issue,
  COUNT(*) as count
FROM orders o
LEFT JOIN drops d ON o.drop_id = d.id
WHERE d.id IS NULL;

-- Test 4: Test status change function (dry run)
SELECT 'Testing status change function...' as test_name;

-- Get a test drop and admin user
SELECT 
  'Test drop for status change' as info,
  d.id as drop_id,
  d.date,
  d.status,
  d.pickup_deadline
FROM drops d 
WHERE d.status = 'upcoming'
LIMIT 1;

-- Check admin users
SELECT 
  'Admin users available' as info,
  COUNT(*) as admin_count
FROM admin_users;

-- Test 5: Performance testing
SELECT 'Testing function performance...' as test_name;

-- Test execution time for key functions
DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time INTERVAL;
BEGIN
  -- Test get_admin_upcoming_drops performance
  start_time := clock_timestamp();
  PERFORM * FROM get_admin_upcoming_drops();
  end_time := clock_timestamp();
  execution_time := end_time - start_time;
  
  RAISE NOTICE 'get_admin_upcoming_drops execution time: %', execution_time;
  
  -- Test get_admin_past_drops performance
  start_time := clock_timestamp();
  PERFORM * FROM get_admin_past_drops();
  end_time := clock_timestamp();
  execution_time := end_time - start_time;
  
  RAISE NOTICE 'get_admin_past_drops execution time: %', execution_time;
  
  -- Test get_next_active_drop performance
  start_time := clock_timestamp();
  PERFORM * FROM get_next_active_drop();
  end_time := clock_timestamp();
  execution_time := end_time - start_time;
  
  RAISE NOTICE 'get_next_active_drop execution time: %', execution_time;
END $$;

-- Test 6: Edge case validation
SELECT 'Testing edge cases...' as test_name;

-- Check for drops with past dates but active status
SELECT 
  'Drops with past dates but active status' as edge_case,
  COUNT(*) as count
FROM drops d
WHERE d.date < CURRENT_DATE 
  AND d.status = 'active';

-- Check for drops with future dates but completed status
SELECT 
  'Drops with future dates but completed status' as edge_case,
  COUNT(*) as count
FROM drops d
WHERE d.date > CURRENT_DATE 
  AND d.status = 'completed';

-- Check for drops without location
SELECT 
  'Drops without location' as edge_case,
  COUNT(*) as count
FROM drops d
LEFT JOIN locations l ON d.location_id = l.id
WHERE l.id IS NULL;

-- Test 7: Index verification
SELECT 'Testing indexes...' as test_name;

-- Check if required indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'drops' 
  AND indexname LIKE '%pickup_deadline%'
   OR indexname LIKE '%status%'
   OR indexname LIKE '%deadline%';

-- Test 8: Function availability check
SELECT 'Testing function availability...' as test_name;

-- Check if all required functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN (
  'get_admin_upcoming_drops',
  'get_admin_past_drops', 
  'change_drop_status',
  'auto_complete_expired_drops',
  'get_next_active_drop',
  'calculate_pickup_deadline',
  'is_drop_orderable'
)
ORDER BY routine_name;

-- Test 9: Sample data validation
SELECT 'Testing sample data...' as test_name;

-- Show sample of upcoming drops
SELECT 
  'Sample upcoming drops' as data_type,
  d.id,
  d.date,
  d.status,
  d.pickup_deadline,
  l.name as location_name
FROM drops d
JOIN locations l ON d.location_id = l.id
WHERE d.status IN ('upcoming', 'active')
ORDER BY d.date ASC
LIMIT 5;

-- Show sample of past drops
SELECT 
  'Sample past drops' as data_type,
  d.id,
  d.date,
  d.status,
  d.pickup_deadline,
  l.name as location_name
FROM drops d
JOIN locations l ON d.location_id = l.id
WHERE d.status IN ('completed', 'cancelled')
ORDER BY d.date DESC
LIMIT 5;

-- Test 10: Summary report
SELECT 'Generating summary report...' as test_name;

SELECT 
  'ENHANCED DROP MANAGEMENT SYSTEM - PHASE 4 TESTING SUMMARY' as title,
  '' as spacer,
  'Database Schema:' as category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drops' AND column_name = 'pickup_deadline')
    THEN '✅ pickup_deadline column exists'
    ELSE '❌ pickup_deadline column missing'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drops' AND column_name = 'status_changed_at')
    THEN '✅ status_changed_at column exists'
    ELSE '❌ status_changed_at column missing'
  END as status2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drops' AND column_name = 'last_modified_by')
    THEN '✅ last_modified_by column exists'
    ELSE '❌ last_modified_by column missing'
  END as status3,
  '' as spacer2,
  'Functions:' as category2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_admin_upcoming_drops')
    THEN '✅ get_admin_upcoming_drops exists'
    ELSE '❌ get_admin_upcoming_drops missing'
  END as function1,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_admin_past_drops')
    THEN '✅ get_admin_past_drops exists'
    ELSE '❌ get_admin_past_drops missing'
  END as function2,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'change_drop_status')
    THEN '✅ change_drop_status exists'
    ELSE '❌ change_drop_status missing'
  END as function3,
  '' as spacer3,
  'Data Integrity:' as category3,
  (SELECT COUNT(*) FROM drops WHERE pickup_deadline IS NULL) as drops_missing_deadline,
  (SELECT COUNT(*) FROM drops) as total_drops,
  CASE 
    WHEN (SELECT COUNT(*) FROM drops WHERE pickup_deadline IS NULL) = 0
    THEN '✅ All drops have pickup_deadline'
    ELSE '⚠️ Some drops missing pickup_deadline'
  END as deadline_status;
