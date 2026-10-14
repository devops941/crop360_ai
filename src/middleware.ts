import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'crop360_session';
const JWT_SECRET = process.env.JWT_SECRET || 'crop360_ai_super_secret_jwt_key_2026_india';
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session: { userId: string; role: string; name: string } | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET_KEY);
      session = payload as unknown as { userId: string; role: string; name: string };
    } catch {
      session = null;
    }
  }

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAdminRoute = pathname.startsWith('/admin');

  // 1. If visiting /login or /register while already authenticated -> redirect to /dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If visiting a protected route without session -> redirect to /login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. If visiting an admin route without admin role -> redirect to /dashboard
  if (isAdminRoute && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/dashboard/:path*', '/admin/:path*'],
};
