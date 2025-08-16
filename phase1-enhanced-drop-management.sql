-- ========================================
-- PHASE 1: Enhanced Drop Management System
-- ========================================
-- This file implements the core database logic for the enhanced drop management system
-- Run this after your existing schema is in place

-- ========================================
-- 1. ENHANCED DROPS TABLE SCHEMA
-- ========================================

-- Add new fields to drops table
ALTER TABLE drops ADD COLUMN IF NOT EXISTS pickup_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE drops ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES admin_users(id);
ALTER TABLE drops ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for pickup_deadline for performance
CREATE INDEX IF NOT EXISTS idx_drops_pickup_deadline ON drops(pickup_deadline);

-- ========================================
-- 2. ENHANCED FUNCTIONS
-- ========================================

-- Enhanced auto-completion function
CREATE OR REPLACE FUNCTION auto_complete_expired_drops()
RETURNS INTEGER AS $$
DECLARE
  completed_count INTEGER := 0;
  drop_record RECORD;
BEGIN
  -- Find drops that should be auto-completed
  FOR drop_record IN
    SELECT d.id, d.date, d.pickup_deadline
    FROM drops d
    WHERE d.status = 'active'
      AND d.pickup_deadline < NOW()
  LOOP
    UPDATE drops
    SET status = 'completed',
        updated_at = NOW(),
        status_changed_at = NOW()
    WHERE id = drop_record.id;
    completed_count := completed_count + 1;
  END LOOP;

  RETURN completed_count;
END;
$$ LANGUAGE plpgsql;

-- Enhanced next active drop function
CREATE OR REPLACE FUNCTION get_next_active_drop()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status = 'active'
    AND l.active = true
    AND d.pickup_deadline > NOW()  -- Only drops that haven't passed pickup deadline
  ORDER BY d.date ASC, d.pickup_deadline ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Home page drops function (shows upcoming and active drops)
