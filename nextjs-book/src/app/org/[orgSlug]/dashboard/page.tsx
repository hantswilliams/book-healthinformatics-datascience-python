'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';
import { Card, StatCard, Badge } from '@/components/ui/Card';
import { useSupabase } from '@/lib/SupabaseProvider';

interface SubscriptionStatus {
  organization: {
    id: string;
    name: string;
    slug: string;
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
  billing?: {
    status: string;
    tier: string;
  };
  permissions: {
    canManageBilling: boolean;
    canInviteUsers: boolean;
    canManageContent: boolean;
  };
}

interface OrganizationStats {
  totalBooks: number;
  activeUsers: number;
  completionRate: number;
  totalProgress: number;
  completedProgress: number;
  totalTimeSpent: number;
  hasData: boolean;
}

export default function Dashboard() {
  const { user, userProfile, organization: userOrganization, loading: authLoading } = useSupabase();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [organizationStats, setOrganizationStats] = useState<OrganizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Don't redirect immediately - wait for auth to fully load
    if (authLoading) return;
    
    // Only redirect if auth loading is complete and we're certain there's no user
    if (!user || !userProfile || !userOrganization) {
      // Add a small delay to prevent race conditions with session rehydration
      const timeout = setTimeout(() => {
        if (!authLoading && (!user || !userProfile || !userOrganization)) {
          router.push('/login');
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }

    fetchDashboardData();
  }, [user, userProfile, userOrganization, authLoading, router]);


  const fetchDashboardData = async () => {
    try {
      // Fetch both subscription status and organization stats in parallel
      const [statusResponse, statsResponse] = await Promise.all([
        fetch('/api/subscription/status'),
        fetch('/api/organizations/stats')
      ]);

      const [statusResult, statsResult] = await Promise.all([
        statusResponse.json(),
        statsResponse.json()
      ]);

      if (!statusResponse.ok) {
        throw new Error(statusResult.error || 'Failed to fetch subscription status');
      }

      if (!statsResponse.ok) {
        throw new Error(statsResult.error || 'Failed to fetch organization stats');
      }

      setSubscriptionStatus(statusResult.data);
      setOrganizationStats(statsResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };


  // Show loading screen while auth is initializing or redirect is happening
  if (authLoading || (!user || !userProfile || !userOrganization)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/billing-portal', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to open billing portal');
      }

      window.location.href = result.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  const statusTone = (status: string): { tone: any; label: string } => {
    switch (status) {
      case 'ACTIVE': return { tone: 'success', label: 'Active' } as const;
      case 'TRIAL': return { tone: 'indigo', label: 'Trial' } as const;
      case 'PAST_DUE': return { tone: 'warning', label: 'Past Due' } as const;
      case 'CANCELED': return { tone: 'danger', label: 'Canceled' } as const;
      default: return { tone: 'neutral', label: status } as const;
    }
  };

  const tierTone = (tier: string): { tone: any; label: string } => {
    switch (tier) {
      case 'STARTER': return { tone: 'neutral', label: 'Starter' } as const;
      case 'PRO': return { tone: 'purple', label: 'Pro' } as const;
      default: return { tone: 'neutral', label: tier } as const;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 ">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile || !userOrganization || !subscriptionStatus || !organizationStats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 ">Access Denied</h2>
          <p className="mt-2 text-gray-600 ">Unable to load dashboard</p>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  const { permissions } = subscriptionStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Modern Header */}
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Main Header Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{userOrganization.name}</h1>
                <Badge tone={tierTone(subscriptionStatus.billing?.tier?.toUpperCase() || subscriptionStatus.organization.subscriptionTier).tone}>
                  {tierTone(subscriptionStatus.billing?.tier?.toUpperCase() || subscriptionStatus.organization.subscriptionTier).label}
                </Badge>
              </div>
              <p className="text-slate-600">Welcome back, {userProfile.first_name || user.email?.split('@')[0]}. Here's your organization overview.</p>
            </div>

            {/* Quick Organization Info */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="font-medium text-slate-700">Your Role:</span>
                <span className="text-slate-600">{userProfile.role}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-slate-700">Team:</span>
                <span className="text-slate-600">{subscriptionStatus?.organization?.currentSeats || 0}/{userOrganization.max_seats}</span>
              </div>
              {userOrganization.subscription_ends_at && (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <span className="font-medium text-slate-700">
                    {userOrganization.subscription_status === 'TRIAL' ? 'Trial Ends:' : 'Next Billing:'}
                  </span>
                  <span className="text-slate-600">
                    {new Date(userOrganization.subscription_ends_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Alert for trial ending soon - only show if no billing setup */}
        {(() => {
          const currentStatus = subscriptionStatus.billing?.status?.toUpperCase() || subscriptionStatus.organization.subscriptionStatus;
          const hasStripeCustomer = subscriptionStatus.organization.hasStripeCustomer;

          if (currentStatus === 'TRIAL' && userOrganization.trial_ends_at && !hasStripeCustomer) {
            const daysRemaining = Math.max(0, Math.ceil((new Date(userOrganization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return daysRemaining <= 3 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Trial ending soon!</strong> Your trial expires in {daysRemaining} days.{' '}
                    {permissions.canManageBilling && (
                      <button onClick={handleManageBilling} className="underline font-medium">
                        Set up billing now
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>
            ) : null;
          }
          return null;
        })()}

        {/* Enhanced Stats Overview */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Team Members Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-lg hover:ring-slate-300/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Team Members</p>
                <p className="text-3xl font-bold text-slate-900">
                  {subscriptionStatus?.organization?.currentSeats || 0}
                  <span className="text-lg font-normal text-slate-500">/{userOrganization.max_seats}</span>
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(((subscriptionStatus?.organization?.currentSeats || 0) / userOrganization.max_seats) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-lg hover:ring-slate-300/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Current Plan</p>
                <p className="text-2xl font-bold text-slate-900">
                  {subscriptionStatus.billing?.tier || subscriptionStatus.organization.subscriptionTier}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-600">Active subscription</span>
              </div>
            </div>
          </div>

          {/* Courses Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-lg hover:ring-slate-300/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Available Courses</p>
                <p className="text-3xl font-bold text-slate-900">{organizationStats?.totalBooks || 0}</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-600">Ready for learning</p>
            </div>
          </div>

          {/* Completion Rate Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-lg hover:ring-slate-300/50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {organizationStats?.hasData ? `${organizationStats.completionRate}%` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {/* Completion Progress Ring */}
            {organizationStats?.hasData ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8">
                    <svg className="h-8 w-8 -rotate-90 transform" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-200" />
                      <circle
                        cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="4" fill="none"
                        className="text-amber-500"
                        strokeDasharray={`${(organizationStats.completionRate / 100) * 87.96} 87.96`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-600">Team progress</span>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-slate-500">No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="space-y-8">
          {/* Quick Actions - Modern Grid */}
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-1 text-sm text-slate-600">Access frequently used tools and features</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {['OWNER', 'ADMIN'].includes(userProfile?.role || '') && (
                <Link
                  href={`/org/${orgSlug}/dashboard/team`}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-blue-500/10 to-blue-600/20"></div>
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-900">Team Management</h3>
                    <p className="mt-1 text-sm text-slate-600">Manage team members and course access</p>
                  </div>
                </Link>
              )}

              {permissions.canManageContent && (
                <Link
                  href={`/org/${orgSlug}/dashboard/content`}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-purple-500/10 to-purple-600/20"></div>
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-purple-50 p-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-900">Content Management</h3>
                    <p className="mt-1 text-sm text-slate-600">Build custom Python courses</p>
                  </div>
                </Link>
              )}

              <Link
                href={`/org/${orgSlug}/dashboard/progress`}
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20"></div>
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900">Chapter Completion</h3>
                  <p className="mt-1 text-sm text-slate-600">Track team learning progress & completion</p>
                </div>
              </Link>

              {['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(userProfile?.role || '') && (
                <Link
                  href={`/org/${orgSlug}/dashboard/code-tracking`}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/20"></div>
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-900">Activity Analytics</h3>
                    <p className="mt-1 text-sm text-slate-600">Monitor code executions & assessments</p>
                  </div>
                </Link>
              )}

              {permissions.canManageBilling && (
                <Link
                  href={`/org/${orgSlug}/dashboard/billing`}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-amber-500/10 to-amber-600/20"></div>
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-amber-50 p-3">
                      <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-900">Billing Management</h3>
                    <p className="mt-1 text-sm text-slate-600">Update payment methods and billing</p>
                  </div>
                </Link>
              )}

              {permissions.canManageBilling && (
                <Link
                  href={`/org/${orgSlug}/dashboard/settings`}
                  className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-md hover:ring-slate-300/50 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-3xl bg-gradient-to-br from-slate-500/10 to-slate-600/20"></div>
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-slate-50 p-3">
                      <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-slate-900">Organization Settings</h3>
                    <p className="mt-1 text-sm text-slate-600">Configure organization preferences</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-900">Dashboard Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}