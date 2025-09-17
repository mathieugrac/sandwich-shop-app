-- ========================================
-- DATABASE MIGRATION: Move customer names from clients to orders
-- ========================================

-- Step 1: Add customer_name field to orders table
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);

-- Step 2: Populate customer_name field with existing client names
-- (This preserves existing data before we remove the name field)
UPDATE orders 
SET customer_name = clients.name 
FROM clients 
WHERE orders.client_id = clients.id 
AND orders.customer_name IS NULL;

-- Step 3: Make customer_name NOT NULL (after data is populated)
ALTER TABLE orders ALTER COLUMN customer_name SET NOT NULL;

-- Step 4: Remove name field from clients table
ALTER TABLE clients DROP COLUMN name;

-- Step 5: Update the get_or_create_client function
CREATE OR REPLACE FUNCTION get_or_create_client(
  p_email VARCHAR(255), p_phone VARCHAR(20))
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Try to find existing client by email
  SELECT id INTO client_id
  FROM clients
  WHERE email = p_email;
  
  IF client_id IS NOT NULL THEN
    -- Update existing client phone if changed
    UPDATE clients 
    SET phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = client_id;
    RETURN client_id;
  ELSE
    -- Create new client
    INSERT INTO clients (email, phone)
    VALUES (p_email, p_phone)
    RETURNING id INTO client_id;
    RETURN client_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all orders have customer_name populated
SELECT COUNT(*) as orders_without_names 
FROM orders 
WHERE customer_name IS NULL OR customer_name = '';

-- Check clients table structure (should not have name field)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Check orders table structure (should have customer_name field)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Sample data check
SELECT 
  o.order_number,
  o.customer_name,
  c.email,
  c.phone
FROM orders o
JOIN clients c ON o.client_id = c.id
LIMIT 5;
