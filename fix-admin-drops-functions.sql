-- Fix admin drops functions to include status_changed_at field
-- This resolves the "Unknown" issue for completed drops

-- Update get_admin_upcoming_drops to include status_changed_at
CREATE OR REPLACE FUNCTION get_admin_upcoming_drops()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID, location_name VARCHAR(100), status_changed_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id, l.name as location_name, d.status_changed_at
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status IN ('upcoming', 'active')
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Update get_admin_past_drops to include status_changed_at
CREATE OR REPLACE FUNCTION get_admin_past_drops()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID, location_name VARCHAR(100), status_changed_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id, l.name as location_name, d.status_changed_at
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status IN ('completed', 'cancelled')
  ORDER BY d.date DESC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Test the updated functions
SELECT 'Testing get_admin_upcoming_drops()' as test_name;
SELECT * FROM get_admin_upcoming_drops() LIMIT 3;

SELECT 'Testing get_admin_past_drops()' as test_name;
SELECT * FROM get_admin_past_drops() LIMIT 3;
