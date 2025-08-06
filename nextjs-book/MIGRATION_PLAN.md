# Database Migration Plan: Current Schema → Hierarchical Book Structure

## Overview
Migrating from a flat chapter-based structure to a hierarchical Books → Chapters structure with user access control.

## Migration Steps

### Step 1: Data Preservation
Before migration, we need to:
1. Create a default "Python for Healthcare" book
2. Migrate existing chapters to belong to this book
3. Preserve all existing user progress and exercises
4. Give all existing users access to the default book

### Step 2: Schema Changes
1. Add new tables: `books`, `book_access`
2. Modify existing tables: `chapters` (add bookId), `progress` (add bookId)
3. Add new enums: `Difficulty`, `AccessType`

### Step 3: Data Migration Script
1. Create default book entry
2. Update all existing chapters to reference the default book
3. Update all existing progress records to reference the default book
4. Create book access records for all existing users

### Step 4: Admin User Creation
Create admin user with specified credentials:
- Username: admin
- Email: admin@admin.com  
- Password: 123456 (hashed)
- Role: ADMIN

### Step 5: Verification
1. Verify all existing data is preserved
2. Test existing functionality still works
3. Test new admin functionality

## Rollback Plan
- Keep backup of current database
- Document all changes for potential rollback
- Test migration on development database first