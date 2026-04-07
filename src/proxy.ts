import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ── Rate limiting (in-memory, per-instance — use Cloudflare Workers KV in prod) ──
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now   = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= maxRequests) return false; // blocked

  entry.count++;
  return true;
}

// ── Security headers ──────────────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'X-XSS-Protection':          '1; mode=block',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// ── Middleware ────────────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── API rate limiting ─────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    let maxReqs = 60;
    let windowMs = 60_000;

    if (pathname.startsWith('/api/booking')) {
      maxReqs  = 10;
      windowMs = 60_000;
    } else if (pathname.startsWith('/api/tracking')) {
      maxReqs  = 30;
      windowMs = 60_000;
    } else if (pathname.startsWith('/api/invoice/verify')) {
      maxReqs  = 60;
      windowMs = 60_000;
    }

    const key = `${pathname}:${ip}`;
    if (!rateLimit(key, maxReqs, windowMs)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
  }

  // ── Auth session refresh ──────────────────────────────────────────────────
  const { supabaseResponse, user } = await updateSession(request);

  // ── Protect admin routes ──────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Apply security headers ────────────────────────────────────────────────
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
