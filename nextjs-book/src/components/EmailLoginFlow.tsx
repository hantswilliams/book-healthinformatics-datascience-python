'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  industry: string;
  subscriptionStatus: string;
  userRole: string;
  userFirstName?: string;
  userLastName: string;
}

interface EmailLoginFlowProps {
  onClose?: () => void;
}

export default function EmailLoginFlow({ onClose }: EmailLoginFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'organizations'>('email');
  const [email, setEmail] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/find-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to find organizations');
        return;
      }

      if (result.organizations.length === 0) {
        setError('No account found with this email address');
        return;
      }

      if (result.organizations.length === 1) {
        // Single organization - redirect directly to login
        const org = result.organizations[0];
        router.push(`/org/${org.slug}/login?email=${encodeURIComponent(email)}`);
        return;
      }

      // Multiple organizations - show selection
      setOrganizations(result.organizations);
      setStep('organizations');

    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Email lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationSelect = (org: Organization) => {
    router.push(`/org/${org.slug}/login?email=${encodeURIComponent(email)}`);
  };

  const getIndustryIcon = (industry: string) => {
    const icons: { [key: string]: string } = {
      HEALTHCARE: '🏥',
      FINANCE: '💰',
      TECHNOLOGY: '💻',
      EDUCATION: '🎓',
      MANUFACTURING: '🏭',
      GOVERNMENT: '🏛️',
      NON_PROFIT: '🤝',
    };
    return icons[industry] || '🏢';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'TRIAL': return 'text-blue-600 bg-blue-100';
      case 'PAST_DUE': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (step === 'organizations') {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Choose your organization</h2>
          <p className="mt-2 text-zinc-600">
            We found {organizations.length} organizations for <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleOrganizationSelect(org)}
              className="w-full rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-2xl sm:text-3xl">{getIndustryIcon(org.industry)}</div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900">{org.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      Your role: <span className="font-medium">{org.userRole}</span>
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">
                      {org.industry.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(org.subscriptionStatus)}`}>
                    {org.subscriptionStatus === 'TRIAL' ? 'Free Trial' : org.subscriptionStatus}
                  </span>
                  <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={() => setStep('email')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Welcome back</h2>
        <p className="mt-2 text-zinc-600">Enter your email to find your organization</p>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:mt-8 sm:p-8">
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@company.com"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Finding organizations…' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-zinc-500">Don&apos;t have an account?</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/register/organization" className="font-medium text-indigo-600 hover:text-indigo-700">
              Create your organization →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}