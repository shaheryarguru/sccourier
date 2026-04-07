import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyQRSignature } from '@/lib/invoice/qr';
import { decodeQRPayload } from '@/lib/utils/crypto';

// ── Query schema ───────────────────────────────────────────────────────────────

const VerifySchema = z.object({
  data: z.string().min(1).max(2000),
  sig:  z.string().regex(/^[0-9a-f]{64}$/, 'Signature must be a 64-character hex string'),
});

// ── GET /api/invoice/verify?data=...&sig=... ───────────────────────────────────

export async function GET(request: NextRequest) {
  const raw    = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = VerifySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        valid:   false,
        error:   'INVALID_PARAMS',
        message: 'Missing or malformed data/sig parameters',
      },
      { status: 400 },
    );
  }

  const { data, sig } = parsed.data;

  // Decode payload
  const payload = decodeQRPayload(data);
  if (!payload) {
    return NextResponse.json(
      {
        valid:   false,
        error:   'DECODE_ERROR',
        message: 'Unable to decode QR payload',
      },
      { status: 400 },
    );
  }

  // Verify HMAC
  const isValid = await verifyQRSignature(data, sig);

  if (!isValid) {
    return NextResponse.json(
      {
        valid:   false,
        error:   'SIGNATURE_INVALID',
        message: 'Invoice signature is invalid. This document may have been tampered with.',
        invoiceNumber: payload.invoiceNumber,
      },
      { status: 200 }, // 200 so the client can read the body regardless
    );
  }

  return NextResponse.json(
    {
      valid:         true,
      invoiceId:     payload.invoiceId,
      invoiceNumber: payload.invoiceNumber,
      companyTRN:    payload.companyTRN,
      totalAmount:   payload.totalAmount,
      vatAmount:     payload.vatAmount,
      issueDate:     payload.issueDate,
      trackingId:    payload.trackingId,
      verifiedAt:    new Date().toISOString(),
    },
    { status: 200 },
  );
}
