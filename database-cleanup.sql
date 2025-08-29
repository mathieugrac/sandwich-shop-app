-- ========================================
-- DATABASE CLEANUP FOR SIMPLIFIED DROP SYSTEM
-- ========================================
-- This script removes deadline-related complexity from the database

-- 1. Remove the auto-complete function
DROP FUNCTION IF EXISTS auto_complete_expired_drops();

-- 2. Remove pickup_deadline column from drops table (if it exists)
-- Note: This will fail if the column doesn't exist, which is fine
ALTER TABLE drops DROP COLUMN IF EXISTS pickup_deadline;

-- 3. Remove any deadline-related database functions (if they exist)
DROP FUNCTION IF EXISTS calculate_pickup_deadline(UUID, UUID);

-- 4. Clean up any deadline-related policies or constraints
-- (These will be handled automatically when columns are dropped)

-- 5. Verify the simplified structure
-- The drops table should now only have these columns:
-- id, date, location_id, status, notes, created_at, updated_at, last_modified_by, status_changed_at

-- 6. Update any existing drops to ensure they have valid statuses
UPDATE drops 
SET status = 'upcoming' 
WHERE status IS NULL OR status NOT IN ('upcoming', 'active', 'completed', 'cancelled');

-- 7. Add a comment to document the simplified system
COMMENT ON TABLE drops IS 'Simplified drop system - status managed manually by admin users';
COMMENT ON COLUMN drops.status IS 'Manual status: upcoming, active, completed, cancelled';
