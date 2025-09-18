-- Update PostgreSQL functions to use correct column names

-- Update check_inventory_availability function
CREATE OR REPLACE FUNCTION check_inventory_availability(
  p_drop_id UUID,
  p_product_id UUID,
  p_requested_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_quantity INTEGER;
BEGIN
  SELECT (stock_quantity - reserved_quantity) INTO available_quantity
  FROM drop_products
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  RETURN COALESCE(available_quantity, 0) >= p_requested_quantity;
END;
$$ LANGUAGE plpgsql;

-- Update reserve_inventory function
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_drop_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_quantity INTEGER;
BEGIN
  -- Get current availability
  SELECT (stock_quantity - reserved_quantity) INTO available_quantity
  FROM drop_products
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  -- Check if enough inventory is available
  IF COALESCE(available_quantity, 0) < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Reserve the inventory
  UPDATE drop_products
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE drop_id = p_drop_id AND product_id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update admin drops functions to use correct column names
CREATE OR REPLACE FUNCTION get_admin_past_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  total_available BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    COALESCE(SUM(dp.stock_quantity - dp.reserved_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('completed', 'cancelled')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name
  ORDER BY d.date DESC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Update get_admin_upcoming_drops function
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  total_available BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    COALESCE(SUM(dp.stock_quantity - dp.reserved_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Update reserve_multiple_drop_products function
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
    SELECT (stock_quantity - reserved_quantity) INTO available_qty
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

-- Update check_multiple_drop_products_availability function
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
    SELECT (stock_quantity - reserved_quantity) INTO available_qty
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
