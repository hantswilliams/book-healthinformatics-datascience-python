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
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    amount: 2900, // $29.00 in cents
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
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