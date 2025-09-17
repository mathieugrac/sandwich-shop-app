-- ========================================
-- DEBUG: Check orders table and recent orders
-- ========================================

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check recent orders (last 10)
SELECT 
  id,
  order_number,
  customer_name,
  payment_intent_id,
  payment_method,
  status,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are orders with payment_intent_id but missing customer_name
SELECT 
  COUNT(*) as orders_with_payment_intent_but_no_customer_name
FROM orders 
WHERE payment_intent_id IS NOT NULL 
AND (customer_name IS NULL OR customer_name = '');

-- Check specific payment intent (replace with your actual payment intent ID)
-- SELECT * FROM orders WHERE payment_intent_id = 'pi_3S8M7wFKFt7Rb5ez0w4lKCnr';

-- Check clients table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
