# Schema Normalization Solution

## Problem Statement

The user identified a critical database design issue where attributes like categories and departments were being referenced by name instead of ID. This caused problems when names were changed, as the relationships would break at the application level.

## Root Cause Analysis

### Old Schema Issues:

1. **`users.department`**: varchar field storing department name
2. **`applications.approvedDepartments`**: text array storing department names
3. **`applications.categories`**: text array storing category names
4. **`accessRequests.department`**: varchar field storing department name

### Problems with Name-Based References:

- **Data Integrity**: Changing a department/category name breaks all existing relationships
- **Performance**: No indexes on name-based lookups
- **Normalization**: Violates database normalization principles
- **Maintenance**: Difficult to manage and update relationships
- **Consistency**: Mixing ID and name references creates confusion

## Solution Overview

### New Normalized Schema:

1. **`users.departmentId`**: integer foreign key to departments.id
2. **`applicationDepartments`**: junction table for many-to-many relationship
3. **`applicationCategories`**: junction table for many-to-many relationship
4. **`accessRequests.departmentId`**: integer foreign key to departments.id

### Key Benefits:

- ✅ **Data Integrity**: ID-based relationships survive name changes
- ✅ **Performance**: Proper foreign key indexes
- ✅ **Normalization**: Follows database normalization principles
- ✅ **Flexibility**: Easy to add attributes to departments/categories
- ✅ **Consistency**: All relationships use IDs

## Implementation Details

### 1. Database Schema Changes

#### New Tables:

```sql
-- Junction table for application-department relationships
CREATE TABLE application_departments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(application_id, department_id)
);

-- Junction table for application-category relationships
CREATE TABLE application_categories (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(application_id, category_id)
);
```

#### Modified Tables:

```sql
-- Add foreign key columns
ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE access_requests ADD COLUMN department_id INTEGER REFERENCES departments(id);

-- Remove old columns (after migration)
ALTER TABLE applications DROP COLUMN approved_departments;
ALTER TABLE applications DROP COLUMN categories;
ALTER TABLE users DROP COLUMN department;
ALTER TABLE access_requests DROP COLUMN department;
```

### 2. Helper Functions (`server/db-helpers.ts`)

Created comprehensive helper functions to work with the new schema:

```typescript
// Get applications with their departments and categories
export async function getApplicationsWithRelations(filters?: {
  query?: string;
  departmentId?: number;
  status?: string;
  includeHidden?: boolean;
}): Promise<ApplicationWithRelations[]>;

// Create application with department/category relationships
export async function createApplicationWithRelations(data: {
  name: string;
  description?: string;
  url?: string;
  icon?: string;
  status?: string;
  hideFromPublic?: boolean;
  departmentIds: number[];
  categoryIds: number[];
}): Promise<Application>;

// Update application with department/category relationships
export async function updateApplicationWithRelations(
  applicationId: number,
  data: {
    name?: string;
    description?: string;
    url?: string;
    icon?: string;
    status?: string;
    hideFromPublic?: boolean;
    departmentIds?: number[];
    categoryIds?: number[];
  }
): Promise<void>;

// Check if user has access to application
export async function checkUserAccessToApplication(
  userId: number,
  applicationId: number
): Promise<boolean>;
```

### 3. Updated Storage Layer (`server/storage.ts`)

Refactored the storage interface and implementation:

```typescript
// Updated interface
export interface IStorage {
  // Application methods now work with IDs instead of names
  getAllApplications(): Promise<ApplicationWithRelations[]>;
  getApplication(id: number): Promise<ApplicationWithRelations | undefined>;
  createApplication(data: {
    name: string;
    description?: string;
    url?: string;
    icon?: string;
    status?: string;
    hideFromPublic?: boolean;
    departmentIds: number[];
    categoryIds: number[];
  }): Promise<Application>;
  searchApplications(
    query: string,
    departmentId?: number,
    status?: string,
    includeHidden?: boolean
  ): Promise<ApplicationWithRelations[]>;
}
```

### 4. Data Structure Changes

#### Old Structure:

```typescript
{
  id: 1,
  name: "Slack",
  approvedDepartments: ["IT", "HR", "Marketing"],
  categories: ["Communication", "Productivity"]
}
```

#### New Structure:

```typescript
{
  id: 1,
  name: "Slack",
  departments: [
    { id: 1, name: "IT", description: "Information Technology" },
    { id: 2, name: "HR", description: "Human Resources" },
    { id: 3, name: "Marketing", description: "Marketing Department" }
  ],
  categories: [
    { id: 1, name: "Communication", color: "#3b82f6" },
    { id: 2, name: "Productivity", color: "#10b981" }
  ]
}
```

## Migration Process

### Step 1: Data Migration (`002_normalize_relationships.sql`)

1. Create new junction tables
2. Add foreign key columns
3. Migrate existing data from names to IDs
4. Add performance indexes

### Step 2: Code Updates

1. Update storage layer to use helper functions
2. Update routes to work with new schema
3. Update frontend components (if needed)

### Step 3: Cleanup (`003_remove_old_columns.sql`)

1. Remove old name-based columns
2. Add NOT NULL constraints where appropriate

## Migration Tools

### Migration Script (`scripts/migrate-schema.js`)

Provides automated migration process:

- Database backup
- Migration execution
- Data integrity verification
- Rollback capabilities

### Usage:

```bash
# Run full migration
node scripts/migrate-schema.js migrate

# Create backup only
node scripts/migrate-schema.js backup

# Verify data integrity
node scripts/migrate-schema.js verify
```

## Backward Compatibility

The solution includes backward compatibility helpers:

- `getDepartmentByName()`: Find department by name
- `getCategoryByName()`: Find category by name
- Data migration preserves all existing relationships

## Testing Strategy

### Pre-Migration:

- [ ] Backup database
- [ ] Test migration script on staging environment
- [ ] Verify all existing data is preserved

### Post-Migration:

- [ ] Test application creation with new schema
- [ ] Test application updates with new schema
- [ ] Test search and filtering functionality
- [ ] Test access request creation and management
- [ ] Test import functionality
- [ ] Verify frontend displays data correctly

## Performance Considerations

### Improvements:

- Foreign key indexes improve query performance
- Junction tables enable efficient many-to-many queries
- Helper functions optimize common operations

### Monitoring:

- Monitor query performance after migration
- Consider caching for frequently accessed data
- Add database monitoring for slow queries

## Risk Mitigation

### Rollback Plan:

1. Stop application
2. Restore database from backup
3. Revert code changes
4. Investigate and fix issues
5. Re-run migration

### Safety Measures:

- Comprehensive backup before migration
- Data integrity verification
- Staged migration process
- Rollback capabilities

## Conclusion

This schema normalization solution provides:

1. **Robust Data Integrity**: ID-based relationships survive name changes
2. **Better Performance**: Proper indexing and normalized structure
3. **Maintainability**: Clean, normalized database design
4. **Scalability**: Easy to extend with additional attributes
5. **Consistency**: Uniform approach to all relationships

The migration process is designed to be safe, reversible, and comprehensive, ensuring a smooth transition to the new normalized schema while preserving all existing data and functionality.
