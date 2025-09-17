-- ========================================
-- WEBHOOK DEBUG: Check for the specific payment intent
-- ========================================

-- Check if the specific payment intent exists
SELECT * FROM orders WHERE payment_intent_id = 'pi_3S8M7wFKFt7Rb5ez0w4lKCnr';

-- Check orders table structure to confirm all required fields exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check if there are any orders created today
SELECT 
  id,
  order_number,
  customer_name,
  payment_intent_id,
  status,
  created_at
FROM orders 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
