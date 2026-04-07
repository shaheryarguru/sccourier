'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTransition } from '@/lib/tracking/status-engine';
import type { BookingStatus, PackageType } from '@/lib/types/database';

// ── Shared result type ────────────────────────────────────────────────────────

export type ActionResult = { success: boolean; error?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function revalidateAll() {
  revalidatePath('/admin/shipments');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
}

/** Validate a custom ISO timestamp: must be parseable and not in the future. */
function validateTimestamp(ts: string): { valid: boolean; date?: Date; error?: string } {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return { valid: false, error: 'Invalid date/time format.' };
  if (date > new Date()) return { valid: false, error: 'Custom timestamp cannot be in the future.' };
  return { valid: true, date };
}

// ── 1. Update shipment status ─────────────────────────────────────────────────

export interface StatusUpdateParams {
  bookingId:      string;
  trackingId:     string;
  newStatus:      string;
  statusDetail?:  string;
  location?:      string;
  facilityCode?:  string;
  notes?:         string;
  // Backdating
  customTimestamp?:  string;   // ISO 8601 — if omitted, uses NOW()
  // Delivery proof
  deliveredTo?:   string;
  deliveryNotes?: string;
  photoUrl?:      string;
  signatureUrl?:  string;
}

export async function updateShipmentStatus(params: StatusUpdateParams): Promise<ActionResult> {
  const {
    bookingId, trackingId, newStatus,
    statusDetail, location, facilityCode, notes,
    customTimestamp, deliveredTo, deliveryNotes, photoUrl, signatureUrl,
  } = params;

  const supabase = createAdminClient();

  // Fetch current status
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) return { success: false, error: 'Booking not found.' };

  if (!isValidTransition(booking.status, newStatus)) {
    return {
      success: false,
      error: `Cannot transition from "${booking.status}" to "${newStatus}".`,
    };
  }

  // Resolve event timestamp
  let eventTimestamp = new Date().toISOString();
  let isBackdated = false;

  if (customTimestamp) {
    const { valid, date, error } = validateTimestamp(customTimestamp);
    if (!valid) return { success: false, error };
    eventTimestamp = date!.toISOString();
    isBackdated = true;
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: newStatus as BookingStatus, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (updateError) return { success: false, error: updateError.message };

  // Insert tracking event
  const { error: eventError } = await supabase.from('tracking_events').insert({
    booking_id:           bookingId,
    tracking_id:          trackingId,
    status:               newStatus as BookingStatus,
    status_detail:        statusDetail  ?? null,
    location:             location      ?? null,
    location_coordinates: null,
    facility_code:        facilityCode  ?? null,
    updated_by:           null,
    notes:                notes         ?? null,
    photo_url:            photoUrl      ?? null,
    signature_url:        signatureUrl  ?? null,
    event_timestamp:      eventTimestamp,
    is_backdated:         isBackdated,
    original_timestamp:   isBackdated ? new Date().toISOString() : null,
    delivered_to:         deliveredTo   ?? null,
    delivery_notes:       deliveryNotes ?? null,
    is_custom_event:      false,
    custom_event_label:   null,
  });

  if (eventError) {
    return { success: false, error: `Status updated but event failed: ${eventError.message}` };
  }

  revalidateAll();
  return { success: true };
}

// ── 2. Update booking details (receiver + package + pricing) ──────────────────

export interface BookingDetailsParams {
  bookingId: string;
  // Receiver
  receiverName?:    string;
  receiverPhone?:   string;
  receiverAddress?: string;
  receiverCity?:    string;
  receiverCountry?: string;
  // Package
  packageType?:        PackageType;
  weightKg?:           number;
  declaredValue?:      number;
  numberOfPieces?:     number;
  specialInstructions?: string;
  // Pricing
  basePrice?:           number;
  weightSurcharge?:     number;
  fuelSurcharge?:       number;
  insuranceFee?:        number;
  codFee?:              number;
  remoteAreaSurcharge?: number;
  discountAmount?:      number;
  discountReason?:      string;
}

export async function updateBookingDetails(params: BookingDetailsParams): Promise<ActionResult> {
  const { bookingId, ...fields } = params;
  const supabase = createAdminClient();

  // Fetch current pricing so we can recalculate totals
  const { data: current, error: fetchError } = await supabase
    .from('bookings')
    .select('base_price, weight_surcharge, fuel_surcharge, insurance_fee, cod_fee, remote_area_surcharge, discount_amount, vat_rate')
    .eq('id', bookingId)
    .single();

  if (fetchError || !current) return { success: false, error: 'Booking not found.' };

  // Build the update payload
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (fields.receiverName    !== undefined) update.receiver_name    = fields.receiverName;
  if (fields.receiverPhone   !== undefined) update.receiver_phone   = fields.receiverPhone;
  if (fields.receiverAddress !== undefined) update.receiver_address = fields.receiverAddress;
  if (fields.receiverCity    !== undefined) update.receiver_city    = fields.receiverCity;
  if (fields.receiverCountry !== undefined) update.receiver_country = fields.receiverCountry;
  if (fields.packageType     !== undefined) update.package_type     = fields.packageType;
  if (fields.weightKg        !== undefined) update.weight_kg        = fields.weightKg;
  if (fields.declaredValue   !== undefined) update.declared_value   = fields.declaredValue;
  if (fields.numberOfPieces  !== undefined) update.number_of_pieces = fields.numberOfPieces;
  if (fields.specialInstructions !== undefined) update.special_instructions = fields.specialInstructions;

  // Pricing fields — recalculate if any pricing field changes
  const pricingChanged =
    fields.basePrice           !== undefined ||
    fields.weightSurcharge     !== undefined ||
    fields.fuelSurcharge       !== undefined ||
    fields.insuranceFee        !== undefined ||
    fields.codFee              !== undefined ||
    fields.remoteAreaSurcharge !== undefined ||
    fields.discountAmount      !== undefined;

  if (pricingChanged) {
    const base    = fields.basePrice           ?? current.base_price;
    const weight  = fields.weightSurcharge     ?? current.weight_surcharge;
    const fuel    = fields.fuelSurcharge       ?? current.fuel_surcharge;
    const insure  = fields.insuranceFee        ?? current.insurance_fee;
    const cod     = fields.codFee              ?? current.cod_fee;
    const remote  = fields.remoteAreaSurcharge ?? current.remote_area_surcharge;
    const discount = fields.discountAmount     ?? current.discount_amount ?? 0;
    const vatRate  = current.vat_rate ?? 5;

    const subtotal      = +(base + weight + fuel + insure + cod + remote - discount).toFixed(2);
    const vatAmount     = +(subtotal * (vatRate / 100)).toFixed(2);
    const totalAmount   = +(subtotal + vatAmount).toFixed(2);

    update.base_price            = base;
    update.weight_surcharge      = weight;
    update.fuel_surcharge        = fuel;
    update.insurance_fee         = insure;
    update.cod_fee               = cod;
    update.remote_area_surcharge = remote;
    update.discount_amount       = discount;
    update.subtotal              = subtotal;
    update.vat_amount            = vatAmount;
    update.total_amount          = totalAmount;

    if (fields.discountReason !== undefined) update.discount_reason = fields.discountReason;
  }

  const { error } = await supabase.from('bookings').update(update).eq('id', bookingId);
  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

// ── 3. Add a custom (free-form) tracking event ────────────────────────────────

export interface CustomEventParams {
  bookingId:    string;
  trackingId:   string;
  label:        string;
  description?: string;
  location?:    string;
  customTimestamp?: string;  // ISO 8601 — if omitted uses NOW()
}

export async function addCustomEvent(params: CustomEventParams): Promise<ActionResult> {
  const { bookingId, trackingId, label, description, location, customTimestamp } = params;
  const supabase = createAdminClient();

  let eventTimestamp = new Date().toISOString();
  let isBackdated = false;

  if (customTimestamp) {
    const { valid, date, error } = validateTimestamp(customTimestamp);
    if (!valid) return { success: false, error };
    eventTimestamp = date!.toISOString();
    isBackdated = true;
  }

  // Use a sentinel status value for custom events — won't change booking status
  const { error } = await supabase.from('tracking_events').insert({
    booking_id:           bookingId,
    tracking_id:          trackingId,
    status:               'pending' as BookingStatus,  // sentinel; not used for display
    status_detail:        description ?? null,
    location:             location    ?? null,
    location_coordinates: null,
    facility_code:        null,
    updated_by:           null,
    notes:                null,
    photo_url:            null,
    signature_url:        null,
    event_timestamp:      eventTimestamp,
    is_backdated:         isBackdated,
    original_timestamp:   isBackdated ? new Date().toISOString() : null,
    is_custom_event:      true,
    custom_event_label:   label,
  });

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

// ── 4. Bulk add tracking events ───────────────────────────────────────────────

export interface BulkEventItem {
  status:       string;
  statusDetail: string;
  location?:    string;
  facilityCode?: string;
  timestamp:    string;  // ISO 8601 — required for bulk (each event needs explicit time)
}

export interface BulkEventsParams {
  bookingId:  string;
  trackingId: string;
  events:     BulkEventItem[];
}

export async function addBulkEvents(params: BulkEventsParams): Promise<ActionResult> {
  const { bookingId, trackingId, events } = params;

  if (!events.length) return { success: false, error: 'No events provided.' };

  // Validate all timestamps — must be parseable, not future, and chronological
  const serverNow = new Date();
  const parsed: Date[] = [];

  for (let i = 0; i < events.length; i++) {
    const d = new Date(events[i].timestamp);
    if (isNaN(d.getTime())) return { success: false, error: `Row ${i + 1}: invalid date/time.` };
    if (d > serverNow)      return { success: false, error: `Row ${i + 1}: timestamp cannot be in the future.` };
    if (i > 0 && d <= parsed[i - 1]) {
      return { success: false, error: `Row ${i + 1}: timestamp must be after row ${i}.` };
    }
    parsed.push(d);
  }

  const supabase = createAdminClient();

  const rows = events.map((ev, i) => ({
    booking_id:           bookingId,
    tracking_id:          trackingId,
    status:               ev.status as BookingStatus,
    status_detail:        ev.statusDetail || null,
    location:             ev.location     || null,
    location_coordinates: null,
    facility_code:        ev.facilityCode || null,
    updated_by:           null,
    notes:                null,
    photo_url:            null,
    signature_url:        null,
    event_timestamp:      parsed[i].toISOString(),
    is_backdated:         true,
    original_timestamp:   serverNow.toISOString(),
    is_custom_event:      false,
    custom_event_label:   null,
  }));

  const { error: insertError } = await supabase.from('tracking_events').insert(rows);
  if (insertError) return { success: false, error: insertError.message };

  // Update booking status to the last event's status
  const lastStatus = events[events.length - 1].status as BookingStatus;
  const { error: statusError } = await supabase
    .from('bookings')
    .update({ status: lastStatus, updated_at: serverNow.toISOString() })
    .eq('id', bookingId);

  if (statusError) {
    return { success: false, error: `Events added but status update failed: ${statusError.message}` };
  }

  revalidateAll();
  return { success: true };
}

// ── 5. Edit an existing tracking event's timestamp ────────────────────────────

export interface UpdateEventTimestampParams {
  eventId:   string;
  newTimestamp: string;  // ISO 8601
  reason?:   string;
}

export async function updateEventTimestamp(params: UpdateEventTimestampParams): Promise<ActionResult> {
  const { eventId, newTimestamp, reason } = params;

  const { valid, date, error: tsError } = validateTimestamp(newTimestamp);
  if (!valid) return { success: false, error: tsError };

  const supabase = createAdminClient();

  // Preserve original timestamp on first edit
  const { data: existing } = await supabase
    .from('tracking_events')
    .select('event_timestamp, original_timestamp, is_backdated')
    .eq('id', eventId)
    .single();

  const originalTs = existing?.original_timestamp ?? existing?.event_timestamp ?? new Date().toISOString();

  const { error } = await supabase
    .from('tracking_events')
    .update({
      event_timestamp:    date!.toISOString(),
      is_backdated:       true,
      original_timestamp: originalTs,
      modification_reason: reason ?? null,
    })
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}
