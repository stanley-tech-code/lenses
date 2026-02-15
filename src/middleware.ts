import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'change-this-secret-in-production');

export async function middleware(request: NextRequest) {
  // Exclude auth routes, static files, and public assets
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname === '/auth/sign-in' ||
    request.nextUrl.pathname === '/auth/sign-up'
  ) {
    return NextResponse.next();
  }

  // Check for auth token in header or cookie
  const token =
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login for page requests
    if (!request.nextUrl.pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/sign-in';
      return NextResponse.redirect(url);
    }
    // Return 401 for API requests
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Add user info to headers for downstream use if needed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub as string);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-branch', payload.branchId as string || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Token invalid
    if (!request.nextUrl.pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/sign-in';
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
