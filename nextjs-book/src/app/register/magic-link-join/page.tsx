'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MagicLinkJoinPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email');
  const orgSlug = searchParams.get('org');

  useEffect(() => {
    // This page is deprecated - redirect users to the appropriate login page
    if (email && orgSlug) {
      // Redirect to org-specific login with pre-filled email
      router.push(`/org/${orgSlug}/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Please use the magic link option to sign in')}`);
    } else if (email) {
      // Redirect to general login
      router.push(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent('Please use the magic link option to sign in')}`);
    } else {
      // No email provided, redirect to home
      router.push('/');
    }
  }, [email, orgSlug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting you to login...</p>
      </div>
    </div>
  );
}