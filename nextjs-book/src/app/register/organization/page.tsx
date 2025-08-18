'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoMark from "@/components/LogoMark";
import { motion } from "framer-motion";

type SubscriptionTier = 'STARTER' | 'PRO' | 'ENTERPRISE';
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
    id: 'STARTER' as const,
    name: 'Starter',
    price: null,
    annualPrice: null,
    seats: 25,
    popular: false,
    features: ['Up to 25 learners', 'Core Python curriculum', 'Interactive assignments', 'Basic progress tracking', 'Email support'],
    isFree: true
  },
  {
    id: 'PRO' as const,
    name: 'Professional',
    price: 99,
    annualPrice: 79,
    seats: 500,
    popular: true,
    features: ['Up to 500 learners', 'Everything in Starter', 'Industry-specific content', 'Advanced analytics dashboard', 'Custom branding', 'Priority support']
  },
  {
    id: 'ENTERPRISE' as const,
    name: 'Enterprise',
    price: null,
    annualPrice: null,
    seats: null,
    popular: false,
    features: ['Unlimited learners', 'Everything in Professional', 'Custom integrations (LMS, SSO)', 'Dedicated success manager', 'White-label solution', '24/7 support']
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
    subscriptionTier: 'PRO',
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

      // Registration successful - redirect to org-specific onboarding
      router.push(`/org/${result.data.organizationSlug}/onboarding/payment?orgId=${result.data.organizationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <LogoMark className="h-6 w-6 text-white" variant="brackets" />
                <span className="text-lg font-semibold text-white">Interactive Coding</span>
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/demo-healthcare" className="text-sm text-zinc-400 hover:text-white transition-colors">Healthcare</Link>
              <Link href="/demo-finance" className="text-sm text-zinc-400 hover:text-white transition-colors">Finance</Link>
              <Link href="/demo-university" className="text-sm text-zinc-400 hover:text-white transition-colors">Education</Link>
              <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link>
              <Link href="/login" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white">Start Your Python Learning Journey</h2>
            <p className="mt-2 text-zinc-300">Create your organization and begin with a 30-day free trial</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10"
          >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Subscription Tier Selection */}
            <div>
              <label className="text-base font-medium text-white">Choose Your Plan</label>
              <p className="text-sm leading-5 text-zinc-300">Start with 30-day free trial • No setup fees • Save with annual plans</p>
              
              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center mt-4 mb-6">
                <div className="flex items-center bg-zinc-800/50 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, billingPeriod: 'monthly' }))}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      formData.billingPeriod === 'monthly'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-300 hover:text-white'
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
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    Annual
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              <fieldset className="mt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {subscriptionTiers.map((tier) => {
                    const currentPrice = formData.billingPeriod === 'annual' ? tier.annualPrice : tier.price;
                    const isEnterprise = tier.id === 'ENTERPRISE';
                    const isStarter = tier.id === 'STARTER';
                    
                    return (
                      <div key={tier.id} className="relative">
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              Most Popular
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
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : tier.popular
                              ? 'border-indigo-400/50 bg-gradient-to-b from-indigo-900/20 to-white/5'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-lg font-bold text-white">{tier.name}</div>
                            <div className="text-right">
                              {isEnterprise ? (
                                <div className="text-sm font-medium text-white">Custom</div>
                              ) : isStarter ? (
                                <>
                                  <div className="text-xl font-bold text-white">Free</div>
                                  <div className="text-sm text-zinc-300">for 30 days</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xl font-bold text-white">
                                    ${currentPrice}
                                  </div>
                                  <div className="text-sm text-zinc-300">/month</div>
                                  {formData.billingPeriod === 'annual' && tier.price && (
                                    <div className="text-xs text-green-400 font-medium">
                                      ${tier.price}/month billed annually
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            {isEnterprise ? (
                              <div className="text-sm text-zinc-300">Contact us for pricing</div>
                            ) : (
                              <div className="text-sm text-zinc-300">{tier.seats} learners</div>
                            )}
                          </div>
                          
                          <ul className="space-y-2 text-sm text-zinc-300 flex-grow">
                            {tier.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          {isEnterprise && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <Link
                                href="/contact"
                                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
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
                <h3 className="text-lg font-medium text-white mb-4">Organization Details</h3>
              </div>
              
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-white">
                  Organization Name *
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Acme Healthcare"
                />
              </div>

              <div>
                <label htmlFor="organizationSlug" className="block text-sm font-medium text-white">
                  URL Slug *
                </label>
                <input
                  id="organizationSlug"
                  name="organizationSlug"
                  type="text"
                  required
                  value={formData.organizationSlug}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="acme-healthcare"
                />
                <p className="mt-1 text-xs text-zinc-400">Used in your organization URL</p>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-white">
                  Industry *
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 text-white rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  {industries.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-white">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="https://acme.com"
                />
              </div>

              {/* Owner Details */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-white mb-4 mt-6">Your Details</h3>
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-white">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-white">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 bg-zinc-800/50 border border-white/10 placeholder-zinc-400 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-zinc-900 bg-white hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating Organization...' : 'Start Free Trial'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-zinc-300">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}