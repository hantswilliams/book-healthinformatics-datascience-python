import Stripe from 'stripe';

// Server-side only Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Helper function to get tier configuration
export const getTierConfig = (tier: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
  const SUBSCRIPTION_TIERS = {
    STARTER: {
      id: 'STARTER',
      name: 'Starter',
      priceId: process.env.STRIPE_STARTER_PRICE_ID!,
      amount: 2900, // $29.00 in cents
      seats: 5,
      features: [
        '5 team members',
        'Basic Python courses',
        'Progress tracking',
        'Email support'
      ]
    },
    PRO: {
      id: 'PRO',
      name: 'Pro',
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      amount: 9900, // $99.00 in cents
      seats: 25,
      features: [
        '25 team members',
        'All Python courses',
        'Advanced analytics',
        'Custom content creation',
        'Priority support'
      ]
    },
    ENTERPRISE: {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
      amount: 29900, // $299.00 in cents
      seats: 999, // "unlimited"
      features: [
        'Unlimited team members',
        'All features',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee'
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