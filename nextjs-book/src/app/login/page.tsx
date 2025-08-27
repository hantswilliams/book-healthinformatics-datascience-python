'use client';

import EmailLoginFlow from '@/components/EmailLoginFlow';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';
import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    // Force white background on body and html for login page
    document.body.classList.add('login-page-body');
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'rgb(24 24 27)';
    document.documentElement.style.backgroundColor = 'white';
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('login-page-body');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="login-page min-h-screen bg-white" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <LogoMark className="h-7 w-7 text-zinc-900 transition-transform group-hover:scale-105" variant="brackets" />
              <span className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">Interactive Coding</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <EmailLoginFlow />
      </div>
    </div>
  );
}