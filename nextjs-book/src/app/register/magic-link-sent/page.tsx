'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function MagicLinkSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 2.25l-9.75 7.5-9.75-7.5" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Magic Link Sent!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Check your email for the sign-in link
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg space-y-6">
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-700">
                We've sent a secure sign-in link to:
              </p>
              <p className="font-medium text-blue-900 mt-1">
                {email || 'your email address'}
              </p>
            </div>

            <div className="space-y-3 text-left">
              <h3 className="text-sm font-medium text-gray-900">Next steps:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam/junk folder)</li>
                <li>Click the "Sign In" link in the email</li>
                <li>You'll be automatically signed in and taken to your team dashboard</li>
              </ol>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-center text-xs text-gray-500">
              <p>Didn't receive the email?</p>
              <p className="mt-1">
                Links expire after 1 hour for security.{' '}
                <Link 
                  href="/contact" 
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Contact support
                </Link>{' '}
                if you need help.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MagicLinkSentContent />
    </Suspense>
  );
}