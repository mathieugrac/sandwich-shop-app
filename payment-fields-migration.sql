-- ========================================
-- PAYMENT FIELDS MIGRATION: Add missing Stripe payment fields
-- ========================================

-- Add payment fields to orders table (required for Stripe integration)
ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN payment_method TEXT;

-- Update status enum to include 'confirmed' status (for paid orders)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('active', 'confirmed', 'delivered'));

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check orders table structure (should now have payment fields)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'orders_status_check';
