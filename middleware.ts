import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ── Config ────────────────────────────────────────────────────────────────────
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com';
const IS_DEV   = process.env.NODE_ENV !== 'production';

// ── Security Headers ──────────────────────────────────────────────────────────
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' https://imagedelivery.net data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'X-XSS-Protection':          '1; mode=block',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':   CSP_DIRECTIVES,
  ...(!IS_DEV ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  } : {}),
};

function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

// ── Rate Limiter (in-memory; pairs with Cloudflare rules in production) ───────
// Note: state resets on cold starts in serverless. For stateful limiting use
// Upstash Redis or Cloudflare Rate Limiting rules in production.
const RL_STORE   = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW  = 60_000; // 1 minute
const RL_LIMITS  = { api: 60, default: 300 };
let   lastPurge  = Date.now();

function checkRate(ip: string, limit: number): { ok: boolean; remaining: number } {
  const now   = Date.now();
  // Purge expired entries once per minute
  if (now - lastPurge > RL_WINDOW) {
    for (const [k, v] of RL_STORE) { if (v.resetAt < now) RL_STORE.delete(k); }
    lastPurge = now;
  }
  const entry = RL_STORE.get(ip);
  if (!entry || entry.resetAt < now) {
    RL_STORE.set(ip, { count: 1, resetAt: now + RL_WINDOW });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { ok: entry.count <= limit, remaining };
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = IS_DEV
  ? ['http://localhost:3000', 'http://localhost:3001', APP_URL]
  : [APP_URL, 'https://www.sccourier.com'];

function corsHeaders(origin: string, res: NextResponse): NextResponse {
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin',  origin);
    res.headers.set('Vary', 'Origin');
  }
  return res;
}

// ── Suspicious request detection ──────────────────────────────────────────────
const BLOCK_PATTERNS = [
  /\.(php|asp|aspx|cgi|jsp|env|git|sql|bak|conf|sh|bash|exe)$/i,
  /\/(wp-admin|wp-login|xmlrpc|phpinfo|\.env|etc\/passwd|proc\/self|\.git)/i,
  /union[\s+]select|select[\s+]from|insert[\s+]into|drop[\s+]table/i,
  /<script[\s>]|javascript:|vbscript:/i,
];

function isSuspicious(pathname: string, ua: string): boolean {
  return BLOCK_PATTERNS.some(p => p.test(pathname) || p.test(ua));
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip           = getIp(request);
  const ua           = request.headers.get('user-agent') ?? '';
  const isApi        = pathname.startsWith('/api/');
  const origin       = request.headers.get('origin') ?? '';

  // 1. Block suspicious requests
  if (isSuspicious(pathname, ua)) {
    if (IS_DEV) console.warn(`[Security] Suspicious from ${ip}: ${pathname}`);
    return applySecurityHeaders(new NextResponse('Forbidden', { status: 403 }));
  }

  // 2. Rate limiting
  const limit = isApi ? RL_LIMITS.api : RL_LIMITS.default;
  const rl    = checkRate(ip, limit);

  if (!rl.ok) {
    if (IS_DEV) console.warn(`[RateLimit] ${ip} exceeded ${limit}/min on ${pathname}`);
    const res = new NextResponse('Too Many Requests', { status: 429 });
    res.headers.set('Retry-After', '60');
    res.headers.set('X-RateLimit-Limit', String(limit));
    res.headers.set('X-RateLimit-Remaining', '0');
    return applySecurityHeaders(res);
  }

  // 3. CORS preflight for API routes
  if (isApi && request.method === 'OPTIONS') {
    const pre = new NextResponse(null, { status: 204 });
    pre.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    pre.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    pre.headers.set('Access-Control-Max-Age', '86400');
    corsHeaders(origin, pre);
    return applySecurityHeaders(pre);
  }

  // 4. Forward /login → /admin/login (Supabase default redirect compatibility)
  if (pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') ?? '/admin';
    const target = new URL('/admin/login', request.url);
    target.searchParams.set('next', redirectTo);
    return applySecurityHeaders(NextResponse.redirect(target));
  }

  // 5. Supabase session refresh + admin auth guard
  const { supabaseResponse, user } = await updateSession(request);

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('next', pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  if (pathname === '/admin/login' && user) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
  }

  // 5. Apply security + rate-limit headers to the Supabase response
  applySecurityHeaders(supabaseResponse);
  supabaseResponse.headers.set('X-RateLimit-Limit',     String(limit));
  supabaseResponse.headers.set('X-RateLimit-Remaining', String(rl.remaining));

  if (isApi) corsHeaders(origin, supabaseResponse);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - Public assets (svg, png, jpg, ico, woff, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|mp4|pdf)).*)',
  ],
};
