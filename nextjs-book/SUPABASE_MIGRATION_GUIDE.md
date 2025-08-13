# Supabase Migration Guide

This guide walks you through migrating your Next.js Learning Platform from PostgreSQL + NextAuth to Supabase.

## Phase 1: Set up Supabase Project

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to your users
4. Save your project URL and API keys

### 2. Configure Environment Variables
Create a `.env.local` file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Keep existing variables for now during migration
DATABASE_URL="your-existing-postgres-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
STRIPE_SECRET_KEY="your-stripe-key"
# ... other existing variables
```

### 3. Set up Database Schema
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the migration script: `supabase-migration.sql`
4. Run the RLS policies script: `supabase-rls-policies.sql`

### 4. Configure Authentication
1. In Supabase Dashboard → Authentication → Settings
2. Set **Site URL**: `http://localhost:3000` (development) or your production URL
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
4. Enable email confirmations if desired
5. Configure email templates as needed

## Phase 2: Data Migration

### 1. Export Existing Data
Run this script to export your current PostgreSQL data:

```bash
# Create a backup of your current data
npm run db:backup
```

### 2. Transform and Import Data
1. Use the provided migration scripts to transform your data
2. Import organizations first
3. Import users (they'll be created in Supabase Auth automatically)
4. Import books, chapters, and other content
5. Import progress and exercise data

### 3. User Migration Strategy
Since Supabase Auth uses different user IDs, you have two options:

**Option A: Keep existing user IDs**
- Create users in Supabase Auth with your existing UUIDs
- Requires using the Supabase service role key

**Option B: Migrate with new IDs**
- Let Supabase generate new UUIDs
- Update all foreign key references
- Provide users with password reset links

We recommend **Option A** for seamless migration.

## Phase 3: Update Application Code

### 1. Authentication Components
Replace NextAuth components with Supabase auth:

```typescript
// Old (NextAuth)
import { useSession, signIn, signOut } from 'next-auth/react'

// New (Supabase)
import { useSupabase } from '@/lib/SupabaseProvider'
```

### 2. API Routes
Update your API routes to use Supabase auth:

```typescript
// Old
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// New
import { createClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/supabase-server'
```

### 3. Database Queries
Replace Prisma queries with Supabase queries:

```typescript
// Old (Prisma)
const users = await prisma.user.findMany({
  where: { organizationId: orgId }
})

// New (Supabase - RLS handles filtering automatically)
const { data: users } = await supabase
  .from('users')
  .select('*')
```

## Phase 4: Testing

### 1. Test Authentication
- [ ] User registration
- [ ] User login
- [ ] Password reset
- [ ] Session persistence
- [ ] Logout functionality

### 2. Test Authorization
- [ ] Organization boundaries (RLS)
- [ ] Role-based permissions
- [ ] Multi-tenant data isolation
- [ ] API route protection

### 3. Test Core Features
- [ ] Book creation and editing
- [ ] Chapter navigation
- [ ] Progress tracking
- [ ] Exercise submission
- [ ] User management

## Phase 5: Production Deployment

### 1. Environment Variables
Update your production environment with Supabase credentials:

```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-key"
```

### 2. Supabase Configuration
- Set production site URL in Supabase dashboard
- Configure email templates for production domain
- Set up proper SMTP for email delivery
- Enable rate limiting and abuse prevention

### 3. Monitoring
- Enable Supabase logs and monitoring
- Set up alerts for authentication failures
- Monitor database performance
- Set up backup schedules

## Rollback Plan

If you need to rollback:

1. **Keep existing PostgreSQL database running** during migration
2. **Maintain NextAuth configuration** until migration is complete
3. **Use feature flags** to switch between auth systems
4. **Have database backups** ready for restoration

## Migration Checklist

### Pre-Migration
- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] RLS policies applied
- [ ] Auth settings configured

### Data Migration
- [ ] Organizations migrated
- [ ] Users migrated (with same UUIDs)
- [ ] Books and chapters migrated
- [ ] Progress data migrated
- [ ] Billing data migrated

### Code Migration
- [ ] Authentication provider updated
- [ ] Middleware updated
- [ ] API routes updated
- [ ] Components updated
- [ ] Database queries updated

### Testing
- [ ] Authentication flows tested
- [ ] Authorization tested
- [ ] Core features tested
- [ ] Multi-tenancy tested
- [ ] Performance tested

### Production
- [ ] Production environment configured
- [ ] DNS and SSL configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Team trained on new system

## Support

If you encounter issues during migration:

1. Check Supabase logs in the dashboard
2. Verify RLS policies are working correctly
3. Test authentication flows in isolation
4. Ensure environment variables are correct
5. Check that JWT tokens contain correct claims

## Benefits After Migration

✅ **Simplified Architecture**: No more NextAuth configuration  
✅ **Better Security**: Database-level RLS policies  
✅ **Real-time Features**: Built-in real-time subscriptions  
✅ **Better DX**: Unified auth + database + storage  
✅ **Scalability**: Supabase handles scaling automatically  
✅ **Cost Effective**: Single service instead of multiple  
✅ **Better Monitoring**: Built-in logs and analytics