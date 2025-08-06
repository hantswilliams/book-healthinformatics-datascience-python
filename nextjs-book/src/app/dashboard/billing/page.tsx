'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, SUBSCRIPTION_TIERS } from '@/lib/stripe';

interface BillingEvent {
  id: string;
  eventType: string;
  amount?: number;
  currency: string;
  createdAt: string;
  metadata?: any;
}

interface SubscriptionDetails {
  organization: {
    id: string;
    name: string;
    subscriptionStatus: string;
    subscriptionTier: string;
    maxSeats: number;
    currentSeats: number;
    subscriptionStartedAt?: string;
    subscriptionEndsAt?: string;
    trialEndsAt?: string;
    trialDaysRemaining: number;
    hasStripeCustomer: boolean;
  };
  stripe?: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  permissions: {
    canManageBilling: boolean;
  };
}

export default function BillingOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check permissions - only owners can view billing
    if (session.user.role !== 'OWNER') {
      router.push('/dashboard');
      return;
    }

    fetchBillingData();
  }, [session, status, router]);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      
      const [statusResponse, eventsResponse] = await Promise.all([
        fetch('/api/subscription/status'),
        fetch('/api/billing/events')
      ]);

      if (!statusResponse.ok) {
        throw new Error('Failed to load billing data');
      }

      const statusResult = await statusResponse.json();
      setSubscriptionDetails(statusResult.data);

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json();
        setBillingEvents(eventsResult.data || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setError(''); // Clear any previous errors
      setIsLoadingPortal(true);
      
      // First try to open billing portal
      let response = await fetch('/api/stripe/billing-portal', { method: 'POST' });
      let result = await response.json();

      // If no billing account exists, create one first
      if (!response.ok && result.error === 'No billing account found') {
        console.log('Creating Stripe customer...');
        const setupResponse = await fetch('/api/organizations/setup-billing', { method: 'POST' });
        const setupResult = await setupResponse.json();
        
        if (!setupResponse.ok) {
          throw new Error(setupResult.error || 'Failed to setup billing account');
        }
        
        // Now try opening billing portal again
        response = await fetch('/api/stripe/billing-portal', { method: 'POST' });
        result = await response.json();
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = result.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setIsLoadingPortal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-800 bg-green-100';
      case 'TRIAL': return 'text-blue-800 bg-blue-100';
      case 'PAST_DUE': return 'text-yellow-800 bg-yellow-100';
      case 'CANCELED': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PAYMENT_SUCCEEDED':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'PAYMENT_FAILED':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'TRIAL_STARTED':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  const getEventDescription = (event: BillingEvent) => {
    switch (event.eventType) {
      case 'PAYMENT_SUCCEEDED':
        return `Payment of ${formatPrice(event.amount || 0)} succeeded`;
      case 'PAYMENT_FAILED':
        return 'Payment failed';
      case 'TRIAL_STARTED':
        return '14-day free trial started';
      case 'SUBSCRIPTION_CREATED':
        return 'Subscription created';
      case 'SUBSCRIPTION_UPDATED':
        return 'Subscription updated';
      case 'SUBSCRIPTION_CANCELED':
        return 'Subscription canceled';
      default:
        return event.eventType.replace(/_/g, ' ').toLowerCase();
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Unable to load billing information</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const { organization } = subscriptionDetails;
  const currentTier = SUBSCRIPTION_TIERS[organization.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link href="/dashboard" className="text-gray-500 hover:text-zinc-700">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-gray-500">Billing</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your subscription, billing, and usage
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(organization.subscriptionStatus)}`}>
                {organization.subscriptionStatus === 'TRIAL' ? `Trial (${organization.trialDaysRemaining} days left)` : organization.subscriptionStatus}
              </span>
              {organization.hasStripeCustomer && (
                <button
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoadingPortal ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Opening...
                    </>
                  ) : (
                    'Manage Billing'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Trial Warning */}
        {organization.subscriptionStatus === 'TRIAL' && organization.trialDaysRemaining <= 3 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Trial ending soon!</strong> Your trial expires in {organization.trialDaysRemaining} days.{' '}
                  <button onClick={handleManageBilling} className="underline font-medium">
                    Set up billing now
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{organization.subscriptionTier}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(currentTier.amount)} per month
                    </p>
                    <div className="mt-4 space-y-2">
                      {currentTier.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-zinc-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {organization.currentSeats}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {organization.maxSeats} seats
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(organization.currentSeats / organization.maxSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {organization.subscriptionEndsAt && (
                    <p className="text-sm text-gray-600">
                      {organization.subscriptionStatus === 'TRIAL' ? 'Trial ends' : 'Next billing date'}:{' '}
                      <span className="font-medium">
                        {new Date(organization.subscriptionEndsAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                  
                  {subscriptionDetails.stripe?.cancelAtPeriodEnd && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Subscription ending:</strong> Your subscription will end on{' '}
                        {new Date(subscriptionDetails.stripe.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Usage This Month</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Active Users</span>
                    <span className="text-sm text-gray-900">{organization.currentSeats}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Courses Accessed</span>
                    <span className="text-sm text-gray-900">12</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Exercise Completions</span>
                    <span className="text-sm text-gray-900">247</span>
                  </div>
                </div>
              </div>
            </div>

            {organization.hasStripeCustomer && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Access your secure billing portal to manage subscriptions, payment methods, and download invoices.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoadingPortal}
                      className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Update payment method
                    </button>
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoadingPortal}
                      className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Change subscription plan
                    </button>
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoadingPortal}
                      className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download invoices
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      🔒 Powered by Stripe's secure billing portal
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Setup CTA */}
            {!organization.hasStripeCustomer && organization.subscriptionStatus === 'TRIAL' && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Billing</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You're currently on a free trial. Setup billing to manage your subscription and payment methods.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Ready to setup billing?
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Create your billing account to access subscription management and payment options.
                          </p>
                        </div>
                        <div className="mt-4">
                          <div className="flex space-x-3">
                            <button
                              onClick={handleManageBilling}
                              disabled={isLoadingPortal}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              {isLoadingPortal ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Setting up...
                                </>
                              ) : (
                                'Setup Billing Account'
                              )}
                            </button>
                            <Link
                              href="/register/organization"
                              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
                            >
                              Choose Plan
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        {billingEvents.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Billing Activity</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flow-root">
                <ul className="-mb-8">
                  {billingEvents.slice(0, 10).map((event, eventIndex) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIndex !== billingEvents.slice(0, 10).length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          {getEventIcon(event.eventType)}
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {getEventDescription(event)}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(event.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {billingEvents.length > 10 && organization.hasStripeCustomer && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleManageBilling}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View all billing history →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}