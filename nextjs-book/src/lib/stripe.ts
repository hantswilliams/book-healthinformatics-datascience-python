import { loadStripe } from '@stripe/stripe-js';

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Subscription tier pricing configuration (client-safe)
// Aligned with main landing page pricing
export const SUBSCRIPTION_TIERS = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    amount: 0, // Free for 30 days
    annualAmount: 0,
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
    amount: 9900, // $99.00 in cents
    annualAmount: 7900, // $79.00 in cents (20% savings)
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
    amount: 0, // Custom pricing
    annualAmount: 0,
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

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Helper function to format price for display
export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100);
};