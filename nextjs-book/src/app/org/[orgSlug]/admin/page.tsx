'use client';

import { useSupabase } from '@/lib/SupabaseProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, userProfile, organization, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!user || !userProfile) {
      router.push('/login');
      return;
    }

    // Redirect to the new dashboard - this is the new admin interface
    router.push(`/org/${organization?.slug || 'dashboard'}/dashboard`);
  }, [user, userProfile, organization, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}