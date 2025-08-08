'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOrgSlug } from '@/lib/useOrgSlug';

const getIndustryIcon = (industry: string) => {
  const icons: { [key: string]: string } = {
    HEALTHCARE: '🏥',
    FINANCE: '💰',
    TECHNOLOGY: '💻',
    EDUCATION: '🎓',
    MANUFACTURING: '🏭',
    GOVERNMENT: '🏛️',
    NON_PROFIT: '🤝',
    GENERAL: '🏢',
  };
  return icons[industry] || '🏢';
};

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orgInfo, setOrgInfo] = useState<{name: string; industry: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = useOrgSlug();

  useEffect(() => {
    const messageParam = searchParams.get('message');
    const emailParam = searchParams.get('email');
    
    if (messageParam) {
      setMessage(messageParam);
    }
    
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }

    // Fetch organization info
    const fetchOrgInfo = async () => {
      if (orgSlug) {
        try {
          const response = await fetch(`/api/organizations/public/${orgSlug}`);
          if (response.ok) {
            const data = await response.json();
            setOrgInfo(data);
          }
        } catch (error) {
          console.error('Failed to fetch org info:', error);
        }
      }
    };

    fetchOrgInfo();
  }, [searchParams, orgSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        const session = await getSession();
        if (session) {
          router.push(`/org/${orgSlug}/dashboard`);
          router.refresh();
        }
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          {orgInfo ? (
            <>
              <h1 className="text-sm text-zinc-600">Welcome back to</h1>
              <h2 className="mt-1 text-2xl font-bold text-indigo-600">{orgInfo.name}</h2>
              <p className="mt-2 text-zinc-600">Sign in to continue your training</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-zinc-900">Sign in</h1>
              <p className="mt-2 text-zinc-600">Access your interactive training platform</p>
            </>
          )}
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

  <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}