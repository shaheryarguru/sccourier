/**
 * QR code generation and verification for UAE-compliant tax invoices.
 *
 * Flow:
 *  1. generateQRPayload(invoice)   → QRPayload object
 *  2. generateQRUrl(invoice)       → { url, data, sig }  (async — signs HMAC)
 *  3. generateQRImage(url)         → data:image/png;base64,...  (async)
 *  4. verifyQRSignature(data, sig) → boolean  (async — validates HMAC)
 */

import QRCode from 'qrcode';
import {
  encodeQRPayload,
  generateHMAC,
  verifyHMAC,
  type QRPayload,
} from '@/lib/utils/crypto';
import type { InvoiceRow } from '@/lib/types/database';

// ── Secret key ────────────────────────────────────────────────────────────────

function getSecret(): string {
  const key = process.env.INVOICE_SECRET_KEY;
  if (!key) throw new Error('INVOICE_SECRET_KEY environment variable is not set');
  return key;
}

// ── Payload ───────────────────────────────────────────────────────────────────

export function generateQRPayload(invoice: InvoiceRow): QRPayload {
  return {
    invoiceId:     invoice.id,
    invoiceNumber: invoice.invoice_number,
    companyTRN:    invoice.company_trn,
    totalAmount:   invoice.total_amount,
    vatAmount:     invoice.vat_amount,
    issueDate:     invoice.issue_date,
    trackingId:    invoice.tracking_id,
    timestamp:     Date.now(),
  };
}

// ── Signature ─────────────────────────────────────────────────────────────────

export async function generateQRSignature(encodedPayload: string): Promise<string> {
  return generateHMAC(encodedPayload, getSecret());
}

// ── Full QR URL ───────────────────────────────────────────────────────────────

export async function generateQRUrl(
  invoice: InvoiceRow,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com',
): Promise<{ url: string; data: string; sig: string }> {
  const payload = generateQRPayload(invoice);
  const data    = encodeQRPayload(payload);
  const sig     = await generateQRSignature(data);
  return {
    url:  `${baseUrl}/invoice/verify?data=${data}&sig=${sig}`,
    data,
    sig,
  };
}

// ── Signature verification ────────────────────────────────────────────────────

export async function verifyQRSignature(data: string, sig: string): Promise<boolean> {
  try {
    return await verifyHMAC(data, sig, getSecret());
  } catch {
    return false;
  }
}

// ── QR image (data URL) ───────────────────────────────────────────────────────

export async function generateQRImage(
  url: string,
  options?: {
    size?:   number;   // px, default 512
    margin?: number;   // quiet zone cells, default 1
  },
): Promise<string> {
  const size   = options?.size   ?? 512;
  const margin = options?.margin ?? 1;

  // errorCorrectionLevel 'H' = 30% damage recovery — required for centre logo overlay
  return QRCode.toDataURL(url, {
    width:                size,
    margin,
    color: {
      dark:  '#0F2B46',   // SCC navy — high contrast for reliable scanning
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}
