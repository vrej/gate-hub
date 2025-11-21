# Database Schema Migration Guide

## Overview

This guide outlines the migration from the old name-based schema to a new normalized foreign key schema. The old schema stored department and category names as text arrays and varchar fields, which caused data integrity issues when names were changed.

## Changes Made

### 1. Schema Changes

#### Old Schema Issues:

- `users.department`: varchar field storing department name
- `applications.approvedDepartments`: text array storing department names
- `applications.categories`: text array storing category names
- `accessRequests.department`: varchar field storing department name

#### New Schema:

- `users.departmentId`: integer foreign key to departments.id
- `applicationDepartments`: junction table for many-to-many relationship
- `applicationCategories`: junction table for many-to-many relationship
- `accessRequests.departmentId`: integer foreign key to departments.id

### 2. Migration Steps

#### Step 1: Run Migration 002_normalize_relationships.sql

This migration:

- Creates new junction tables
- Adds foreign key columns
- Migrates existing data from name-based references to ID-based references
- Adds indexes for performance

#### Step 2: Update Application Code

- Update storage.ts to use new helper functions
- Update routes.ts to work with new schema
- Update frontend components to handle new data structure

#### Step 3: Run Migration 003_remove_old_columns.sql

This migration removes the old columns after confirming data migration is complete.

### 3. Code Changes Required

#### Storage Layer (server/storage.ts)

- Updated to use `getApplicationsWithRelations()` helper
- Updated to use `createApplicationWithRelations()` helper
- Updated to use `updateApplicationWithRelations()` helper
- Updated access request methods to use new schema

#### Routes Layer (server/routes.ts)

- Update application creation/update logic
- Update import functionality
- Update search and filtering logic

#### Frontend Components

- Update to handle new data structure with departments and categories as objects
- Update forms to work with department/category IDs instead of names

### 4. Benefits of New Schema

1. **Data Integrity**: Changes to department/category names don't break relationships
2. **Performance**: Foreign key indexes improve query performance
3. **Normalization**: Proper database normalization principles
4. **Flexibility**: Easy to add additional attributes to departments/categories
5. **Consistency**: All relationships use IDs instead of mixing names and IDs

### 5. Backward Compatibility

The migration includes backward compatibility helpers:

- `getDepartmentByName()`: Find department by name
- `getCategoryByName()`: Find category by name
- Data migration preserves all existing relationships

### 6. Testing Checklist

- [ ] Run migration scripts successfully
- [ ] Verify all existing data is preserved
- [ ] Test application creation with new schema
- [ ] Test application updates with new schema
- [ ] Test search and filtering functionality
- [ ] Test access request creation and management
- [ ] Test import functionality
- [ ] Verify frontend displays data correctly

### 7. Rollback Plan

If issues arise:

1. Stop the application
2. Restore database from backup
3. Revert code changes
4. Investigate and fix issues
5. Re-run migration

### 8. Performance Considerations

- New schema includes proper indexes
- Junction tables may require additional joins
- Helper functions optimize common queries
- Consider caching for frequently accessed data

## Implementation Notes

### Helper Functions

The new `db-helpers.ts` file provides:

- `getApplicationsWithRelations()`: Get applications with departments and categories
- `createApplicationWithRelations()`: Create application with department/category relationships
- `updateApplicationWithRelations()`: Update application with department/category relationships
- `checkUserAccessToApplication()`: Check if user has access to application
- `getAccessRequestsWithRelations()`: Get access requests with related data

### Data Structure Changes

#### Old Structure:

```typescript
{
  id: 1,
  name: "App Name",
  approvedDepartments: ["IT", "HR"],
  categories: ["Productivity", "Communication"]
}
```

#### New Structure:

```typescript
{
  id: 1,
  name: "App Name",
  departments: [
    { id: 1, name: "IT", description: "..." },
    { id: 2, name: "HR", description: "..." }
  ],
  categories: [
    { id: 1, name: "Productivity", color: "#3b82f6" },
    { id: 2, name: "Communication", color: "#10b981" }
  ]
}
```

### API Changes

The API endpoints remain the same, but the data structure returned has changed. Frontend components need to be updated to handle the new structure.

## Conclusion

This migration provides a more robust and maintainable database schema that follows proper normalization principles. The changes are backward compatible and include comprehensive helper functions to simplify the transition.
