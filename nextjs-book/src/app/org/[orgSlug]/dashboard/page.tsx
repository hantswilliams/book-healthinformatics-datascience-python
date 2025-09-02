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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200  bg-zinc-50/80  backdrop-blur supports-[backdrop-filter]:bg-white/50 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 ">{userOrganization.name}</h1>
              <p className="mt-1 text-sm text-zinc-600 ">Welcome back, {userProfile.first_name || user.email?.split('@')[0]}. Here's your overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={statusTone(userOrganization.subscription_status).tone}>
                {userOrganization.subscription_status === 'TRIAL'
                  ? `Trial · ${Math.max(0, Math.ceil((new Date(userOrganization.trial_ends_at || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left`
                  : statusTone(userOrganization.subscription_status).label}
              </Badge>
              <Badge tone={tierTone(userOrganization.subscription_tier).tone}>
                {tierTone(userOrganization.subscription_tier).label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Alert for trial ending soon */}
        {userOrganization.subscription_status === 'TRIAL' && userOrganization.trial_ends_at && (() => {
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
        })()}

        {/* Stats Overview */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Team Members"
            value={<>{subscriptionStatus?.organization?.currentSeats || 0} / {userOrganization.max_seats}</>}
            icon={(<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>)}
          />
          <StatCard
            label="Plan"
            value={userOrganization.subscription_tier}
            icon={(<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
          />
            <StatCard
              label="Courses"
              value={organizationStats?.totalBooks || 0}
              icon={(<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>)}
            />
          <StatCard
            label="Completion Rate"
            value={organizationStats?.hasData ? `${organizationStats.completionRate}%` : 'No data'}
            icon={(<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card padding="lg" className="h-full">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wide text-zinc-600">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {['OWNER', 'ADMIN'].includes(userProfile?.role || '') && (
                    <Link
                      href={`/org/${orgSlug}/dashboard/team`}
                      className="group relative rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 backdrop-blur-sm transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">Team Management</h4>
                          <p className="text-xs text-zinc-600">Manage team members and course access</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {permissions.canManageContent && (
                    <Link
                      href={`/org/${orgSlug}/dashboard/content`}
                      className="group relative rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 backdrop-blur-sm transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">Content Management</h4>
                          <p className="text-xs text-zinc-600">Build custom Python courses</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  <Link
                    href={`/org/${orgSlug}/dashboard/progress`}
                    className="group relative rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 backdrop-blur-sm transition hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-zinc-900">View Progress</h4>
                        <p className="text-xs text-zinc-600">Track team learning progress</p>
                      </div>
                    </div>
                  </Link>

                  {permissions.canManageBilling && (
                    <Link
                      href={`/org/${orgSlug}/dashboard/billing`}
                      className="group relative rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 backdrop-blur-sm transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">Billing Management</h4>
                          <p className="text-xs text-zinc-600">Update payment methods and billing</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
            </Card>
          </div>

          {/* Organization Info */}
          <Card padding="lg">
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-zinc-600">Organization Info</h3>
            <dl className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Organization</dt>
                <dd className="text-sm font-medium text-zinc-900">{userOrganization.name}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Slug</dt>
                <dd className="text-sm font-medium text-zinc-900">{userOrganization.slug}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Your Role</dt>
                <dd className="text-sm font-medium text-zinc-900">{userProfile.role}</dd>
              </div>
              {userOrganization.subscription_ends_at && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {userOrganization.subscription_status === 'TRIAL' ? 'Trial Ends' : 'Next Billing'}
                  </dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {new Date(userOrganization.subscription_ends_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
            {permissions.canManageBilling && (
              <div className="mt-6">
                <Link
                  href={`/org/${orgSlug}/dashboard/settings`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Organization Settings →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {error && (
          <Card padding="sm" className="mt-8 border-rose-200 bg-rose-50 text-rose-700">
            <div className="text-sm">{error}</div>
          </Card>
        )}
      </div>
    </div>
  );
}