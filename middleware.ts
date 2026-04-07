import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward /login → /admin/login
  if (pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') ?? '/admin';
    const target = new URL('/admin/login', request.url);
    target.searchParams.set('next', redirectTo);
    return NextResponse.redirect(target);
  }

  // Refresh Supabase session on every request
  const { supabaseResponse, user } = await updateSession(request);

  // Admin auth guard
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|mp4|pdf)).*)',
  ],
};
