import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    return NextResponse.next();
  }

  // Handle organization-specific routes
  if (pathname.startsWith('/org/')) {
    const segments = pathname.split('/');
    const orgSlug = segments[2];

    if (!orgSlug) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For login routes, allow access without authentication
    // Organization validation will happen in the layout component
    if (pathname.endsWith('/login')) {
      return NextResponse.next();
    }

    // For authenticated routes, verify user session
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.redirect(new URL(`/org/${orgSlug}/login`, request.url));
    }

    // Organization membership validation will be handled in layout components
    // to avoid database calls in middleware
    return NextResponse.next();
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
    return NextResponse.next();
  }

  return NextResponse.next();
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