'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { useSupabase } from '@/lib/SupabaseProvider';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

export default function BillingOverview() {
  const { user, userProfile, organization: supabaseOrg, loading: authLoading } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && userProfile && userProfile.role !== 'OWNER') {
      router.push(`/org/${orgSlug}/dashboard`);
      return;
    }
  }, [user, userProfile, authLoading, router, orgSlug]);

  const handleManageBilling = async () => {
    if (!supabaseOrg) return;
    
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        console.error('Failed to create billing portal session:', data.error);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error redirecting to billing portal:', error);
      setIsRedirecting(false);
    }
  };

  const handleUpgrade = async (tier: 'PRO' | 'ENTERPRISE') => {
    if (!supabaseOrg) return;
    
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: supabaseOrg.id,
          subscriptionTier: tier,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setIsRedirecting(false);
    }
  };

  if (authLoading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (userProfile.role !== 'OWNER') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only organization owners can access billing settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing details through Stripe's secure portal.
        </p>
      </div>

      {/* Main Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Manage Current Subscription */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-6 h-6 text-cyan-500 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
          </div>
          <p className="text-gray-600 mb-6">
            View your current plan, update payment methods, download invoices, and manage your subscription.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={isRedirecting}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isRedirecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2" />
            )}
            Manage Billing
          </button>
        </div>

        {/* Upgrade Plan */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upgrade Plan</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Get access to more learners, advanced features, and priority support.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => handleUpgrade('PRO')}
              disabled={isRedirecting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Upgrade to Professional - $99/month
            </button>
            <button
              onClick={() => handleUpgrade('ENTERPRISE')}
              disabled={isRedirecting}
              className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Contact Sales for Enterprise
            </button>
          </div>
        </div>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">Secure Billing Management</p>
            <p className="text-blue-700">
              All billing operations are handled securely through Stripe's customer portal. 
              You can update payment methods, view invoices, change plans, and cancel subscriptions 
              directly through their interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}