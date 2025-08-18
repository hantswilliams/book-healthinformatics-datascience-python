import Stripe from 'stripe';

// Server-side only Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Helper function to get tier configuration
// Aligned with main landing page pricing
export const getTierConfig = (tier: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
  const SUBSCRIPTION_TIERS = {
    STARTER: {
      id: 'STARTER',
      name: 'Starter',
      priceId: process.env.STRIPE_STARTER_PRICE_ID || '', // Optional for free tier
      amount: 0, // Free for 30 days
      seats: 25,
      features: [
        'Up to 25 learners',
        'Core Python curriculum',
        'Interactive assignments',
        'Basic progress tracking',
        'Email support'
      ]
    },
    PRO: {
      id: 'PRO',
      name: 'Professional',
      priceId: process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
      amount: 9900, // $99.00 in cents
      seats: 500,
      features: [
        'Up to 500 learners',
        'Everything in Starter',
        'Industry-specific content',
        'Advanced analytics dashboard',
        'Custom branding',
        'Priority support'
      ]
    },
    ENTERPRISE: {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '', // Custom pricing - contact sales
      amount: 0, // Custom pricing
      seats: 999999, // "unlimited"
      features: [
        'Unlimited learners',
        'Everything in Professional',
        'Custom integrations (LMS, SSO)',
        'Dedicated success manager',
        'White-label solution',
        '24/7 support'
      ]
    }
  } as const;
  
  return SUBSCRIPTION_TIERS[tier];
};

// Webhook signature verification
export const verifyWebhookSignature = (payload: string | Buffer, signature: string): Stripe.Event => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
};