import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTrackingId, generateBookingNumber } from '@/lib/tracking/id-generator';
import {
  SenderSchema,
  ReceiverSchema,
  PackageSchema,
  ServiceSchema,
  PaymentSchema,
  type SenderFormData,
  type PackageFormData,
  type ServiceFormData,
} from '@/lib/validators/booking';
import { z } from 'zod';
import { PRICING, UAE_VAT_RATE } from '@/lib/utils/constants';
import { estimateDeliveryDate } from '@/lib/invoice/uae-compliance';

// ── Request schema ────────────────────────────────────────────────────────────
// We accept client-provided pricing preview in the body but IGNORE it.
// All financial values are recalculated server-side.
const BookingRequestSchema = z.object({
  sender:   SenderSchema,
  receiver: ReceiverSchema,
  package:  PackageSchema,
  service:  ServiceSchema,
  payment:  PaymentSchema,
  // pricing field is accepted but discarded (untrusted client value)
  pricing:  z.record(z.string(), z.unknown()).optional(),
});

// ── Server-side pricing calculator ────────────────────────────────────────────
function serverCalcPrice(pkg: PackageFormData, svc: ServiceFormData) {
  const serviceType     = svc.service_type;
  const base            = PRICING.BASE[serviceType as keyof typeof PRICING.BASE] ?? PRICING.BASE.standard;
  const weightKg        = pkg.weight_kg;
  const weightSurcharge = weightKg > PRICING.WEIGHT.FREE_KG
    ? +((weightKg - PRICING.WEIGHT.FREE_KG) * PRICING.WEIGHT.RATE_PER_KG).toFixed(2)
    : 0;
  const fuelSurcharge  = PRICING.FUEL_SURCHARGE;
  const insuranceFee   = svc.insurance ? +(pkg.declared_value * PRICING.INSURANCE_RATE).toFixed(2) : 0;
  const codFee         = svc.cod ? PRICING.COD_FEE : 0;
  const remoteArea     = 0; // future: check emirate against remote-area list

  const subtotal  = +(base + weightSurcharge + fuelSurcharge + insuranceFee + codFee + remoteArea).toFixed(2);
  const vatAmount = +((subtotal * UAE_VAT_RATE) / 100).toFixed(2);
  const total     = +(subtotal + vatAmount).toFixed(2);

  return {
    base_price:            +base.toFixed(2),
    weight_surcharge:      weightSurcharge,
    fuel_surcharge:        fuelSurcharge,
    insurance_fee:         insuranceFee,
    cod_fee:               codFee,
    remote_area_surcharge: remoteArea,
    subtotal,
    vat_amount:            vatAmount,
    total_amount:          total,
  };
}

// ── Upsert customer by phone ───────────────────────────────────────────────────
async function upsertCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  sender: SenderFormData,
): Promise<string | null> {
  try {
    // Check if customer exists by phone
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', sender.phone)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // Create new customer
    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        full_name:            sender.full_name,
        email:                sender.email         || null,
        phone:                sender.phone,
        phone_country_code:   '+971',
        company_name:         sender.company_name  || null,
        emirates_id:          sender.emirates_id   || null,
        trade_license_number: null,
        address_line_1:       sender.address_line_1,
        address_line_2:       sender.address_line_2 || null,
        city:                 sender.city,
        emirate:              sender.emirate,
        country:              sender.country ?? 'UAE',
        postal_code:    sender.postal_code || null,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Customer insert warning:', error.message);
      return null;
    }
    return created.id;
  } catch {
    return null;
  }
}

