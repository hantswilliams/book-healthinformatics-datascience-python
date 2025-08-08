'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function OnboardingSuccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!sessionId) {
      router.push('/dashboard');
      return;
    }

    // Verify the checkout session (optional - for displaying details)
    const verifySession = async () => {
      try {
        // You could create an API endpoint to verify the session
        // For now, we'll just show success and redirect
        setIsLoading(false);
      } catch (err) {
        setError('Failed to verify payment');
        setIsLoading(false);
      }
    };

    verifySession();
  }, [session, status, sessionId, router]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Python Interactive!
          </h2>
          
          <p className="mt-4 text-lg text-gray-600">
            Your subscription has been set up successfully!
          </p>
          
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <p className="font-semibold">🎉 Your 14-day free trial has started!</p>
              <p className="mt-1">
                Explore all features and invite your team members. No charges until your trial ends.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps:</h3>
          
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Invite your team</p>
                <p className="text-sm text-gray-600">Add team members to start collaborative learning</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Explore courses</p>
                <p className="text-sm text-gray-600">Browse Python courses tailored for your industry</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Create content</p>
                <p className="text-sm text-gray-600">Build custom courses for your organization</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Track progress</p>
                <p className="text-sm text-gray-600">Monitor team learning and completion rates</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
          
          <p className="text-center text-sm text-gray-500">
            Need help? <a href="mailto:support@yourcompany.com" className="text-blue-600 hover:text-blue-500">Contact our support team</a>
          </p>
        </div>

        {/* Organization Info */}
        {session && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Signed in as <span className="font-medium">{session.user.firstName} {session.user.lastName}</span>
            </p>
            <p className="text-xs text-gray-500">
              {session.user.organizationName} • {session.user.role}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingSuccess() {
  return (
    <Suspense>
      <OnboardingSuccessForm />
    </Suspense>
  );
}