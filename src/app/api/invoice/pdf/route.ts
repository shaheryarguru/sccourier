import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePDF } from '@/lib/invoice/pdf';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';

// ── GET /api/invoice/pdf?id=<invoiceId|invoiceNumber> ─────────────────────────

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'id query parameter is required' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const isUUID   = /^[0-9a-f-]{36}$/i.test(id);

  const query = supabase.from('invoices').select('*');
  const { data: invoice, error } = isUUID
    ? await query.eq('id', id).single()
    : await query.eq('invoice_number', id.toUpperCase()).single();

  if (error || !invoice) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: `Invoice not found: ${id}` },
      { status: 404 },
    );
  }

  if (invoice.is_cancelled) {
    return NextResponse.json(
      { error: 'CANCELLED', message: 'This invoice has been cancelled' },
      { status: 410 },
    );
  }

  // Fetch booking for receiver details and service info (fallback for legacy invoices
  // without migration 011 receiver columns)
  let booking: BookingRow | null = null;
  if (invoice.booking_id) {
    const { data: b } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', invoice.booking_id)
      .single();
    booking = b as BookingRow | null;
  }

  try {
    const pdfBuffer  = await generateInvoicePDF(invoice as InvoiceRow, booking);
    const filename   = `${invoice.invoice_number}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status:  200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'private, no-store',
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'PDF_ERROR', message: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
