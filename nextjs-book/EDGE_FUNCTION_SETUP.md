# Edge Function Setup Guide

## 🎉 What's Been Created

✅ **Edge Function Created**: `supabase/functions/send-email/index.ts`  
✅ **Email Service Updated**: `src/lib/email.ts` now uses the Edge Function  
✅ **Fallback System**: Graceful fallback to console logging in development  

## 📋 Next Steps to Complete Setup

### 1. Start Docker Desktop (Required for Local Testing)

If you want to test locally before deploying:

```bash
# Start Docker Desktop application first, then:
supabase start
```

### 2. Login to Supabase CLI

```bash
supabase login
```

This will open a browser to authenticate with your Supabase account.

### 3. Link Your Project

Find your project reference from your Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Set Up Resend API Key

You'll need a Resend account for email sending:

1. **Get Resend API Key**:
   - Go to [resend.com](https://resend.com)
   - Sign up and get your API key
   - Verify a domain (or use their sandbox domain for testing)

2. **Set Environment Variables in Supabase**:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
   ```

### 5. Deploy the Edge Function

```bash
supabase functions deploy send-email
```

### 6. Test the Function

Once deployed, test it:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email' \\
  --header 'Authorization: Bearer YOUR_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from Edge Function!</h1>"
  }'
```

## 🔧 Alternative: Use Environment Variable Method

If you prefer not to use Edge Functions immediately, you can also set up SMTP directly in your Supabase dashboard:

1. Go to **Settings > Auth** in your Supabase dashboard
2. Configure SMTP settings:
   - **SMTP Host**: smtp.resend.com
   - **SMTP Port**: 587
   - **SMTP User**: resend
   - **SMTP Pass**: Your Resend API key

## 🧪 Testing Your Verification Code Flow

After deployment, test the workflow:

1. **Send Code**: POST to `/api/auth/send-code`
   ```json
   {
     "email": "test@yourdomain.com",
     "orgSlug": "your-org"
   }
   ```

2. **Check Email**: You should receive a verification code
3. **Verify Code**: POST to `/api/auth/verify-code`
   ```json
   {
     "email": "test@yourdomain.com", 
     "code": "123456",
     "orgSlug": "your-org"
   }
   ```

## 🚨 Current Status

- ✅ **Edge Function Code**: Ready for deployment
- ✅ **Email Service**: Updated to use Edge Function
- ✅ **Fallback System**: Works in development without Edge Function
- ⏳ **Deployment**: Requires your Supabase credentials
- ⏳ **Email Provider**: Requires Resend API key setup

## 🔍 Troubleshooting

### Email Not Sending
1. Check Supabase function logs: `supabase functions logs send-email`
2. Verify Resend API key is set: `supabase secrets list`
3. Check your Resend dashboard for delivery status

### Edge Function Errors
1. Check function logs for detailed error messages
2. Verify environment variables are set correctly
3. Test locally with `supabase start` and Docker Desktop

### Verification Code Not Working
1. Check that emails are being sent successfully
2. Verify the verification code table exists in your database
3. Check the verification code hasn't expired (10-minute limit)

## 📝 Next Development Steps

Once email is working:
1. Set up auth callback route: `/src/app/auth/callback/route.ts`
2. Add rate limiting to prevent code abuse
3. Consider implementing email templates for different scenarios
4. Add proper error handling and user feedback

---

**Ready to deploy?** Run the commands above and your verification code workflow will be fully functional! 🚀