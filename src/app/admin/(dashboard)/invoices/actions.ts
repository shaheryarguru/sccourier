'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

export type ActionResult = { success: boolean; error?: string };

export async function markInvoicePaid(
  invoiceId: string,
  paymentReference?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      payment_status:    'paid',
      payment_date:      new Date().toISOString(),
      payment_reference: paymentReference ?? null,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('is_cancelled', false);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  return { success: true };
}

export async function cancelInvoice(
  invoiceId: string,
  reason: string,
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('invoices')
    .update({
      is_cancelled:     true,
      cancelled_reason: reason,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  return { success: true };
}

export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: 'paid' | 'partial' | 'refunded',
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: paymentStatus,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/invoices');
  revalidatePath('/admin/bookings');
  return { success: true };
}
