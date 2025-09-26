-- Add simple drop metrics following user's straightforward approach
-- This replaces the complex JOIN approach with simple counting

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_admin_upcoming_drops();
DROP FUNCTION IF EXISTS get_admin_past_drops();

-- Create get_admin_upcoming_drops function with simple metrics
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- NEW: Total items prepared
  total_orders BIGINT,       -- NEW: Total orders placed
  total_loss BIGINT,         -- NEW: Items not ordered (loss)
  loss_percentage DECIMAL    -- NEW: Loss as percentage
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
    -- Simple orders count: count orders for this drop
    (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_orders,
    -- Simple loss calculation: inventory - orders
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_loss,
    -- Simple percentage: (loss / inventory) * 100
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
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

-- Create get_admin_past_drops function with simple metrics
CREATE OR REPLACE FUNCTION get_admin_past_drops()
RETURNS TABLE (
  id UUID, 
  date DATE, 
  status VARCHAR(20), 
  location_id UUID, 
  location_name VARCHAR(100), 
  status_changed_at TIMESTAMP WITH TIME ZONE,
  total_available BIGINT,
  total_inventory BIGINT,    -- NEW: Total items prepared
  total_orders BIGINT,       -- NEW: Total orders placed
  total_loss BIGINT,         -- NEW: Items not ordered (loss)
  loss_percentage DECIMAL    -- NEW: Loss as percentage
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
    -- Simple orders count: count orders for this drop
    (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_orders,
    -- Simple loss calculation: inventory - orders
    COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id) as total_loss,
    -- Simple percentage: (loss / inventory) * 100
    CASE 
      WHEN COALESCE(SUM(dp.stock_quantity), 0) > 0 THEN 
        ROUND(((COALESCE(SUM(dp.stock_quantity), 0) - (SELECT COUNT(*) FROM orders o WHERE o.drop_id = d.id))::DECIMAL / COALESCE(SUM(dp.stock_quantity), 0)) * 100, 1)
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
