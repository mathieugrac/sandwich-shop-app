-- Add missing status_changed_at column to drops table

-- Add the status_changed_at column to track when status was last changed
ALTER TABLE drops ADD COLUMN status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing drops to have status_changed_at set to created_at initially
UPDATE drops SET status_changed_at = created_at WHERE status_changed_at IS NULL;
