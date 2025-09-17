-- ========================================
-- SAFE PAYMENT FIELDS MIGRATION: Check and add missing fields only
-- ========================================

-- Add payment_intent_id column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_intent_id') THEN
        ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
        RAISE NOTICE 'Added payment_intent_id column';
    ELSE
        RAISE NOTICE 'payment_intent_id column already exists';
    END IF;
END $$;

-- Add payment_method column only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT;
        RAISE NOTICE 'Added payment_method column';
    ELSE
        RAISE NOTICE 'payment_method column already exists';
    END IF;
END $$;

-- Update status constraint to include 'confirmed' if not already included
DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- Add updated constraint
    ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('active', 'confirmed', 'delivered'));
    
    RAISE NOTICE 'Updated status constraint to include confirmed';
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check current orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check if there are any existing orders with payment_intent_id
SELECT COUNT(*) as orders_with_payment_intent
FROM orders 
WHERE payment_intent_id IS NOT NULL;

-- Check status constraint (PostgreSQL 12+ compatible)
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'orders_status_check';
