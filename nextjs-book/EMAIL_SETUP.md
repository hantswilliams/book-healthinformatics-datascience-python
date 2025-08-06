# Email Configuration with Resend

## Current Setup
The application uses Resend for email delivery with the following configuration:
- Service: Resend (https://resend.com)
- API Key: Configured in `.env.local`
- From Address: `onboarding@resend.dev` (default testing address)

## Important Limitations

### Test Mode Restrictions
When using Resend in test mode (without a verified domain):
- **You can ONLY send emails to the email address associated with your Resend account**
- In this case, emails can only be sent to: `hantsawilliams@gmail.com`
- Attempting to send to other email addresses will result in a 403 error

### Email Features Currently Working
✅ Email service is properly configured  
✅ Templates are working correctly  
✅ API endpoints are functional  
✅ Emails send successfully to verified account email  

### To Enable Full Email Functionality
To send emails to any recipient, you need to:
1. Verify a domain in your Resend dashboard (https://resend.com/domains)
2. Update the `EMAIL_FROM` environment variable to use your verified domain
3. Example: `EMAIL_FROM="noreply@yourdomain.com"`

## Testing
- Use `/api/emails/debug` endpoint to test email delivery
- Use `/api/emails/test` for formatted test emails
- Remember: emails will only be delivered to `hantsawilliams@gmail.com` in test mode

## Email Templates
The application includes:
- Team invitation emails
- Welcome emails for new users
- Trial expiration warning emails
- All templates use responsive HTML design