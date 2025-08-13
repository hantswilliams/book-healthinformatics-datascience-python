# Supabase Email Integration Guide

## Current Status
✅ Email sending has been migrated from Resend to Supabase  
✅ For development: Emails are logged to console  
⚠️ For production: Follow setup instructions below  

## Production Email Setup Options

### Option 1: Supabase Edge Functions (Recommended)

1. **Create Edge Function**:
   ```bash
   supabase functions new send-email
   ```

2. **Deploy the function** with this code in `supabase/functions/send-email/index.ts`:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   
   const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
   
   serve(async (req) => {
     const { to, subject, html, text } = await req.json()
     
     const res = await fetch('https://api.resend.com/emails', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${RESEND_API_KEY}`,
       },
       body: JSON.stringify({
         from: 'onboarding@yourdomain.com',
         to,
         subject,
         html,
         text,
       }),
     })
     
     const data = await res.json()
     return new Response(JSON.stringify(data), {
       headers: { 'Content-Type': 'application/json' },
     })
   })
   ```

3. **Deploy**:
   ```bash
   supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
   ```

4. **Set secrets**:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_key_here
   ```

### Option 2: Supabase Auth Email Templates

Supabase has built-in email templates for auth workflows:
1. Go to Supabase Dashboard > Authentication > Email Templates
2. Configure SMTP settings in Settings > Auth
3. Use `supabase.auth.resetPasswordForEmail()` for password resets
4. Use `supabase.auth.signUp()` for user invitations

### Option 3: Direct SMTP Configuration

1. Go to Supabase Dashboard > Settings > Auth
2. Configure SMTP settings:
   - SMTP Host: your-smtp-server.com
   - SMTP Port: 587
   - SMTP User: your-email@domain.com
   - SMTP Pass: your-password

## Current Implementation

The current `/src/lib/email.ts` is set up to:
- ✅ Log emails to console in development
- ✅ Use Supabase service role key for authentication
- ✅ Ready to integrate with Edge Functions when deployed
- ✅ Maintain same interface as before

## Next Steps for Production

1. Choose an email option above
2. Update the `sendEmail` function in `/src/lib/email.ts` 
3. Uncomment the Edge Function code or implement SMTP
4. Test with your domain email settings

## Environment Variables Needed

```bash
# Already configured:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For Edge Functions with Resend:
RESEND_API_KEY=your_resend_key (set via supabase secrets)

# For direct SMTP (configured in Supabase Dashboard):
# SMTP settings are configured via Supabase Dashboard UI
```