// ── POST /api/booking ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse & validate
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    const parsed = BookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Invalid booking data',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { sender, receiver, package: pkg, service, payment } = parsed.data;

    // Server-side pricing (never trust client)
    const pricing = serverCalcPrice(pkg, service);

    const supabase = createAdminClient();

    // Generate IDs concurrently
    const [trackingId, bookingNumber] = await Promise.all([
      generateTrackingId(supabase),
      generateBookingNumber(supabase),
    ]);

    // Upsert customer
    const customerId = await upsertCustomer(supabase, sender);

    // Estimate delivery date
    const { earliest } = estimateDeliveryDate(service.service_type);
    const estimatedDelivery = earliest.toISOString().split('T')[0];

    // Build full sender address
    const senderAddress = [sender.address_line_1, sender.address_line_2]
      .filter(Boolean).join(', ');
    const receiverAddress = [receiver.address_line_1, receiver.address_line_2]
      .filter(Boolean).join(', ');

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number:        bookingNumber,
        tracking_id:           trackingId,
        status:                'booked',
        sender_id:             customerId,
        created_by:            null,

        sender_name:           sender.full_name,
        sender_phone:          sender.phone,
        sender_email:          sender.email          || null,
        sender_address:        senderAddress,
        sender_city:           sender.city,
        sender_emirate:        sender.emirate,
        sender_country:        sender.country        ?? 'UAE',
        sender_postal_code:    sender.postal_code    || null,

        receiver_name:         receiver.full_name,
        receiver_phone:        `${receiver.phone_country_code} ${receiver.phone}`,
        receiver_email:        receiver.email         || null,
        receiver_address:      receiverAddress,
        receiver_city:         receiver.city,
        receiver_emirate:      receiver.emirate       || null,
        receiver_country:      receiver.country,
        receiver_postal_code:  receiver.postal_code   || null,

        package_type:          pkg.package_type,
        package_description:   pkg.description,
        declared_value:        pkg.declared_value,
        weight_kg:             pkg.weight_kg,
        dimensions_length_cm:  pkg.length_cm          || null,
        dimensions_width_cm:   pkg.width_cm           || null,
        dimensions_height_cm:  pkg.height_cm          || null,
        number_of_pieces:      pkg.number_of_pieces,
        is_fragile:            pkg.is_fragile,
        requires_signature:    pkg.requires_signature,

        service_type:          service.service_type,
        pickup_requested:      service.pickup_requested,
        pickup_date:           service.pickup_date        || null,
        pickup_time_slot:      service.pickup_time_slot   || null,
        estimated_delivery:    estimatedDelivery,
        special_instructions:  service.special_instructions || null,

        base_price:            pricing.base_price,
        weight_surcharge:      pricing.weight_surcharge,
        fuel_surcharge:        pricing.fuel_surcharge,
        insurance_fee:         pricing.insurance_fee,
        cod_fee:               pricing.cod_fee,
        remote_area_surcharge: pricing.remote_area_surcharge,
        subtotal:              pricing.subtotal,
        vat_rate:              UAE_VAT_RATE,
        vat_amount:            pricing.vat_amount,
        total_amount:          pricing.total_amount,

        payment_method:        payment.payment_method,
        payment_status:        'pending',
      })
      .select('id, booking_number, tracking_id')
      .single();

    if (bookingError || !booking) {
      console.error('Booking insert error:', bookingError);
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to create booking. Please try again.' },
        { status: 500 },
      );
    }

    // Insert initial tracking event
    const { error: eventError } = await supabase.from('tracking_events').insert({
      booking_id:            booking.id,
      tracking_id:           trackingId,
      status:                'booked',
      status_detail:         'Shipment booked successfully',
      location:              `${sender.city}, ${sender.emirate?.replace(/_/g, ' ')}`,
      location_coordinates:  null,
      facility_code:         null,
      updated_by:            null,
      notes:                 null,
      photo_url:             null,
      signature_url:         null,
      event_timestamp:       new Date().toISOString(),
    });

    if (eventError) {
      // Non-fatal: booking is created, just log the event issue
      console.warn('Tracking event insert warning:', eventError.message);
    }

    return NextResponse.json(
      {
        trackingId,
        bookingNumber,
        bookingId:         booking.id,
        estimatedDelivery,
        totalAmount:       pricing.total_amount,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('Booking route error:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
