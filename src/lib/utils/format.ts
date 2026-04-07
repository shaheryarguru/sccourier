import { DEFAULT_CURRENCY } from './constants';

// ── Currency ──────────────────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string   = 'en-AE',
): string {
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Returns "AED 45.00" — no locale-formatted symbol, just AED prefix */
export function formatAED(amount: number): string {
  return `AED ${amount.toFixed(2)}`;
}

// ── Date / Time ───────────────────────────────────────────────────────────────
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
  locale: string = 'en-AE',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatDateTime(date: string | Date, locale: string = 'en-AE'): string {
  return formatDate(date, {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  }, locale);
}

export function formatRelativeTime(date: string | Date): string {
  const d    = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDate(d);
}

// ── Weight / Dimensions ───────────────────────────────────────────────────────
export function formatWeight(kg: number): string {
  if (kg < 1) return `${(kg * 1000).toFixed(0)} g`;
  return `${kg.toFixed(2)} kg`;
}

export function formatDimensions(l?: number | null, w?: number | null, h?: number | null): string {
  if (!l || !w || !h) return '—';
  return `${l} × ${w} × ${h} cm`;
}

// ── Phone ─────────────────────────────────────────────────────────────────────
export function formatPhone(phone: string, countryCode: string = '+971'): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  return `${countryCode} ${digits}`;
}

/**
 * Formats a UAE phone number for display.
 * 0501234567 → +971 50 123 4567
 * +971501234567 → +971 50 123 4567
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Strip leading country code
  const local = digits.startsWith('971') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (local.length === 9) {
    // Mobile: 05X XXX XXXX
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  if (local.length === 8) {
    // Landline: 0X XXXX XXXX
    return `+971 ${local.slice(0, 1)} ${local.slice(1, 5)} ${local.slice(5)}`;
  }
  return `+971 ${local}`;
}

// ── Tracking ID ───────────────────────────────────────────────────────────────
export function parseTrackingId(id: string): { prefix: string; day: string; month: string; seq: string } | null {
  const match = id.match(/^SC(\d{2})(\d{2})(\d{4})$/);
  if (!match) return null;
  return { prefix: 'SC', day: match[1], month: match[2], seq: match[3] };
}

/**
 * Formats a tracking ID for display with visual separators.
 * SC29030001 → SC-29/03-0001
 */
export function formatTrackingId(id: string): string {
  const parsed = parseTrackingId(id.toUpperCase());
  if (!parsed) return id.toUpperCase();
  return `SC-${parsed.day}/${parsed.month}-${parsed.seq}`;
}

// ── Invoice / Booking numbers ─────────────────────────────────────────────────
/** INV-202603-0001 → already readable; just ensure uppercase */
export function formatInvoiceNumber(num: string): string {
  return num.toUpperCase();
}

/** SC-20260329-0001 → SC-20260329-0001 (already formatted) */
export function formatBookingNumber(num: string): string {
  return num.toUpperCase();
}

// ── Text ──────────────────────────────────────────────────────────────────────
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugToLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Normalise city/emirate/country names to Title Case regardless of how they
 * were entered ("LAHORE", "dubai", "abu_dhabi" → "Lahore", "Dubai", "Abu Dhabi").
 */
export function capitalizeProper(str: string): string {
  if (!str) return str;
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Build a clean, deduplicated address string from its parts.
 * Removes parts that are an exact (case-insensitive) substring of another
 * part that is already included, to avoid "Riyan Street, Riyan Street" or
 * "Abu Dhabi, Abu Dhabi" redundancy.
 */
export function buildAddress(parts: (string | null | undefined)[]): string {
  const nonEmpty = parts.map(p => (p ?? '').trim()).filter(Boolean);
  const deduped: string[] = [];
  for (const part of nonEmpty) {
    const lower = part.toLowerCase();
    // Skip if this exact part is already included or is a substring of one already kept
    const redundant = deduped.some(kept =>
      kept.toLowerCase().includes(lower) || lower.includes(kept.toLowerCase())
    );
    if (!redundant) deduped.push(part);
  }
  return deduped.join(', ');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}…`;
}

// ── Numbers ───────────────────────────────────────────────────────────────────
export function formatNumber(n: number, locale: string = 'en-AE'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