CREATE OR REPLACE FUNCTION get_home_page_drops()
RETURNS TABLE (id UUID, date DATE, status VARCHAR(20), location_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.date, d.status, d.location_id
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  WHERE d.status IN ('upcoming', 'active')  -- Only upcoming and active
    AND l.active = true
  ORDER BY d.date ASC, d.status ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to change drop status (including reopening)
CREATE OR REPLACE FUNCTION change_drop_status(
  p_drop_id UUID,
  p_new_status VARCHAR(20),
  p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE drops
  SET status = p_new_status,
      updated_at = NOW(),
      status_changed_at = NOW(),
      last_modified_by = p_admin_user_id
  WHERE id = p_drop_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Calculate pickup deadline based on location hours
CREATE OR REPLACE FUNCTION calculate_pickup_deadline(
  p_drop_date DATE,
  p_location_id UUID
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  pickup_end TIME;
  deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT pickup_hour_end INTO pickup_end
  FROM locations WHERE id = p_location_id;

  deadline := (p_drop_date + pickup_end)::TIMESTAMP WITH TIME ZONE;
  RETURN deadline;
END;
$$ LANGUAGE plpgsql;

-- Check if drop is orderable
CREATE OR REPLACE FUNCTION is_drop_orderable(p_drop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  drop_record RECORD;
BEGIN
  SELECT status, pickup_deadline INTO drop_record
  FROM drops WHERE id = p_drop_id;

  RETURN drop_record.status = 'active' AND drop_record.pickup_deadline > NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. ADMIN INTERFACE FUNCTIONS
-- ========================================

-- Get upcoming drops for admin (upcoming + active)
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

-- Get past drops for admin (completed + cancelled)
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

-- ========================================
-- 4. DATA MIGRATION
-- ========================================

-- Update existing drops to have pickup_deadline based on their date and location
UPDATE drops 
SET pickup_deadline = calculate_pickup_deadline(date, location_id)
WHERE pickup_deadline IS NULL;

-- ========================================
-- 5. VALIDATION CONSTRAINTS
-- ========================================

-- Ensure pickup_deadline is set for all drops
ALTER TABLE drops ADD CONSTRAINT check_pickup_deadline_not_null 
CHECK (pickup_deadline IS NOT NULL);

-- ========================================
-- 6. PERFORMANCE INDEXES
-- ========================================

-- Index for status changes tracking
CREATE INDEX IF NOT EXISTS idx_drops_status_changed_at ON drops(status_changed_at);

-- Composite index for status and deadline queries
CREATE INDEX IF NOT EXISTS idx_drops_status_deadline ON drops(status, pickup_deadline);

-- ========================================
-- 7. TESTING FUNCTIONS
-- ========================================

-- Function to test the enhanced system
CREATE OR REPLACE FUNCTION test_enhanced_drop_system()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := 'Enhanced drop system test results:';
  drop_count INTEGER;
  active_count INTEGER;
  upcoming_count INTEGER;
BEGIN
  -- Test 1: Count drops by status
  SELECT COUNT(*) INTO drop_count FROM drops;
  SELECT COUNT(*) INTO active_count FROM drops WHERE status = 'active';
  SELECT COUNT(*) INTO upcoming_count FROM drops WHERE status = 'upcoming';
  
  test_result := test_result || E'\n- Total drops: ' || drop_count;
  test_result := test_result || E'\n- Active drops: ' || active_count;
  test_result := test_result || E'\n- Upcoming drops: ' || upcoming_count;
  
  -- Test 2: Check pickup_deadline population
  SELECT COUNT(*) INTO drop_count FROM drops WHERE pickup_deadline IS NOT NULL;
  test_result := test_result || E'\n- Drops with pickup_deadline: ' || drop_count;
  
  -- Test 3: Test next active drop function
  IF EXISTS (SELECT 1 FROM get_next_active_drop()) THEN
    test_result := test_result || E'\n- get_next_active_drop() function: WORKING';
  ELSE
    test_result := test_result || E'\n- get_next_active_drop() function: NO ACTIVE DROPS';
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. ROLLBACK FUNCTIONS (if needed)
-- ========================================

-- Function to rollback to old system if needed
CREATE OR REPLACE FUNCTION rollback_drop_enhancements()
RETURNS TEXT AS $$
BEGIN
  -- Remove new columns
  ALTER TABLE drops DROP COLUMN IF EXISTS pickup_deadline;
  ALTER TABLE drops DROP COLUMN IF EXISTS last_modified_by;
  ALTER TABLE drops DROP COLUMN IF EXISTS status_changed_at;
  
  -- Drop new indexes
  DROP INDEX IF EXISTS idx_drops_pickup_deadline;
  DROP INDEX IF EXISTS idx_drops_status_changed_at;
  DROP INDEX IF EXISTS idx_drops_status_deadline;
  
  -- Restore old functions (you'll need to recreate these from your original schema)
  
  RETURN 'Rollback completed. You may need to manually restore original functions.';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- This message will appear when the script completes
DO $$
BEGIN
  RAISE NOTICE 'Phase 1 Enhanced Drop Management System implementation completed successfully!';
  RAISE NOTICE 'New functions available:';
  RAISE NOTICE '- auto_complete_expired_drops() - Enhanced auto-completion';
  RAISE NOTICE '- get_next_active_drop() - Enhanced next active drop';
  RAISE NOTICE '- get_home_page_drops() - Home page drop display';
  RAISE NOTICE '- change_drop_status() - Admin status management';
  RAISE NOTICE '- calculate_pickup_deadline() - Deadline calculation';
  RAISE NOTICE '- is_drop_orderable() - Order validation';
  RAISE NOTICE '- get_admin_upcoming_drops() - Admin upcoming drops';
  RAISE NOTICE '- get_admin_past_drops() - Admin past drops';
  RAISE NOTICE '';
  RAISE NOTICE 'Test the system with: SELECT test_enhanced_drop_system();';
  RAISE NOTICE 'Rollback if needed with: SELECT rollback_drop_enhancements();';
END $$;
