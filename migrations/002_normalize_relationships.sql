-- Migration: Normalize relationships to use foreign keys instead of name references
-- This migration will:
-- 1. Create new junction tables for many-to-many relationships
-- 2. Migrate existing data from name-based references to ID-based references
-- 3. Update table schemas to use proper foreign keys

-- Step 1: Create new junction tables
CREATE TABLE IF NOT EXISTS application_departments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(application_id, department_id)
);

CREATE TABLE IF NOT EXISTS application_categories (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(application_id, category_id)
);

-- Step 2: Add new foreign key columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);

-- Step 3: Migrate existing data from applications table
-- Migrate approved_departments array to application_departments junction table
INSERT INTO application_departments (application_id, department_id)
SELECT DISTINCT 
  a.id as application_id,
  d.id as department_id
FROM applications a
CROSS JOIN LATERAL unnest(a.approved_departments) AS dept_name
JOIN departments d ON d.name = dept_name
WHERE a.approved_departments IS NOT NULL AND array_length(a.approved_departments, 1) > 0;

-- Migrate categories array to application_categories junction table
INSERT INTO application_categories (application_id, category_id)
SELECT DISTINCT 
  a.id as application_id,
  c.id as category_id
FROM applications a
CROSS JOIN LATERAL unnest(a.categories) AS cat_name
JOIN categories c ON c.name = cat_name
WHERE a.categories IS NOT NULL AND array_length(a.categories, 1) > 0;

-- Step 4: Migrate user departments
UPDATE users 
SET department_id = d.id 
FROM departments d 
WHERE users.department = d.name;

-- Step 5: Migrate access request departments
UPDATE access_requests 
SET department_id = d.id 
FROM departments d 
WHERE access_requests.department = d.name;

-- Step 6: Remove old columns (after ensuring data migration is complete)
-- Note: We'll keep these columns for now and remove them in a separate migration
-- to ensure no data loss during the transition period

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_departments_application_id ON application_departments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_departments_department_id ON application_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_application_categories_application_id ON application_categories(application_id);
CREATE INDEX IF NOT EXISTS idx_application_categories_category_id ON application_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_department_id ON access_requests(department_id); 