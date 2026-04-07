/**
 * HMAC-SHA256 signing for invoice QR verification.
 * Uses the Web Crypto API (available in Node 18+ / Edge runtime).
 */

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Sign a payload string; returns hex-encoded HMAC-SHA256 */
export async function signHMAC(payload: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Buffer.from(sig).toString('hex');
}

/** Alias for signHMAC — preferred name for new code */
export const generateHMAC = signHMAC;

/** Constant-time HMAC verification */
export async function verifyHMAC(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await signHMAC(payload, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// ── Base64url helpers ─────────────────────────────────────────────────────────
export function toBase64Url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

export function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

// ── QR payload helpers ────────────────────────────────────────────────────────
export interface QRPayload {
  invoiceId:     string;
  invoiceNumber: string;
  companyTRN:    string;
  totalAmount:   number;
  vatAmount:     number;
  issueDate:     string;
  trackingId:    string;
  timestamp:     number;
}

export function encodeQRPayload(payload: QRPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeQRPayload(encoded: string): QRPayload | null {
  try {
    return JSON.parse(fromBase64Url(encoded)) as QRPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a signed QR verification URL.
 * Returns: https://sccourier.com/invoice/verify?data=<b64>&sig=<hmac>
 */
export async function generateQRVerifyUrl(
  payload: QRPayload,
  secret: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com',
): Promise<{ url: string; data: string; sig: string }> {
  const data = encodeQRPayload(payload);
  const sig  = await generateHMAC(data, secret);
  return { url: `${baseUrl}/invoice/verify?data=${data}&sig=${sig}`, data, sig };
}
