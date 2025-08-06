# Stripe Integration Setup Guide

This guide will help you set up Stripe for your Python Interactive Learning Platform.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Node.js and npm installed
3. Your NextJS application running

## Step 1: Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API Keys**
3. Copy your **Publishable key** and **Secret key**
4. Add them to your `.env.local` file:

```bash
STRIPE_SECRET_KEY="sk_test_..." # Your secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Your publishable key
```

## Step 2: Create Subscription Products

You need to create three subscription products in Stripe:

### 2.1 Starter Plan ($29/month)
1. Go to **Products** → **Add Product**
2. Name: "Starter Plan"
3. Description: "5 team members, basic Python courses"
4. Pricing: 
   - Model: Recurring
   - Price: $29.00 USD
   - Billing period: Monthly
5. Save and copy the **Price ID** (starts with `price_`)
6. Add to `.env.local`: `STRIPE_STARTER_PRICE_ID="price_..."`

### 2.2 Pro Plan ($99/month)
1. Go to **Products** → **Add Product**
2. Name: "Pro Plan"
3. Description: "25 team members, all Python courses, advanced features"
4. Pricing: 
   - Model: Recurring
   - Price: $99.00 USD
   - Billing period: Monthly
5. Save and copy the **Price ID**
6. Add to `.env.local`: `STRIPE_PRO_PRICE_ID="price_..."`

### 2.3 Enterprise Plan ($299/month)
1. Go to **Products** → **Add Product**
2. Name: "Enterprise Plan"
3. Description: "Unlimited team members, custom features"
4. Pricing: 
   - Model: Recurring
   - Price: $299.00 USD
   - Billing period: Monthly
5. Save and copy the **Price ID**
6. Add to `.env.local`: `STRIPE_ENTERPRISE_PRICE_ID="price_..."`

## Step 3: Set Up Webhooks

Webhooks are crucial for keeping your database in sync with Stripe subscription changes.

### 3.1 Create Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local development: Use ngrok or similar to expose localhost
   - For production: Use your deployed URL
4. Select events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 3.2 Get Webhook Secret
1. After creating the webhook, click on it
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET="whsec_..."`

## Step 4: Enable Customer Portal

The Customer Portal allows users to manage their subscriptions:

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate test link**
3. Configure allowed actions:
   - ✅ Update subscription
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ View invoice history
4. Set your business information and branding

## Step 5: Configure Trial Periods

To enable 14-day free trials:

1. Go to each of your products
2. Click **Edit product**
3. In pricing section, enable **Free trial**
4. Set trial period to **14 days**

## Step 6: Test the Integration

### 6.1 Use Test Cards
Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 6.2 Test Flow
1. Register a new organization at `/register/organization`
2. Complete payment setup at `/onboarding/payment`
3. Use a test card to create subscription
4. Verify webhook events are received
5. Check that organization status is updated in your database

## Step 7: Production Setup

### 7.1 Switch to Live Mode
1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Create new live API keys
3. Create live webhook endpoints
4. Update environment variables with live keys

### 7.2 Environment Variables for Production
```bash
# Live Stripe keys
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Live Price IDs
STRIPE_STARTER_PRICE_ID="price_live_starter"
STRIPE_PRO_PRICE_ID="price_live_pro"
STRIPE_ENTERPRISE_PRICE_ID="price_live_enterprise"
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check webhook event types are selected

2. **"No such price" error**
   - Verify price IDs are correct
   - Make sure you're using the right mode (test/live)

3. **Subscription not updating in database**
   - Check webhook handler logs
   - Verify organizationId is in subscription metadata
   - Check database connection

### Testing Webhooks Locally

Use ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Use the HTTPS URL in your webhook endpoint
# Example: https://abc123.ngrok.io/api/stripe/webhook
```

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Verify webhook signatures** (already implemented)
3. **Use HTTPS** in production
4. **Regularly rotate** API keys
5. **Monitor** webhook events and failures

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Test Cards](https://stripe.com/docs/testing#cards)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)