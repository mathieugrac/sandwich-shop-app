-- Fix sold calculation to show actual product quantities instead of order count
-- This migration updates the get_admin_past_drops() and get_admin_upcoming_drops() functions
-- to calculate total_orders as the sum of all product quantities sold, not just the count of orders

-- Function to get admin past drops with corrected metrics
CREATE OR REPLACE FUNCTION get_admin_past_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- Total items prepared
  total_orders BIGINT,       -- Total product quantities sold (not order count)
  total_loss BIGINT,         -- Items not ordered (loss)
  loss_percentage DECIMAL    -- Loss as percentage
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available,
    -- Simple inventory calculation: sum all stock quantities
    COALESCE(SUM(dp.stock_quantity), 0) as total_inventory,
    -- FIXED: Sum all product quantities sold (not just order count)
    (SELECT COALESCE(SUM(op.order_quantity), 0) 
     FROM orders o 
     JOIN order_products op ON o.id = op.order_id 
     WHERE o.drop_id = d.id) as total_orders,
    -- FIXED: Loss calculation using actual quantities sold
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COALESCE(SUM(op.order_quantity), 0) 
                                           FROM orders o 
                                           JOIN order_products op ON o.id = op.order_id 
                                           WHERE o.drop_id = d.id) as total_loss,
    -- FIXED: Percentage calculation using actual quantities sold
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COALESCE(SUM(op.order_quantity), 0) 
                                                        FROM orders o 
                                                        JOIN order_products op ON o.id = op.order_id 
                                                        WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
      ELSE 0 
    END as loss_percentage
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('completed', 'cancelled')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date DESC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin upcoming drops with corrected metrics
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- Total items prepared
  total_orders BIGINT,       -- Total product quantities sold (not order count)
  total_loss BIGINT,         -- Items not ordered (loss)
  loss_percentage DECIMAL    -- Loss as percentage
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available,
    -- Simple inventory calculation: sum all stock quantities
    COALESCE(SUM(dp.stock_quantity), 0) as total_inventory,
    -- FIXED: Sum all product quantities sold (not just order count)
    (SELECT COALESCE(SUM(op.order_quantity), 0) 
     FROM orders o 
     JOIN order_products op ON o.id = op.order_id 
     WHERE o.drop_id = d.id) as total_orders,
    -- FIXED: Loss calculation using actual quantities sold
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COALESCE(SUM(op.order_quantity), 0) 
                                           FROM orders o 
                                           JOIN order_products op ON o.id = op.order_id 
                                           WHERE o.drop_id = d.id) as total_loss,
    -- FIXED: Percentage calculation using actual quantities sold
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COALESCE(SUM(op.order_quantity), 0) 
                                                        FROM orders o 
                                                        JOIN order_products op ON o.id = op.order_id 
                                                        WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
      ELSE 0 
    END as loss_percentage
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;
