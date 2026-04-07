import type { Metadata } from 'next';
import { notFound }       from 'next/navigation';
import { InvoiceDocument } from '@/components/invoice';
import { InvoiceActions }  from './_components/InvoiceActions';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';

interface Props {
  params: Promise<{ invoiceId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invoiceId } = await params;
  return {
    title:       `Invoice ${invoiceId.toUpperCase()} — SC Courier`,
    description: 'View and download your UAE FTA-compliant tax invoice from SC Courier.',
  };
}

export default async function InvoicePage({ params }: Props) {
  const { invoiceId } = await params;
  const supabase      = createAdminClient();

  // Accept UUID or invoice number (e.g. INV-202403-0001)
  const isUUID = /^[0-9a-f-]{36}$/i.test(invoiceId);
  const query  = supabase.from('invoices').select('*');
  const { data: invoice } = isUUID
    ? await query.eq('id', invoiceId).single()
    : await query.eq('invoice_number', invoiceId.toUpperCase()).single();

  if (!invoice) notFound();

  const inv = invoice as InvoiceRow;

  if (inv.is_cancelled) {
    return (
      <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
          <p className="font-heading font-bold text-2xl text-danger">Invoice Cancelled</p>
          <p className="text-text-secondary font-body text-sm">
            {inv.cancelled_reason ?? 'This invoice has been cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  // Fetch booking to get receiver info + service details (used as fallback if
  // receiver columns from migration 011 are not yet applied).
  let booking: BookingRow | null = null;
  if (inv.booking_id) {
    const { data: b } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', inv.booking_id)
      .single();
    booking = b as BookingRow | null;
  }

  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10 print:bg-white print:pt-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:px-0 print:py-0">
        <InvoiceDocument
          invoice={inv}
          booking={booking}
          actions={
            <InvoiceActions
              invoiceId={inv.id}
              invoiceNumber={inv.invoice_number}
            />
          }
        />
      </div>
    </div>
  );
}
