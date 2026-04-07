/**
 * Invoice generation — fetches a booking from Supabase and creates a
 * UAE FTA-compliant tax invoice with QR verification.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoiceNumber, getCompanyInvoiceInfoFromDB, getTermsFromDB, calculateVAT } from './uae-compliance';
import { generateQRUrl } from './qr';
import { UAE_VAT_RATE } from '@/lib/utils/constants';
import { amountToWords } from '@/lib/utils/amount-to-words';
import { capitalizeProper, buildAddress } from '@/lib/utils/format';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';

// ── Line item type ─────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  item_name:    string;
  description:  string;
  hsn_code:     string;  // Harmonised System code for courier services
  quantity:     number;
  unit_price:   number;  // AED before VAT
  vat_rate:     number;  // %
  total:        number;  // unit_price × quantity (before VAT)
}

// ── Build line items from a booking ───────────────────────────────────────────

export function buildLineItems(booking: BookingRow): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  const route = `${capitalizeProper(booking.sender_city)} to ${capitalizeProper(booking.receiver_city)}, ${booking.receiver_country}`;
  const serviceLabel = booking.service_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // 1. Base courier service
  items.push({
    item_name:   `${serviceLabel} Courier Service`,
    description: `${serviceLabel} courier service — ${route}`,
    hsn_code:    '9961',
    quantity:    1,
    unit_price:  booking.base_price,
    vat_rate:    UAE_VAT_RATE,
    total:       booking.base_price,
  });

  // 2. Weight surcharge
  if (booking.weight_surcharge > 0) {
    items.push({
      item_name:   'Weight Surcharge',
      description: `Weight surcharge for ${booking.weight_kg} kg (over free 1 kg allowance)`,
      hsn_code:    '9961',
      quantity:    1,
      unit_price:  booking.weight_surcharge,
      vat_rate:    UAE_VAT_RATE,
      total:       booking.weight_surcharge,
    });
  }

  // 3. Fuel surcharge
  if (booking.fuel_surcharge > 0) {
    items.push({
      item_name:   'Fuel Surcharge',
      description: 'Fuel surcharge — applied to all shipments',
      hsn_code:    '9961',
      quantity:    1,
      unit_price:  booking.fuel_surcharge,
      vat_rate:    UAE_VAT_RATE,
      total:       booking.fuel_surcharge,
    });
  }

  // 4. Insurance
  if (booking.insurance_fee > 0) {
    items.push({
      item_name:   'Package Insurance',
      description: `Shipment insurance — declared value AED ${booking.declared_value.toFixed(2)}`,
      hsn_code:    '9961',
      quantity:    1,
      unit_price:  booking.insurance_fee,
      vat_rate:    UAE_VAT_RATE,
      total:       booking.insurance_fee,
    });
  }

  // 5. COD fee
  if (booking.cod_fee > 0) {
    items.push({
      item_name:   'Cash on Delivery Fee',
      description: 'COD collection fee',
      hsn_code:    '9961',
      quantity:    1,
      unit_price:  booking.cod_fee,
      vat_rate:    UAE_VAT_RATE,
      total:       booking.cod_fee,
    });
  }

  // 6. Remote area surcharge
  if (booking.remote_area_surcharge > 0) {
    items.push({
      item_name:   'Remote Area Surcharge',
      description: 'Surcharge for delivery to a remote or restricted area',
      hsn_code:    '9961',
      quantity:    1,
      unit_price:  booking.remote_area_surcharge,
      vat_rate:    UAE_VAT_RATE,
      total:       booking.remote_area_surcharge,
    });
  }

  return items;
}

// ── Sequential invoice number ─────────────────────────────────────────────────

async function getNextInvoiceSequence(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${yyyy}${mm}-`;

  // Count existing invoices this month to derive next sequence
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`);

  return (count ?? 0) + 1;
}

// ── Payment helpers ────────────────────────────────────────────────────────────

/** Auto-generates a unique transaction reference: TXN-YYYYMMDD-XXXXXXXX */
function generateTransactionId(): string {
  const d     = new Date();
  const date  = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `TXN-${date}-${rand}`;
}

