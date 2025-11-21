-- Migration: Remove old name-based columns after data migration
-- This migration should be run after confirming that all data has been successfully migrated
-- and the application has been updated to use the new foreign key structure

-- Step 1: Remove old columns from applications table
ALTER TABLE applications DROP COLUMN IF EXISTS approved_departments;
ALTER TABLE applications DROP COLUMN IF EXISTS categories;

-- Step 2: Remove old columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS department;

-- Step 3: Remove old columns from access_requests table
ALTER TABLE access_requests DROP COLUMN IF EXISTS department;

-- Step 4: Add NOT NULL constraints where appropriate
-- Note: Only add these constraints after ensuring all data has been migrated
-- ALTER TABLE users ALTER COLUMN department_id SET NOT NULL;
-- ALTER TABLE access_requests ALTER COLUMN department_id SET NOT NULL; 