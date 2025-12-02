# Multi-Organization User Support Implementation

## Overview
This document outlines the implementation of multi-organization user support, allowing users with the same email to be associated with multiple organizations while maintaining separate profiles and usernames per organization.

## Key Changes Made

### 1. Database Schema Changes (`migration-multi-org.sql`)

**Removed Constraints:**
- `users_email_key` - Unique constraint on email (globally)
- `users_username_key` - Unique constraint on username (globally)

**Added Constraints:**
- `users_email_org_unique` - Composite unique constraint on (email, organization_id)
- `users_username_org_unique` - Composite unique constraint on (username, organization_id)

**Added Indexes:**
- `idx_users_email_org` - Performance index for email+organization lookups
- `idx_users_username_org` - Performance index for username+organization lookups

### 2. API Updates

#### Organization Registration API (`/api/organizations/register/route.ts`)
- Removed global email/username checks
- Added email+organization and username+organization combination checks
- Validates uniqueness within the organization context only

#### User Registration API (`/api/auth/supabase-register/route.ts`)  
- Updated to check email+organizationId combination instead of email globally
- Updated to check username+organizationId combination instead of username globally
- Provides better error messages for organization-specific conflicts

#### User Invitation API (`/api/invitations/send/route.ts`)
- Removed restriction preventing users from being in multiple organizations
- Updated to only check if user exists in the CURRENT organization
- Implemented automatic username generation with organization-specific uniqueness
- Generates usernames like `john`, `john1`, `john2` if conflicts exist within the organization

#### Existing APIs (Already Multi-Org Ready)
- `/api/auth/find-organizations` - Already handles multiple orgs per email ✅
- `/api/auth/send-code` - Already supports orgSlug parameter ✅  
- `/api/auth/verify-code` - Already supports orgSlug parameter ✅

### 3. Frontend Components (Already Multi-Org Ready)
- `EmailLoginFlow` - Already shows organization selection for multi-org users ✅
- `SupabaseProvider` - Already works with user ID context (org-specific) ✅

## How Multi-Org Works Now

### User Registration Flow
1. **Organization Owner Registration**: Creates new org + owner with password
2. **User Invitation**: Existing users can be invited to additional organizations
3. **Email/Code Login**: Non-owners use email verification codes (no passwords)

### Login Flow  
1. User enters email at `/login`
2. System finds all organizations for that email
3. If multiple orgs: User selects organization
4. If single org: Redirects directly to org login
5. User completes login with email code (or password for owners)

### Data Separation
- **Separate Profiles**: Each user has a separate profile per organization
- **Separate Usernames**: Username uniqueness is enforced per-organization  
- **Separate Roles**: Users can have different roles in different organizations
- **Organization Isolation**: All user data is properly scoped to organization context

## Database Migration Steps

1. **Run Migration**: Execute `migration-multi-org.sql` on your database
2. **Test Login Flow**: Verify multi-org selection works
3. **Test Invitations**: Invite existing users to additional organizations
4. **Test Registration**: Create new organizations with existing emails

## Security Considerations

### ✅ Maintained Security
- Organization data isolation is preserved
- Role-based access control works per organization
- Authentication requires proper org context
- Database constraints prevent duplicate users within same org

### ✅ Enhanced Flexibility  
- Users can be org owners in one org, learners in another
- Email addresses can be reused across organizations
- Usernames are scoped to organizations (reduces conflicts)

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create new organization with existing email (should work)
- [ ] Login with multi-org email (should show org selection)
- [ ] Login with single-org email (should redirect directly)
- [ ] Invite existing user to new organization (should work)
- [ ] Verify username conflicts handled within organization
- [ ] Verify organization data isolation maintained
- [ ] Test dashboard access with correct org context

## Notes

- **No Existing Data Migration Needed**: As requested, this assumes fresh organizations or cleared user data
- **Password Policy**: Only organization owners have passwords; others use email codes
- **Username Generation**: Automatic collision resolution within organization scope
- **Backward Compatibility**: Existing single-org users will continue to work normally

## Files Modified

1. `migration-multi-org.sql` - Database schema changes
2. `src/app/api/organizations/register/route.ts` - Org registration
3. `src/app/api/auth/supabase-register/route.ts` - User registration  
4. `src/app/api/invitations/send/route.ts` - User invitations
5. `MULTI-ORG-IMPLEMENTATION.md` - This documentation

## Next Steps

1. Apply database migration
2. Test the login flow with existing data  
3. Test creating new organizations with existing emails
4. Verify all organization-scoped functionality works correctly