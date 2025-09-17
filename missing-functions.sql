-- ========================================
-- MISSING DATABASE FUNCTIONS: Add functions needed for payment flow
-- ========================================

-- Function to check availability of multiple drop products without reserving
CREATE OR REPLACE FUNCTION check_multiple_drop_products_availability(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;
    
    -- If any item doesn't have enough quantity, return false
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  -- All items are available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved inventory (for failed payments)
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

-- ========================================
-- VERIFICATION
-- ========================================

-- Test the availability function
SELECT check_multiple_drop_products_availability('[{"drop_product_id": "test", "order_quantity": 1}]'::jsonb) as test_result;