/** Generates a plausible random card last-4 (display only — no real card data) */
function generateCardLastFour(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── generateInvoice ────────────────────────────────────────────────────────────

export interface GenerateInvoiceOptions {
  notes?:           string;
  dueDate?:         string;       // YYYY-MM-DD
  discountAmount?:  number;       // AED
  discountReason?:  string;
  customerTRN?:     string;       // B2B customer TRN
  isDraft?:         boolean;
  paymentReference?: string;      // override auto-generated TXN (optional)
  cardLastFour?:     string;      // override auto-generated card digits (optional)
}

export async function generateInvoice(
  bookingId: string,
  options: GenerateInvoiceOptions = {},
): Promise<InvoiceRow> {
  const supabase = createAdminClient();

  // ── Fetch booking ────────────────────────────────────────────────────────────
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  // ── Check for existing invoice for this booking ──────────────────────────────
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('is_cancelled', false)
    .maybeSingle();

  if (existing) {
    const err = new Error('An invoice already exists for this booking') as Error & { existingInvoiceId: string };
    err.existingInvoiceId = existing.id;
    throw err;
  }

  // ── Build line items ─────────────────────────────────────────────────────────
  const lineItems = buildLineItems(booking);

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const subtotal  = +lineItems.reduce((s, li) => s + li.total, 0).toFixed(2);
  const discount  = options.discountAmount ?? 0;
  const vat       = calculateVAT(subtotal, discount, UAE_VAT_RATE);

  // ── Company + customer info (read live from DB with env fallbacks) ──────────
  const [company, termsText] = await Promise.all([
    getCompanyInvoiceInfoFromDB(),
    getTermsFromDB(),
  ]);

  const customerAddress = buildAddress([
    booking.sender_address,
    capitalizeProper(booking.sender_city),
    capitalizeProper(booking.sender_emirate ?? ''),
    booking.sender_country,
  ]);

  // ── Invoice number ───────────────────────────────────────────────────────────
  const seq           = await getNextInvoiceSequence(supabase);
  const invoiceNumber = generateInvoiceNumber(seq, new Date());
  const issueDate     = new Date().toISOString().split('T')[0];

  // ── Temporary stub insert (without QR — QR needs invoice.id) ────────────────
  const { data: inserted, error: insertError } = await supabase
    .from('invoices')
    .insert({
      invoice_number:       invoiceNumber,
      booking_id:           bookingId,
      tracking_id:          booking.tracking_id,

      company_name:         company.company_name,
      company_trn:          company.company_trn,
      company_address:      company.company_address,
      company_phone:        company.company_phone,
      company_email:        company.company_email,
      company_logo_url:     company.company_logo_url ?? null,

      customer_id:          booking.sender_id ?? null,
      customer_name:        booking.sender_name,
      customer_trn:         options.customerTRN ?? null,
      customer_address:     customerAddress,
      customer_phone:       booking.sender_phone,
      customer_email:       booking.sender_email ?? null,

      // Receiver info (denormalised from booking for immutable invoice record)
      receiver_name:        booking.receiver_name,
      receiver_phone:       booking.receiver_phone,
      receiver_email:       booking.receiver_email ?? null,
      receiver_address:     booking.receiver_address,
      receiver_city:        booking.receiver_city,
      receiver_emirate:     booking.receiver_emirate ?? null,
      receiver_country:     booking.receiver_country,

      // Supply date: pickup date if available, else booking creation date
      supply_date:          booking.pickup_date ?? issueDate,

      line_items:           lineItems as unknown as import('@/lib/types/database').Json,
      subtotal:             subtotal,
      discount_amount:      discount,
      discount_reason:      options.discountReason ?? null,
      taxable_amount:       vat.taxableAmount,
      vat_rate:             UAE_VAT_RATE,
      vat_amount:           vat.vatAmount,
      total_amount:         vat.totalAmount,
      currency:             'AED',

      payment_method:       booking.payment_method,
      payment_status:       'paid',             // invoices are always paid on generation
      payment_date:         issueDate,
      // For card/online: encode last-4 into reference as "TXN-…::XXXX"
      // PDF splits on "::" to display both transaction ID and masked card number.
      payment_reference:    (() => {
        const txn  = options.paymentReference ?? generateTransactionId();
        const isCard = ['card','online'].includes(booking.payment_method);
        if (!isCard) return txn;
        const last4 = options.cardLastFour ?? generateCardLastFour();
        return `${txn}::${last4}`;
      })(),

      terms_and_conditions: termsText,

      // QR fields populated in the update step below (we need invoice.id first).
      // Insert as is_draft=true so the immutability trigger allows the QR update.
      qr_code_data:         '',
      qr_verification_hash: '',
      digital_signature:    null,

      issue_date:           issueDate,
      due_date:             options.dueDate ?? null,
      notes:                options.notes ?? null,
      is_draft:             true,               // must be true — trigger blocks QR update on issued invoices
      is_cancelled:         false,
      cancelled_reason:     null,
      pdf_url:              null,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    throw new Error(`Failed to create invoice: ${insertError?.message ?? 'unknown error'}`);
  }

  // ── Generate QR with real invoice.id ────────────────────────────────────────
  const qr = await generateQRUrl(inserted as InvoiceRow);

  // Amount in words for the total (computed once)
  const wordsStr = amountToWords(vat.totalAmount);

  // The immutability trigger allows all field changes while is_draft=true,
  // so we finalize is_draft here alongside the QR fields.
  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update({
      qr_code_data:         qr.url,
      qr_verification_hash: qr.sig,
      amount_in_words:      wordsStr,
      is_draft:             options.isDraft ?? false,   // finalise draft status
    })
    .eq('id', inserted.id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to update QR data: ${updateError?.message ?? 'unknown error'}`);
  }

  return updated as InvoiceRow;
}
