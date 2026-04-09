import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTrackingId, generateBookingNumber } from '@/lib/tracking/id-generator';
import { UAE_VAT_RATE } from '@/lib/utils/constants';
import { z } from 'zod';

// ── Partial update schema ─────────────────────────────────────────────────────
const BookingUpdateSchema = z.object({
  // Meta / backdating
  booking_number:          z.string().optional(),
  tracking_id:             z.string().optional(),
  status:                  z.string().optional(),
  booking_date:            z.string().optional(), // YYYY-MM-DD — updates created_at
  regenerate_tracking_id:  z.boolean().optional(),

  // Sender
  sender_name:             z.string().min(1).optional(),
  sender_phone:            z.string().min(1).optional(),
  sender_email:            z.string().nullable().optional(),
  sender_address:          z.string().min(1).optional(),
  sender_city:             z.string().min(1).optional(),
  sender_emirate:          z.string().min(1).optional(),
  sender_country:          z.string().min(1).optional(),
  sender_postal_code:      z.string().nullable().optional(),

  // Receiver
  receiver_name:           z.string().min(1).optional(),
  receiver_phone:          z.string().min(1).optional(),
  receiver_email:          z.string().nullable().optional(),
  receiver_address:        z.string().min(1).optional(),
  receiver_city:           z.string().min(1).optional(),
  receiver_emirate:        z.string().nullable().optional(),
  receiver_country:        z.string().min(1).optional(),
  receiver_postal_code:    z.string().nullable().optional(),

  // Package
  package_type:            z.enum(['document', 'parcel', 'fragile', 'heavy', 'perishable']).optional(),
  package_description:     z.string().min(1).optional(),
  declared_value:          z.number().min(0).optional(),
  weight_kg:               z.number().min(0).optional(),
  dimensions_length_cm:    z.number().nullable().optional(),
  dimensions_width_cm:     z.number().nullable().optional(),
  dimensions_height_cm:    z.number().nullable().optional(),
  number_of_pieces:        z.number().int().min(1).optional(),
  is_fragile:              z.boolean().optional(),
  requires_signature:      z.boolean().optional(),

  // Service
  service_type:            z.enum(['standard', 'express', 'same_day', 'international', 'cargo']).optional(),
  pickup_requested:        z.boolean().optional(),
  pickup_date:             z.string().nullable().optional(),
  pickup_time_slot:        z.string().nullable().optional(),
  estimated_delivery:      z.string().nullable().optional(),
  special_instructions:    z.string().nullable().optional(),

  // Pricing (manual overrides — all in AED)
  base_price:              z.number().min(0).optional(),
  weight_surcharge:        z.number().min(0).optional(),
  fuel_surcharge:          z.number().min(0).optional(),
  insurance_fee:           z.number().min(0).optional(),
  cod_fee:                 z.number().min(0).optional(),
  remote_area_surcharge:   z.number().min(0).optional(),
  discount_amount:         z.number().min(0).optional(),
  discount_reason:         z.string().nullable().optional(),

  // Payment
  payment_method:          z.enum(['cash', 'card', 'bank_transfer', 'cod', 'online']).optional(),
  payment_status:          z.enum(['pending', 'paid', 'partial', 'refunded']).optional(),
}).strict();

