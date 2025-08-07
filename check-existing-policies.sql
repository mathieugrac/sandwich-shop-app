-- Check existing RLS policies and handle migration safely
-- Run this in Supabase SQL Editor

-- Check existing policies on sells table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'sells';

-- Check existing policies on sell_inventory table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'sell_inventory';

-- If policies exist, we can either:
-- 1. Drop them and recreate (uncomment the lines below)
-- 2. Skip the policy creation (recommended if they already work)

-- Option 1: Drop existing policies (uncomment if needed)
-- DROP POLICY IF EXISTS "Public can view active sells" ON sells;
-- DROP POLICY IF EXISTS "Admin can manage sells" ON sells;
-- DROP POLICY IF EXISTS "Public can view active sell inventory" ON sell_inventory;
-- DROP POLICY IF EXISTS "Admin can manage sell inventory" ON sell_inventory;

-- Option 2: Create policies only if they don't exist (safer approach)
DO $$
BEGIN
    -- Create sells policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sells' AND policyname = 'Public can view active sells'
    ) THEN
        CREATE POLICY "Public can view active sells" ON sells
            FOR SELECT USING (status = 'active');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sells' AND policyname = 'Admin can manage sells'
    ) THEN
        CREATE POLICY "Admin can manage sells" ON sells
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Create sell_inventory policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sell_inventory' AND policyname = 'Public can view active sell inventory'
    ) THEN
        CREATE POLICY "Public can view active sell inventory" ON sell_inventory
            FOR SELECT USING (
                sell_id IN (
                    SELECT id FROM sells WHERE status = 'active'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sell_inventory' AND policyname = 'Admin can manage sell inventory'
    ) THEN
        CREATE POLICY "Admin can manage sell inventory" ON sell_inventory
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_next_active_sell', 'reserve_sell_inventory');

-- Create functions (they will replace existing ones)
CREATE OR REPLACE FUNCTION get_next_active_sell()
RETURNS TABLE (
  id UUID,
  sell_date DATE,
  status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.sell_date, s.status
  FROM sells s
  WHERE s.status = 'active'
  AND s.sell_date >= CURRENT_DATE
  ORDER BY s.sell_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reserve_sell_inventory(p_sell_id UUID, p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT available_quantity INTO available_qty
  FROM sell_inventory
  WHERE sell_id = p_sell_id AND product_id = p_product_id;

  IF available_qty >= p_quantity THEN
    UPDATE sell_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE sell_id = p_sell_id AND product_id = p_product_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Verify the migration is complete
SELECT 'Migration Status:' as status;
SELECT 'Tables created:' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sells') THEN '✅ sells' ELSE '❌ sells' END as table_status
UNION ALL
SELECT 'Tables created:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sell_inventory') THEN '✅ sell_inventory' ELSE '❌ sell_inventory' END
UNION ALL
SELECT 'Functions created:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_next_active_sell') THEN '✅ get_next_active_sell' ELSE '❌ get_next_active_sell' END
UNION ALL
SELECT 'Functions created:', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'reserve_sell_inventory') THEN '✅ reserve_sell_inventory' ELSE '❌ reserve_sell_inventory' END; 