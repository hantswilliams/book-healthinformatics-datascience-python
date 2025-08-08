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
export const SUBSCRIPTION_TIERS = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    amount: 2900, // $29.00 in cents
    annualAmount: 1900, // $19.00 in cents (34% savings)
    seats: 5,
    features: [
      'Up to 5 team members',
      'Interactive Python courses',
      'Live code execution environment',
      'Progress tracking',
      'Basic support'
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    amount: 9900, // $99.00 in cents
    annualAmount: 5900, // $59.00 in cents (40% savings)
    seats: 25,
    features: [
      'Up to 25 team members',
      'All Starter features',
      'Advanced analytics & reporting',
      'Custom content upload',
      'Priority support',
      'Team collaboration tools'
    ]
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    amount: 0, // Contact for pricing
    annualAmount: 0,
    seats: 999999, // "unlimited"
    features: [
      '500+ team members',
      'All Organization features',
      'Dedicated account manager',
      'Custom deployment options',
      'SLA guarantee',
      'Advanced security controls'
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