// ── PATCH /api/booking/[id] ───────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = BookingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Fetch existing booking
  const { data: existing, error: fetchErr } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const {
    booking_date,
    regenerate_tracking_id,
    status: newStatus,
    ...rest
  } = parsed.data;

  // Build update payload
  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };

  // Handle booking date change (backdating)
  if (booking_date) {
    const newDate = new Date(booking_date);
    // Set created_at to midnight UTC on the chosen date
    updates.created_at = new Date(`${booking_date}T00:00:00.000Z`).toISOString();

    // Optionally regenerate tracking ID + booking number to match new date
    if (regenerate_tracking_id) {
      const [newTrackingId, newBookingNumber] = await Promise.all([
        generateTrackingId(supabase, newDate),
        generateBookingNumber(supabase, newDate),
      ]);
      updates.tracking_id    = newTrackingId;
      updates.booking_number = newBookingNumber;
    }
  }

  if (newStatus) updates.status = newStatus;

  // Re-calculate pricing if any price field was supplied
  const priceFields = ['base_price', 'weight_surcharge', 'fuel_surcharge', 'insurance_fee', 'cod_fee', 'remote_area_surcharge', 'discount_amount'] as const;
  const hasPriceChange = priceFields.some(f => f in rest);

  if (hasPriceChange) {
    const base     = (updates.base_price            as number) ?? existing.base_price;
    const wt       = (updates.weight_surcharge       as number) ?? existing.weight_surcharge;
    const fuel     = (updates.fuel_surcharge          as number) ?? existing.fuel_surcharge;
    const ins      = (updates.insurance_fee           as number) ?? existing.insurance_fee;
    const cod      = (updates.cod_fee                 as number) ?? existing.cod_fee;
    const remote   = (updates.remote_area_surcharge   as number) ?? existing.remote_area_surcharge;
    const discount = (updates.discount_amount         as number) ?? (existing.discount_amount ?? 0);

    const subtotal  = +(base + wt + fuel + ins + cod + remote - discount).toFixed(2);
    const vatAmount = +((subtotal * UAE_VAT_RATE) / 100).toFixed(2);

    updates.subtotal     = subtotal;
    updates.vat_amount   = vatAmount;
    updates.total_amount = +(subtotal + vatAmount).toFixed(2);
  }

  // Apply update
  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: updateErr?.message ?? 'Could not update booking' },
      { status: 500 },
    );
  }

  // Update tracking_events if tracking_id changed
  const newTrackingId = updates.tracking_id as string | undefined;
  if (newTrackingId && newTrackingId !== existing.tracking_id) {
    await supabase
      .from('tracking_events')
      .update({ tracking_id: newTrackingId })
      .eq('booking_id', id);
  }

  const tid = (newTrackingId ?? existing.tracking_id) as string;

  // When backdating: backdate all existing tracking event timestamps too
  // so the timeline reflects the correct booking date, not today.
  if (booking_date) {
    const backdatedTs = new Date(`${booking_date}T00:00:00.000Z`).toISOString();
    await supabase
      .from('tracking_events')
      .update({
        event_timestamp:     backdatedTs,
        is_backdated:        true,
        original_timestamp:  new Date().toISOString(),
      })
      .eq('booking_id', id)
      .eq('is_custom_event', false);  // only real events, not admin audit entries
  }

  // Determine the effective event timestamp (backdated or now)
  const effectiveTs = booking_date
    ? new Date(`${booking_date}T00:01:00.000Z`).toISOString()
    : new Date().toISOString();

  // Create status-change tracking event
  if (newStatus && newStatus !== existing.status) {
    await supabase.from('tracking_events').insert({
      booking_id:           id,
      tracking_id:          tid,
      status:               newStatus as import('@/lib/types/database').BookingStatus,
      status_detail:        null,
      location:             null,
      location_coordinates: null,
      facility_code:        null,
      updated_by:           null,
      notes:                null,
      photo_url:            null,
      signature_url:        null,
      event_timestamp:      effectiveTs,
    });
  }

  // Audit event — admin-only, never shown on public timeline
  const changedFields = Object.keys({ ...rest, ...(booking_date ? { booking_date } : {}), ...(newStatus ? { status: newStatus } : {}) });
  if (changedFields.length > 0) {
    await supabase.from('tracking_events').insert({
      booking_id:           id,
      tracking_id:          tid,
      status:               updated.status,
      status_detail:        'Booking record updated by admin',
      location:             null,
      location_coordinates: null,
      facility_code:        null,
      updated_by:           null,
      notes:                null,
      photo_url:            null,
      signature_url:        null,
      is_custom_event:      true,
      custom_event_label:   'booking_modified',
      event_timestamp:      new Date().toISOString(),
    });
  }

  return NextResponse.json({ booking: updated }, { status: 200 });
}

// ── DELETE /api/booking/[id] (soft delete) ────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'DELETE_FAILED', message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
