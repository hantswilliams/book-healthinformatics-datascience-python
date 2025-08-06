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
  TEAM: {
    id: 'TEAM',
    name: 'Team',
    amount: 3900, // $39.00 in cents
    annualAmount: 2300, // $23.00 in cents (41% savings)
    seats: 25,
    features: [
      'Up to 25 team members',
      'Interactive Python courses',
      'Live code execution environment',
      'Progress tracking & analytics',
      'Upload your own content',
      'Email support'
    ]
  },
  ORGANIZATION: {
    id: 'ORGANIZATION',
    name: 'Organization',
    amount: 12900, // $129.00 in cents
    annualAmount: 7900, // $79.00 in cents (39% savings)
    seats: 500,
    features: [
      'Up to 500 team members',
      'All Team features',
      'Advanced analytics & reporting',
      'Custom branding',
      'SSO integration',
      'Priority support',
      'Custom integrations'
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