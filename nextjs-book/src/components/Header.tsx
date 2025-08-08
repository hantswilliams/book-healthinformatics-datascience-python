'use client';

import Link from 'next/link';
import LogoMark from './LogoMark';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useOrgSlug } from '@/lib/useOrgSlug';
import type { User } from '@/types';

interface HeaderProps {
  user?: User | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ user, onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const orgSlug = useOrgSlug();
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Progress',
      href: orgSlug ? `/org/${orgSlug}/progress` : '/progress',
      match: (p: string) => p.includes('/progress')
    },
    {
      label: 'Resources',
      href: orgSlug ? `/org/${orgSlug}/resources` : '/resources',
      match: (p: string) => p.includes('/resources')
    }
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-14">
          {user ? (
            <>
              {/* Hamburger menu button for mobile and desktop menu links */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={onToggleSidebar}
                  className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-zinc-700 hover:text-indigo-600 hover:bg-zinc-100 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isSidebarOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
                
                {/* Menu links only visible for signed-in users on desktop */}
                <div className="hidden lg:flex items-center space-x-1">
                  {navItems.map(item => {
                    const active = item.match(pathname || '');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          'px-3 py-2 text-sm font-medium rounded-md transition',
                          active
                            ? 'text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                            : 'text-zinc-700 hover:text-indigo-700 hover:bg-zinc-100'
                        ].join(' ')}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  {(['OWNER', 'ADMIN'].includes(user.role)) && (
                    <Link
                      href={orgSlug ? `/org/${orgSlug}/dashboard` : '/dashboard'}
                      className={[
                        'px-3 py-2 text-sm font-medium rounded-md transition flex items-center gap-1',
                        pathname?.includes('/dashboard')
                          ? 'text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                          : 'text-zinc-700 hover:text-indigo-700 hover:bg-zinc-100'
                      ].join(' ')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2 4 4 10-10 2 2-12 12z" />
                      </svg>
                      <span>Admin</span>
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Notifications button - hidden on very small screens */}
                <button className="hidden sm:block text-zinc-600 hover:text-indigo-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
                
                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center justify-center rounded-full h-9 w-9 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                  >
                    <span className="text-sm font-medium">
                      {user.username.substring(0, 2).toUpperCase()}
                    </span>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 w-56 mt-2 origin-top-right bg-white/95 backdrop-blur divide-y divide-zinc-100 rounded-xl shadow-lg ring-1 ring-zinc-200 z-50">
                      <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.username
                          }
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={orgSlug ? `/org/${orgSlug}/account` : '/account'}
                          className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Account Settings
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            href={orgSlug ? `/org/${orgSlug}/admin` : '/admin'}
                            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
        {/* Public navbar: brand + sign in only */}
        <div className="flex items-center gap-3 sm:gap-6">
                <Link href="/" className="inline-flex items-center gap-2 group">
                  <LogoMark className="h-7 w-7 transition-transform group-hover:scale-105" variant="brackets" />
                  <span className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">Interactive Coding</span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
          className="inline-flex items-center h-9 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                >
          Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}