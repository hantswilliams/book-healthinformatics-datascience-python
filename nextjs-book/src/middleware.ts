import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for middleware with improved cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Skip middleware for static files, API routes, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/contact' ||
    pathname.startsWith('/register/organization')
  ) {
    return response;
  }

  // Handle organization-specific routes
  if (pathname.startsWith('/org/')) {
    const segments = pathname.split('/');
    const orgSlug = segments[2];

    if (!orgSlug) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For login routes, allow access without authentication
    if (pathname.endsWith('/login')) {
      return response;
    }

    // For authenticated routes, verify user session
    console.log('🛡️ Middleware: Checking auth for:', pathname);
    
    // First check if we have session cookies
    const allCookies = request.cookies.getAll();
    const authCookies = allCookies.filter(cookie => cookie.name.startsWith('sb-'));
    const hasAuthCookies = authCookies.some(cookie => cookie.value);
    
    console.log('🍪 Auth cookies found:', authCookies.length);
    console.log('🍪 Has valid auth cookies:', hasAuthCookies);

    if (!hasAuthCookies) {
      console.log('❌ Middleware: No auth cookies, redirecting to login');
      return NextResponse.redirect(new URL(`/org/${orgSlug}/login`, request.url));
    }

    // Try to get user, but be more lenient on errors during cookie refresh
    console.log('👤 Middleware: Getting user from session...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('👤 Middleware: User ID:', user?.id || 'none');
    console.log('❌ Middleware: Auth error:', error?.message || 'none');

    // Only redirect if we're certain there's no valid session
    // Ignore temporary network errors or token refresh issues
    if (!user && error && !error.message?.includes('refresh')) {
      console.log('❌ Middleware: No valid user session, redirecting to login');
      return NextResponse.redirect(new URL(`/org/${orgSlug}/login`, request.url));
    }
    
    console.log('✅ Middleware: Auth check passed, allowing access');

    // If we have cookies but user is null (likely during refresh), allow through
    // The client-side provider will handle the final authentication state

    // Organization membership validation will be handled in layout components
    // to avoid additional database calls in middleware
    return response;
  }

  // Handle legacy routes - redirect to homepage for now
  // Organization-specific redirects will be handled after login
  const legacyRoutes = [
    '/dashboard',
    '/account', 
    '/admin',
    '/progress',
    '/resources'
  ];

  if (legacyRoutes.includes(pathname) || pathname.startsWith('/chapter/') || pathname.startsWith('/onboarding/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow /login route for email-first flow
  if (pathname === '/login') {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};