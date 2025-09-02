'use client';

import EmailLoginFlow from '@/components/EmailLoginFlow';
import Link from 'next/link';
import LogoMark from '@/components/LogoMark';

export default function LoginPage() {
  return (
    <div className="login-page min-h-screen bg-white">
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