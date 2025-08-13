# 🔍 Finding Your Supabase PROJECT_REF

Your **PROJECT_REF** is a unique identifier for your Supabase project. Here's where to find it:

## Method 1: Dashboard URL ✅ **Easiest**

Look at your Supabase dashboard URL:

```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF_HERE
                                    ^^^^^^^^^^^^^^^^^^^^
                                    This is your PROJECT_REF
```

**Example:**
- Dashboard URL: `https://supabase.com/dashboard/project/abcdefghijklmnop`
- Your PROJECT_REF: `abcdefghijklmnop`

## Method 2: Settings Page

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **General**
3. Find **Reference ID** - this is your PROJECT_REF

## Method 3: API Settings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Look at the **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
4. The subdomain part is your PROJECT_REF

## Method 4: Connection Strings

In your API settings, you'll see URLs like:
```
Project URL: https://abcdefghijklmnop.supabase.co
             ^^^^^^^^^^^^^^^^^^^^^^^^
             This subdomain is your PROJECT_REF
```

## Quick Test

Once you have your PROJECT_REF, you can test it:

```bash
# Replace YOUR_PROJECT_REF with your actual project reference
curl https://YOUR_PROJECT_REF.supabase.co/rest/v1/
```

You should get a response about the PostgREST API.

---

**Need help?** Your PROJECT_REF is always the part between `/project/` and the next `/` in your dashboard URL!