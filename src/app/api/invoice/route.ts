import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateInvoice } from '@/lib/invoice/generator';

// ── Request schema ─────────────────────────────────────────────────────────────

const CreateInvoiceSchema = z.object({
  bookingId:       z.string().uuid('bookingId must be a valid UUID'),
  notes:           z.string().max(500).optional(),
  dueDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  discountAmount:  z.number().min(0).optional(),
  discountReason:  z.string().max(200).optional(),
  customerTRN:     z.string().regex(/^\d{15}$/).optional(),
  isDraft:         z.boolean().optional(),
});

// ── POST /api/invoice ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:   'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { bookingId, ...options } = parsed.data;
    const invoice = await generateInvoice(bookingId, options);

    return NextResponse.json(
      {
        invoiceId:     invoice.id,
        invoiceNumber: invoice.invoice_number,
        totalAmount:   invoice.total_amount,
        vatAmount:     invoice.vat_amount,
        qrUrl:         invoice.qr_code_data,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate invoice';

    // Known business rule errors → 409 Conflict
    if (message.includes('already exists')) {
      const existingId = (err as Error & { existingInvoiceId?: string }).existingInvoiceId ?? null;
      return NextResponse.json(
        { error: 'DUPLICATE', message, existingInvoiceId: existingId },
        { status: 409 },
      );
    }
    if (message.includes('not found') || message.includes('Not found')) {
      return NextResponse.json({ error: 'NOT_FOUND', message }, { status: 404 });
    }

    console.error('Invoice generation error:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
