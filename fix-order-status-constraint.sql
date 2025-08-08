-- Fix order status constraint to allow 'ready' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled'));
