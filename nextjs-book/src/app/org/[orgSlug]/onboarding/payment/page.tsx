'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/lib/SupabaseProvider';
import { getStripe, SUBSCRIPTION_TIERS, formatPrice } from '@/lib/stripe';

type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

function PaymentOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, organization, loading } = useSupabase();
  
  const organizationId = searchParams.get('orgId');
  const cancelled = searchParams.get('cancelled') === 'true';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('STARTER');

  useEffect(() => {
    if (loading) return;
    
    if (!user || !userProfile) {
      router.push('/login');
      return;
    }
    
    if (!organizationId) {
      router.push('/register/organization');
      return;
    }
    
    // Check if user is the owner of this organization
    if (organization?.id !== organizationId || userProfile.role !== 'OWNER') {
      router.push(`/org/${organization?.slug || 'dashboard'}/dashboard`);
      return;
    }

    if (cancelled) {
      setError('Payment was cancelled. You can try again or continue with the trial.');
    }
  }, [user, userProfile, organization, loading, organizationId, cancelled, router]);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          subscriptionTier: tier,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: result.data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    // Redirect to dashboard with trial
    router.push(`/org/${organization?.slug}/dashboard`);
  };

  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Setup
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Welcome to {organization?.name || 'your organization'}! Choose your plan to get started.
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4 inline-block">
            <p className="text-blue-800 font-medium">✨ Start with a 14-day free trial</p>
            <p className="text-sm text-blue-600">No credit card required for the trial period</p>
          </div>
        </div>

        {cancelled && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Payment Cancelled</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your payment was cancelled. You can try again or continue with the free trial.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierId, tier]) => {
            const isSelected = selectedTier === tierId;
            const isPopular = tierId === 'PRO';
            
            return (
              <div
                key={tierId}
                className={`relative rounded-lg border ${
                  isSelected
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200'
                } bg-white p-6 flex flex-col justify-between ${
                  isPopular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold tracking-wider text-white uppercase">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                    <input
                      type="radio"
                      name="tier"
                      value={tierId}
                      checked={isSelected}
                      onChange={(e) => setSelectedTier(e.target.value as SubscriptionTier)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(tier.amount)}
                      </span>
                      <span className="text-lg font-medium text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Up to {tier.seats} team members</p>
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-sm text-zinc-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleSubscribe(selectedTier)}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Setting up...' : `Start Free Trial - ${SUBSCRIPTION_TIERS[selectedTier].name}`}
          </button>
          
          <button
            onClick={handleSkipForNow}
            disabled={isLoading}
            className="flex-1 sm:flex-none border border-gray-300 text-zinc-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue with Trial
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your 14-day free trial starts immediately. You can cancel anytime during the trial period.
          </p>
          <p className="mt-1">
            Questions? <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:text-blue-500">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentOnboarding() {
  return (
    <Suspense>
      <PaymentOnboardingForm />
    </Suspense>
  );
}