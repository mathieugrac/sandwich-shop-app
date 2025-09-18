-- Fix ALL functions that use jsonb_array_elements with the problematic pattern
-- This ensures consistent JSONB parameter handling across all functions

-- Fix reserve_multiple_drop_products function (ensure it's properly fixed)
CREATE OR REPLACE FUNCTION reserve_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item_json JSONB;
  available_qty INTEGER;
  can_reserve BOOLEAN := TRUE;
BEGIN
  -- First check if all items can be reserved
  FOR item_json IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item_json->>'drop_product_id')::UUID;
    
    IF available_qty < (item_json->>'order_quantity')::INTEGER THEN
      can_reserve := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  -- If all can be reserved, reserve them
  IF can_reserve THEN
    FOR item_json IN SELECT value FROM jsonb_array_elements(p_order_items)
    LOOP
      UPDATE drop_products
      SET reserved_quantity = reserved_quantity + (item_json->>'order_quantity')::INTEGER,
          updated_at = NOW()
      WHERE id = (item_json->>'drop_product_id')::UUID;
    END LOOP;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix release_multiple_drop_products function
CREATE OR REPLACE FUNCTION release_multiple_drop_products(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item_json JSONB;
BEGIN
  -- Release reserved quantities for all items
  FOR item_json IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    UPDATE drop_products
    SET reserved_quantity = GREATEST(0, reserved_quantity - (item_json->>'order_quantity')::INTEGER),
        updated_at = NOW()
    WHERE id = (item_json->>'drop_product_id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Ensure check_multiple_drop_products_availability is also correct
CREATE OR REPLACE FUNCTION check_multiple_drop_products_availability(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item_json JSONB;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item_json IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item_json->>'drop_product_id')::UUID;

    -- If any item doesn't have enough stock, return false
    IF available_qty < (item_json->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- All items are available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
