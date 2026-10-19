import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected application routes that require an active session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/leaderboard',
  '/member',
  '/activity',
  '/goals',
  '/admin',
  '/pick-profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const sessionCookie = request.cookies.get('team_goal_tracker_session');

    // If session cookie is missing entirely, redirect to root login screen
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled independently with precise 401 JSON responses)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
