-- Add all remaining missing PostgreSQL functions from production schema

-- Function to reserve multiple drop products inventory in batch
CREATE OR REPLACE FUNCTION reserve_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
  available_qty INTEGER;
  can_reserve BOOLEAN := TRUE;
BEGIN
  -- First check if all items can be reserved
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT (quantity - reserved_quantity) INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;
    
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      can_reserve := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  -- If all can be reserved, reserve them
  IF can_reserve THEN
    FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      UPDATE drop_products
      SET reserved_quantity = reserved_quantity + (item->>'order_quantity')::INTEGER,
          updated_at = NOW()
      WHERE id = (item->>'drop_product_id')::UUID;
    END LOOP;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check multiple drop products availability (for payment flow)
CREATE OR REPLACE FUNCTION check_multiple_drop_products_availability(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item JSONB;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT (quantity - reserved_quantity) INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;

    -- If any item doesn't have enough stock, return false
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- All items are available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create client (by email/phone only)
CREATE OR REPLACE FUNCTION get_or_create_client(
  p_email text, p_phone text)
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

-- Function to release multiple drop products inventory
CREATE OR REPLACE FUNCTION release_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
BEGIN
  -- Release reserved quantities for all items
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    UPDATE drop_products
    SET reserved_quantity = GREATEST(0, reserved_quantity - (item->>'order_quantity')::INTEGER),
        updated_at = NOW()
    WHERE id = (item->>'drop_product_id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
