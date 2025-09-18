-- Fix the reserve_multiple_drop_products function to properly handle JSONB parameters
-- The issue was with how we were accessing the JSONB values from the array elements

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
