import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTrackingId, generateBookingNumber } from '@/lib/tracking/id-generator';

// ── POST /api/booking/[id]/duplicate ─────────────────────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch original booking
  const { data: original, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !original) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Generate new IDs
  const [trackingId, bookingNumber] = await Promise.all([
    generateTrackingId(supabase),
    generateBookingNumber(supabase),
  ]);

  // Clone the booking (exclude DB-managed and ID fields)
  const {
    id: _id,
    created_at: _ca,
    updated_at: _ua,
    is_deleted: _del,
    deleted_at: _dat,
    deleted_by: _dby,
    tracking_id: _tid,
    booking_number: _bn,
    ...rest
  } = original;

  const { data: newBooking, error: insertErr } = await supabase
    .from('bookings')
    .insert({
      ...rest,
      tracking_id:    trackingId,
      booking_number: bookingNumber,
      status:         'booked',
      payment_status: 'pending',
      is_deleted:     false,
      deleted_at:     null,
      deleted_by:     null,
    })
    .select('id, booking_number, tracking_id')
    .single();

  if (insertErr || !newBooking) {
    return NextResponse.json(
      { error: 'DUPLICATE_FAILED', message: insertErr?.message ?? 'Could not duplicate booking' },
      { status: 500 },
    );
  }

  // Create initial tracking event for the duplicate
  await supabase.from('tracking_events').insert({
    booking_id:           newBooking.id,
    tracking_id:          trackingId,
    status:               'booked' as const,
    status_detail:        `Shipment booked (duplicated from ${original.booking_number})`,
    location:             `${original.sender_city}, ${original.sender_emirate}`,
    location_coordinates: null,
    facility_code:        null,
    updated_by:           null,
    notes:                null,
    photo_url:            null,
    signature_url:        null,
    event_timestamp:      new Date().toISOString(),
  });

  return NextResponse.json(
    {
      bookingId:     newBooking.id,
      trackingId,
      bookingNumber,
    },
    { status: 201 },
  );
}
