-- Fix order status constraint to allow 'ready' status
-- Run this in the Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Then add the new constraint that allows 'ready' status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass AND conname = 'orders_status_check';
