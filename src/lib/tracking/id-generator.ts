import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generates a tracking ID in the format SCDDMM####
 * SC = prefix, DD = day, MM = month, #### = 4-digit daily sequence
 * Example: SC29030001 → March 29, first shipment
 * @param supabase Supabase client
 * @param forDate  Optional date to generate ID for (defaults to today)
 */
export async function generateTrackingId(supabase: SupabaseClient, forDate?: Date): Promise<string> {
  const now = forDate ?? new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `SC${dd}${mm}`;

  const { data, error } = await supabase.rpc('get_next_tracking_sequence', {
    date_prefix: prefix,
  });

  if (error) throw new Error(`Failed to generate tracking ID: ${error.message}`);

  const seq = String(data as number).padStart(4, '0');
  return `${prefix}${seq}`;
}

/**
 * Generates a booking number in the format SC-MMDD-4RAND
 * Example: SC-0722-7482 (for July 22)
 * @param supabase Supabase client
 * @param forDate  Optional date to generate number for (defaults to today)
 */
export async function generateBookingNumber(supabase: SupabaseClient, forDate?: Date): Promise<string> {
  const now  = forDate ?? new Date();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const dateStr = `${mm}${dd}`;
  const prefix = `SC-${dateStr}`;

  let bookingNumber = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    const rand = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    bookingNumber = `${prefix}-${rand}`;

    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_number', bookingNumber)
      .maybeSingle();

    if (!error && !data) {
      exists = false;
    }
  }

  // Fallback to sequence if random generation fails multiple times
  if (exists) {
    const { data: seqData, error: seqError } = await supabase.rpc('get_next_tracking_sequence', {
      date_prefix: prefix,
    });
    if (seqError) throw new Error(`Failed to generate booking number: ${seqError.message}`);
    const seq = String(seqData as number).padStart(4, '0');
    bookingNumber = `${prefix}-${seq}`;
  }

  return bookingNumber;
}

/**
 * Generates an invoice number in the format INV-YYYYMM-XXXX
 * Example: INV-202603-0001
 */
export async function generateInvoiceNumber(supabase: SupabaseClient): Promise<string> {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${yyyy}${mm}`;

  const { data, error } = await supabase.rpc('get_next_tracking_sequence', {
    date_prefix: prefix,
  });

  if (error) throw new Error(`Failed to generate invoice number: ${error.message}`);

  const seq = String(data as number).padStart(4, '0');
  return `${prefix}-${seq}`;
}
