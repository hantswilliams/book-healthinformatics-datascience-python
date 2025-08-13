# Quick Start: Supabase Migration

Your environment is now configured! Here's how to complete the setup:

## Step 1: Get Your Service Role Key

1. Go to your Supabase project: https://erafasedoqcsesbynkye.supabase.co
2. Click **Settings** in the left sidebar
3. Click **API** 
4. Copy the **service_role** key (NOT the anon key)
5. Update your `.env.local` file:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYWZhc2Vkb3Fjc2VzYnlua3llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMTQzNiwiZXhwIjoyMDcwNDg3NDM2fQ.YOUR_SERVICE_ROLE_KEY
   ```

## Step 2: Run Database Migration Scripts

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the contents of `supabase-migration.sql` 
4. Click **Run** to execute the schema migration
5. Create another new query
6. Copy and paste the contents of `supabase-rls-policies.sql`
7. Click **Run** to set up Row Level Security

## Step 3: Verify Setup

Run this command to test your connection:
```bash
node test-supabase-connection.js
```

## Step 4: Configure Authentication (Optional)

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**: `http://localhost:3000/auth/callback`
4. Configure email settings if needed

## Step 5: Test Your Application

```bash
npm run dev
```

## What's Next?

After completing these steps:
- ✅ Your Supabase database will be ready
- ✅ Multi-tenant RLS policies will be active
- ✅ You can start using Supabase Auth
- ✅ Your app will use Supabase instead of Prisma/NextAuth

## Need to Migrate Existing Data?

If you have existing data in your PostgreSQL database, run:
```bash
tsx migrate-to-supabase.ts
```

This will transfer all your users, organizations, books, and progress data to Supabase while preserving user IDs and relationships.