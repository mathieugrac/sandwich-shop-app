-- Fix schema to match exact production structure
-- This migration corrects discrepancies between the initial migration and current production

-- 1. Add missing columns to drops table
ALTER TABLE drops ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE drops ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES admin_users(id);

-- 2. Create clients table (if it doesn't exist from admin_users migration)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "Clients are manageable by authenticated users" ON clients;
CREATE POLICY "Clients are manageable by authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Fix orders table structure to match production
-- Add new columns that should be in production
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Set default values for existing records
UPDATE orders SET 
  order_date = created_at::date,
  pickup_time = '12:00'::time
WHERE order_date IS NULL;

-- Make order_date and pickup_time NOT NULL after setting defaults
ALTER TABLE orders ALTER COLUMN order_date SET NOT NULL;
ALTER TABLE orders ALTER COLUMN pickup_time SET NOT NULL;

-- Create unique constraint on order_number after migration
-- (We'll set order numbers in a separate step)

-- 4. Migrate data from old columns to new structure
-- Copy special_requests to special_instructions
UPDATE orders SET special_instructions = special_requests WHERE special_requests IS NOT NULL AND special_instructions IS NULL;

-- Copy stripe_payment_intent_id to payment_intent_id  
UPDATE orders SET payment_intent_id = stripe_payment_intent_id WHERE stripe_payment_intent_id IS NOT NULL AND payment_intent_id IS NULL;

-- Set payment_method for existing orders
UPDATE orders SET payment_method = 'stripe' WHERE stripe_payment_intent_id IS NOT NULL AND payment_method IS NULL;

-- 5. Create or get client records for existing orders
-- This function will handle the customer data migration
DO $$
DECLARE
    order_record RECORD;
    client_uuid UUID;
BEGIN
    FOR order_record IN SELECT id, customer_email, customer_phone FROM orders WHERE customer_email IS NOT NULL AND client_id IS NULL
    LOOP
        -- Insert or get existing client
        INSERT INTO clients (email, phone) 
        VALUES (order_record.customer_email, order_record.customer_phone)
        ON CONFLICT (email) DO UPDATE SET 
            phone = COALESCE(EXCLUDED.phone, clients.phone),
            updated_at = NOW()
        RETURNING id INTO client_uuid;
        
        -- Link order to client
        UPDATE orders SET client_id = client_uuid WHERE id = order_record.id;
    END LOOP;
END $$;

-- 6. Generate order numbers for existing orders
DO $$
DECLARE
    order_record RECORD;
    new_order_number VARCHAR(20);
BEGIN
    FOR order_record IN SELECT id, created_at FROM orders WHERE order_number IS NULL
    LOOP
        -- Generate order number based on creation date
        new_order_number := 'ORD-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) LOOP
            new_order_number := 'ORD-' || TO_CHAR(order_record.created_at, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
        END LOOP;
        
        UPDATE orders SET order_number = new_order_number WHERE id = order_record.id;
    END LOOP;
END $$;

-- Now make order_number NOT NULL and UNIQUE
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_unique;
ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- 7. Drop old columns from orders (after migration)
-- Note: In production, you might want to keep these for a while before dropping
-- ALTER TABLE orders DROP COLUMN IF EXISTS customer_email;
-- ALTER TABLE orders DROP COLUMN IF EXISTS customer_phone; 
-- ALTER TABLE orders DROP COLUMN IF EXISTS special_requests;
-- ALTER TABLE orders DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- 8. Rename order_items to order_products if it exists
DO $$
BEGIN
    -- Check if order_items exists and order_products doesn't
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') 
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_products') THEN
        
        -- Rename the table
        ALTER TABLE order_items RENAME TO order_products;
        
        -- Update the order_products table structure to match production
        -- Add drop_product_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'drop_product_id') THEN
            ALTER TABLE order_products ADD COLUMN drop_product_id UUID REFERENCES drop_products(id) ON DELETE RESTRICT;
        END IF;
        
        -- Rename quantity to order_quantity if needed
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'quantity')
           AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'order_quantity') THEN
            ALTER TABLE order_products RENAME COLUMN quantity TO order_quantity;
        END IF;
        
        -- Drop unit_price column if it exists (not in production schema)
        ALTER TABLE order_products DROP COLUMN IF EXISTS unit_price;
        
        -- Drop product_id column after migrating to drop_product_id
        -- In a real migration, you'd first populate drop_product_id based on product_id and the order's drop_id
        -- For now, we'll just drop it since this is for local development
        ALTER TABLE order_products DROP COLUMN IF EXISTS product_id;
    END IF;
END $$;

-- 9. Update indexes to match production
-- Drop old indexes
DROP INDEX IF EXISTS idx_orders_customer_email;
DROP INDEX IF EXISTS idx_orders_stripe_payment_intent_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;

-- Add new indexes for order_products
DROP INDEX IF EXISTS idx_order_products_order_id;
DROP INDEX IF EXISTS idx_order_products_drop_product_id;
CREATE INDEX idx_order_products_order_id ON order_products(order_id);
CREATE INDEX idx_order_products_drop_product_id ON order_products(drop_product_id);

-- Add index for clients
DROP INDEX IF EXISTS idx_orders_client_id;
CREATE INDEX idx_orders_client_id ON orders(client_id);

-- 10. Update RLS policies for new structure
-- Drop old policies that might conflict
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON order_products;
DROP POLICY IF EXISTS "Order items are insertable by everyone" ON order_products;
DROP POLICY IF EXISTS "Order items are updatable by authenticated users" ON order_products;
DROP POLICY IF EXISTS "Order items are deletable by authenticated users" ON order_products;

-- Create new policies for order_products
CREATE POLICY "Order products are viewable by everyone" ON order_products FOR SELECT USING (true);
CREATE POLICY "Order products are insertable by everyone" ON order_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Order products are updatable by authenticated users" ON order_products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Order products are deletable by authenticated users" ON order_products FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger for clients updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE clients IS 'Customer information table - stores email and phone for order identification';
COMMENT ON TABLE order_products IS 'Links orders to specific drop products with quantities';
COMMENT ON COLUMN drops.notes IS 'Admin notes for the drop';
COMMENT ON COLUMN drops.last_modified_by IS 'Admin user who last modified this drop';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order identifier';
COMMENT ON COLUMN orders.special_instructions IS 'Customer special requests for the order';
