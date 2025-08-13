# 📧 Supabase SMTP Email Setup Guide

## ✅ What's Already Configured

Your verification code workflow is now set up to use **Supabase's built-in SMTP functionality**:

- ✅ **SMTP Edge Function**: `supabase/functions/send-email-smtp/index.ts`
- ✅ **Email Service**: `src/lib/email.ts` updated to use SMTP function
- ✅ **Fallback System**: Graceful fallback to console logging in development
- ✅ **Native Integration**: Uses Supabase's SMTP configuration

## 🚀 Quick Setup (5 Minutes)

### Step 1: Choose Your Email Provider

#### Option A: Gmail (Recommended for Development)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-gmail@gmail.com
SMTP Pass: your-app-password (not your regular password!)
```

**To get Gmail App Password:**
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"

#### Option B: Outlook/Hotmail
```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
SMTP User: your-email@outlook.com
SMTP Pass: your-account-password
```

#### Option C: Custom SMTP Provider
Any SMTP provider (SendGrid, Mailgun, etc.) works:
```
SMTP Host: smtp.your-provider.com
SMTP Port: 587 (or 465 for SSL)
SMTP User: your-username
SMTP Pass: your-password
```

### Step 2: Deploy the SMTP Edge Function

```bash
# Login to Supabase
supabase login

# Link your project (get project ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Set SMTP environment variables
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-email@gmail.com
supabase secrets set SMTP_PASS=your-app-password
supabase secrets set FROM_EMAIL=your-email@gmail.com

# Deploy the function
supabase functions deploy send-email-smtp
```

### Step 3: Test Your Setup

```bash
# Test the function
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-smtp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "subject": "Test Email from Supabase SMTP",
    "html": "<h1>🎉 SMTP is working!</h1><p>Your verification code workflow is ready.</p>"
  }'
```

## 🔧 Verification Code Testing

Once SMTP is configured, test your verification code workflow:

### 1. Send Verification Code
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yourdomain.com",
    "orgSlug": "your-org-slug"
  }'
```

### 2. Check Your Email
You should receive an email with a 6-digit verification code.

### 3. Verify the Code
```bash
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yourdomain.com",
    "code": "123456",
    "orgSlug": "your-org-slug"
  }'
```

## 🛠️ Troubleshooting

### SMTP Function Not Found
```bash
# Check if function is deployed
supabase functions list

# Redeploy if missing
supabase functions deploy send-email-smtp
```

### Authentication Failed
```bash
# Check your secrets
supabase secrets list

# Verify Gmail app password (not regular password)
# Verify SMTP credentials are correct
```

### Emails Not Sending
```bash
# Check function logs
supabase functions logs send-email-smtp

# Common issues:
# - Wrong SMTP port (use 587 for TLS)
# - Gmail: Need app password, not regular password
# - Firewall blocking SMTP port
```

### Development Mode
In development, emails will be logged to console if SMTP fails:
```
📧 Email fallback (SMTP function failed): {
  to: ['test@example.com'],
  subject: 'Your verification code: 123456',
  text: 'Hello! Your verification code is: 123456'
}
```

## 🏗️ Advanced Configuration

### Custom From Name
```bash
supabase secrets set FROM_EMAIL="Python Interactive <noreply@yourdomain.com>"
```

### Multiple SMTP Providers (Failover)
Modify the Edge Function to try multiple SMTP providers:

```typescript
// In send-email-smtp/index.ts
const SMTP_CONFIGS = [
  {
    host: Deno.env.get('SMTP_HOST_PRIMARY'),
    user: Deno.env.get('SMTP_USER_PRIMARY'),
    pass: Deno.env.get('SMTP_PASS_PRIMARY')
  },
  {
    host: Deno.env.get('SMTP_HOST_BACKUP'),
    user: Deno.env.get('SMTP_USER_BACKUP'),
    pass: Deno.env.get('SMTP_PASS_BACKUP')
  }
]
```

### Rate Limiting
Add rate limiting to prevent abuse:
```typescript
// Check rate limits before sending
const rateLimit = await checkRateLimit(email)
if (rateLimit.exceeded) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Too many emails sent. Please try again later.'
  }), { status: 429 })
}
```

## 📊 Monitoring

### Check Email Delivery
```bash
# View function logs
supabase functions logs send-email-smtp --follow

# View authentication logs
supabase logs --type api --follow
```

### Email Analytics
Consider adding email tracking:
- Open rates
- Click rates
- Delivery status
- Bounce handling

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit SMTP credentials to git
2. **App Passwords**: Use app-specific passwords, not main account passwords
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Email Validation**: Validate email addresses before sending
5. **Logging**: Log email attempts for security monitoring

## 🎯 Next Steps

Once SMTP is working:
1. **Customize Email Templates**: Update verification code email design
2. **Add Rate Limiting**: Prevent verification code abuse
3. **Error Handling**: Improve error messages for users
4. **Email Delivery Status**: Track email delivery success/failure
5. **Multiple Email Types**: Invitation emails, welcome emails, etc.

---

**Your verification code workflow is now ready!** 🚀

Configure SMTP settings and deploy the function to start sending verification codes via email.