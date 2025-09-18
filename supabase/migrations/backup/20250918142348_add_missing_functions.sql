-- Add missing PostgreSQL functions for admin drop management

-- Function to get admin past drops
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
    COALESCE(SUM(dp.quantity - dp.reserved_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('completed', 'cancelled')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name
  ORDER BY d.date DESC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin upcoming drops
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
    COALESCE(SUM(dp.quantity - dp.reserved_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;
