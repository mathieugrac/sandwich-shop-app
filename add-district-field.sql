-- Migration: Add district field to locations table
-- Run this script to update existing locations table

-- Add the district column
ALTER TABLE locations ADD COLUMN district VARCHAR(100);

-- Set a default value for existing records (you can update these manually later)
UPDATE locations SET district = 'Unknown District' WHERE district IS NULL;

-- Make the district column NOT NULL after setting default values
ALTER TABLE locations ALTER COLUMN district SET NOT NULL;

-- Add a comment to document the field
COMMENT ON COLUMN locations.district IS 'District/neighborhood where the location is situated';
