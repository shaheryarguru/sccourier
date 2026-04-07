import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ── GET /api/invoice/[id] ──────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invoice ID is required' },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Try by UUID first, then by invoice_number
  const isUUID = /^[0-9a-f-]{36}$/i.test(id);

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
      {
        error:   'CANCELLED',
        message: 'This invoice has been cancelled',
        reason:  invoice.cancelled_reason,
      },
      { status: 410 },
    );
  }

  return NextResponse.json(invoice, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
