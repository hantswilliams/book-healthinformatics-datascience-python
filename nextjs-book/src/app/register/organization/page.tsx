'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SubscriptionTier = 'TEAM' | 'ORGANIZATION' | 'ENTERPRISE';
type Industry = 'GENERAL' | 'HEALTHCARE' | 'FINANCE' | 'TECHNOLOGY' | 'EDUCATION' | 'MANUFACTURING' | 'GOVERNMENT' | 'NON_PROFIT';

interface FormData {
  organizationName: string;
  organizationSlug: string;
  industry: Industry;
  website: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  subscriptionTier: SubscriptionTier;
  billingPeriod: 'monthly' | 'annual';
}

const subscriptionTiers = [
  {
    id: 'TEAM' as const,
    name: 'Team',
    price: 39,
    annualPrice: 23,
    seats: 25,
    popular: false,
    features: ['Up to 25 team members', 'Interactive Python courses', 'Progress tracking', 'Upload your own content']
  },
  {
    id: 'ORGANIZATION' as const,
    name: 'Organization',
    price: 129,
    annualPrice: 79,
    seats: 500,
    popular: true,
    features: ['Up to 500 team members', 'All Team features', 'Advanced analytics', 'Custom branding', 'Priority support']
  },
  {
    id: 'ENTERPRISE' as const,
    name: 'Enterprise',
    price: null,
    annualPrice: null,
    seats: null,
    popular: false,
    features: ['500+ team members', 'Custom deployment', 'Dedicated support', 'SLA guarantee']
  }
];

const industries = [
  { value: 'GENERAL', label: 'General' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'FINANCE', label: 'Finance & Trading' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'NON_PROFIT', label: 'Non-Profit' },
];

export default function OrganizationRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    organizationName: '',
    organizationSlug: '',
    industry: 'GENERAL',
    website: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    subscriptionTier: 'TEAM',
    billingPeriod: 'annual'
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug when organization name changes
      ...(name === 'organizationName' && { organizationSlug: generateSlug(value) })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/organizations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationSlug: formData.organizationSlug,
          industry: formData.industry,
          website: formData.website || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          subscriptionTier: formData.subscriptionTier,
          billingPeriod: formData.billingPeriod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Registration successful - redirect to payment setup or onboarding
      router.push(`/onboarding/payment?orgId=${result.data.organizationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Start Your Python Learning Journey</h2>
          <p className="mt-2 text-gray-600">Create your organization and begin with a 14-day free trial</p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Subscription Tier Selection */}
            <div>
              <label className="text-base font-medium text-gray-900">Choose Your Plan</label>
              <p className="text-sm leading-5 text-gray-500">Start with 14-day free trial • No setup fees • 50% off annual plans</p>
              
              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center mt-4 mb-6">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, billingPeriod: 'monthly' }))}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      formData.billingPeriod === 'monthly'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, billingPeriod: 'annual' }))}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      formData.billingPeriod === 'annual'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    Annual
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Save up to 41%
                    </span>
                  </button>
                </div>
              </div>

              <fieldset className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {subscriptionTiers.map((tier) => {
                    const currentPrice = formData.billingPeriod === 'annual' ? tier.annualPrice : tier.price;
                    const isEnterprise = tier.id === 'ENTERPRISE';
                    
                    return (
                      <div key={tier.id} className="relative">
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              POPULAR
                            </span>
                          </div>
                        )}
                        <input
                          id={tier.id}
                          name="subscriptionTier"
                          type="radio"
                          value={tier.id}
                          checked={formData.subscriptionTier === tier.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <label
                          htmlFor={tier.id}
                          className={`cursor-pointer rounded-lg border p-6 flex flex-col h-full ${
                            formData.subscriptionTier === tier.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : tier.popular
                              ? 'border-indigo-200 bg-indigo-50'
                              : 'border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-lg font-bold text-zinc-900">{tier.name}</div>
                            <div className="text-right">
                              {isEnterprise ? (
                                <div className="text-sm font-medium text-zinc-900">Custom</div>
                              ) : (
                                <>
                                  <div className="text-xl font-bold text-zinc-900">
                                    ${currentPrice}
                                  </div>
                                  <div className="text-sm text-zinc-600">/month</div>
                                  {formData.billingPeriod === 'annual' && tier.price && (
                                    <div className="text-xs text-green-600 font-medium">
                                      Save ${(tier.price - tier.annualPrice!) * 12}/year
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            {isEnterprise ? (
                              <div className="text-sm text-zinc-600">Contact us for pricing</div>
                            ) : (
                              <div className="text-sm text-zinc-600">{tier.seats} team members</div>
                            )}
                          </div>
                          
                          <ul className="space-y-2 text-sm text-zinc-700 flex-grow">
                            {tier.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          {isEnterprise && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Link
                                href="/contact"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                              >
                                Contact Sales →
                              </Link>
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Organization Details */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
              </div>
              
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-zinc-700">
                  Organization Name *
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Healthcare"
                />
              </div>

              <div>
                <label htmlFor="organizationSlug" className="block text-sm font-medium text-zinc-700">
                  URL Slug *
                </label>
                <input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  required
                  value={formData.organizationSlug}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="acme-healthcare"
                />
                <p className="mt-1 text-xs text-gray-500">Used in your organization URL</p>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">
                  Industry *
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {industries.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-zinc-700">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://acme.com"
                />
              </div>

              {/* Owner Details */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Your Details</h3>
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Organization...' : 'Start Free Trial'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Want to join an existing organization?{' '}
                <Link href="/register/join" className="font-medium text-blue-600 hover:text-blue-500">
                  Join with invite code
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}