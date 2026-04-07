import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ── Validation ─────────────────────────────────────────────────────────────────

const QuerySchema = z.object({
  id: z.string()
    .min(1, 'Tracking ID is required')
    .max(20)
    .regex(/^[A-Za-z0-9]+$/, 'Invalid tracking ID format'),
});

// ── Simple in-memory rate limiting (per IP, 30 req/min) ───────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 30;

const ipCounters = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now  = Date.now();
  const slot = ipCounters.get(ip);

  if (!slot || now > slot.reset) {
    ipCounters.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (slot.count >= RATE_LIMIT) return false;
  slot.count++;
  return true;
}

// Periodically clean up old entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, slot] of ipCounters) {
    if (now > slot.reset) ipCounters.delete(ip);
  }
}, 5 * 60_000);

// ── GET /api/tracking?id=SC29030001 ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? request.headers.get('x-real-ip')
          ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      },
    );
  }

  // Validate query param
  const rawId  = request.nextUrl.searchParams.get('id')?.trim().toUpperCase() ?? '';
  const parsed = QuerySchema.safeParse({ id: rawId });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:   'VALIDATION_ERROR',
        message: parsed.error.issues?.[0]?.message ?? parsed.error.message ?? 'Invalid tracking ID',
      },
      { status: 400 },
    );
  }

  const trackingId = parsed.data.id.toUpperCase();
  const supabase   = await createClient();

  // Fetch booking (use anon key — RLS must allow public reads on tracking_events)
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, tracking_id, booking_number, status,
      sender_name, sender_city, sender_emirate,
      receiver_name, receiver_city, receiver_country,
      service_type, estimated_delivery,
      total_amount, weight_kg, package_type,
      is_fragile, requires_signature, payment_method,
      created_at
    `)
    .eq('tracking_id', trackingId)
    .single();

  if (error || !booking) {
    return NextResponse.json(
      {
        error:   'NOT_FOUND',
        message: `No shipment found for tracking ID: ${trackingId}`,
      },
      { status: 404 },
    );
  }

  const { data: events } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('tracking_id', trackingId)
    .order('event_timestamp', { ascending: false });

  return NextResponse.json(
    { booking, events: events ?? [] },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Tracking-ID': trackingId,
      },
    },
  );
}
