-- Add statusId column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_id INTEGER REFERENCES statuses(id);

-- Migrate existing data from status varchar to statusId
UPDATE applications 
SET status_id = statuses.id
FROM statuses
WHERE applications.status = statuses.name;

-- For any applications without a matching status, set to 'pending' (id 2)
UPDATE applications 
SET status_id = 2
WHERE status_id IS NULL;

-- Make statusId not null now that all data is migrated
ALTER TABLE applications ALTER COLUMN status_id SET NOT NULL;

-- Optional: Drop the old status column (commented out for safety)
-- ALTER TABLE applications DROP COLUMN status;

