-- Fix missing foreign key constraint for sells.location_id
-- This script adds the missing foreign key relationship between sells and locations

-- Add foreign key constraint for location_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sells' 
    AND constraint_name = 'sells_location_id_fkey'
  ) THEN
    ALTER TABLE sells ADD CONSTRAINT sells_location_id_fkey 
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;
    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;
