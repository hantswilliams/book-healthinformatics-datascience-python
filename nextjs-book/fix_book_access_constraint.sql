-- Fix book_access constraint to include userId
-- This allows multiple users to access the same book within an organization

-- Drop the incorrect constraint (using the actual constraint name from migration)
DROP INDEX IF EXISTS "public"."book_access_organizationId_bookId_key";

-- Create the correct constraint that includes userId (using actual camelCase column names)
CREATE UNIQUE INDEX "book_access_organizationId_userId_bookId_key" 
ON "public"."book_access"("organizationId", "userId", "bookId");