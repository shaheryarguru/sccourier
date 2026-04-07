/**
 * UAE FTA (Federal Tax Authority) compliance helpers.
 *
 * References:
 *  - UAE VAT Law (Federal Decree-Law No. 8 of 2017)
 *  - FTA Tax Invoice requirements: mandatory fields per Article 59
 *  - Standard rate: 5%
 */

import { COMPANY_INFO, DEFAULT_TERMS, UAE_VAT_RATE } from '../utils/constants';
import { createAdminClient } from '../supabase/admin';

// ── VAT calculation ───────────────────────────────────────────────────────────
export interface VATBreakdown {
  subtotal:       number;  // before any discount
  discountAmount: number;
  taxableAmount:  number;  // subtotal − discount
  vatRate:        number;  // e.g. 5
  vatAmount:      number;
  totalAmount:    number;  // taxableAmount + vatAmount
}

/**
 * Compute the full VAT breakdown for a given subtotal.
 * All amounts are rounded to 2 decimal places (fils).
 */
export function calculateVAT(
  subtotal:       number,
  discountAmount: number = 0,
  vatRate:        number = UAE_VAT_RATE,
): VATBreakdown {
  const taxableAmount = +(subtotal - discountAmount).toFixed(2);
  const vatAmount     = +(taxableAmount * (vatRate / 100)).toFixed(2);
  const totalAmount   = +(taxableAmount + vatAmount).toFixed(2);
  return {
    subtotal:       +subtotal.toFixed(2),
    discountAmount: +discountAmount.toFixed(2),
    taxableAmount,
    vatRate,
    vatAmount,
    totalAmount,
  };
}

/**
 * Calculate VAT from a VAT-inclusive total (reverse VAT).
 * Useful when a price is already quoted with VAT included.
 */
export function reverseVAT(inclusiveTotal: number, vatRate: number = UAE_VAT_RATE): VATBreakdown {
  const taxableAmount = +(inclusiveTotal / (1 + vatRate / 100)).toFixed(2);
  const vatAmount     = +(inclusiveTotal - taxableAmount).toFixed(2);
  return {
    subtotal:       taxableAmount,
    discountAmount: 0,
    taxableAmount,
    vatRate,
    vatAmount,
    totalAmount:    +inclusiveTotal.toFixed(2),
  };
}

// ── Invoice number generation ─────────────────────────────────────────────────
/**
 * Generate a sequential invoice number: INV-YYYYMM-XXXX
 * The sequence number must come from the database (passed in).
 */
export function generateInvoiceNumber(sequenceNumber: number, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const seq  = String(sequenceNumber).padStart(4, '0');
  return `INV-${yyyy}${mm}-${seq}`;
}

// ── TRN validation ────────────────────────────────────────────────────────────
/**
 * UAE TRN (Tax Registration Number):
 * - Exactly 15 digits
 * - Starts with 100 (UAE FTA assigns numbers in this range)
 * Returns null if valid, or an error message if invalid.
 */
export function validateTRN(trn: string): string | null {
  const digits = trn.replace(/\D/g, '');
  if (digits.length !== 15) return 'TRN must be exactly 15 digits';
  if (!digits.startsWith('1'))
    return 'UAE TRN must start with 1';
  return null; // valid
}

export function isTRNValid(trn: string): boolean {
  return validateTRN(trn) === null;
}

// ── UAE FTA mandatory fields check ────────────────────────────────────────────
export interface TaxInvoiceFields {
  invoiceNumber:       string;
  invoiceDate:         string;
  companyName:         string;
  companyTRN:          string;
  companyAddress:      string;
  customerName:        string;
  customerAddress:     string;
  lineItems:           Array<{ description: string; quantity: number; unitPrice: number; vatRate: number; total: number }>;
  subtotal:            number;
  vatRate:             number;
  vatAmount:           number;
  totalAmount:         number;
  currency:            string;
  paymentMethod:       string;
  termsAndConditions:  string;
}

/**
 * Validate that all UAE FTA-mandated tax invoice fields are present and non-empty.
 * Returns an array of missing/invalid field names, or an empty array if all is well.
 */
export function validateTaxInvoiceFields(fields: TaxInvoiceFields): string[] {
  const errors: string[] = [];

  if (!fields.invoiceNumber?.trim())                  errors.push('invoiceNumber');
  if (!fields.invoiceDate?.trim())                    errors.push('invoiceDate');
  if (!fields.companyName?.trim())                    errors.push('companyName (supplier)');
  if (!fields.companyTRN?.trim())                     errors.push('companyTRN (supplier TRN)');
  if (!fields.companyAddress?.trim())                 errors.push('companyAddress');
  if (!fields.customerName?.trim())                   errors.push('customerName');
  if (!fields.customerAddress?.trim())                errors.push('customerAddress');
  if (!fields.lineItems?.length)                      errors.push('lineItems (at least one required)');
  if (fields.currency !== 'AED')                      errors.push('currency (must be AED)');
  if (fields.vatRate !== UAE_VAT_RATE)                errors.push(`vatRate (must be ${UAE_VAT_RATE}%)`);
  if (typeof fields.vatAmount !== 'number')           errors.push('vatAmount');
  if (typeof fields.totalAmount !== 'number')         errors.push('totalAmount');
  if (!fields.termsAndConditions?.trim())             errors.push('termsAndConditions');

  const trnError = validateTRN(fields.companyTRN ?? '');
  if (trnError) errors.push(`companyTRN invalid: ${trnError}`);

  return errors;
}

// ── Default T&C ───────────────────────────────────────────────────────────────
export function getDefaultTermsAndConditions(): string {
  return DEFAULT_TERMS;
}

// ── Company info for invoice header ──────────────────────────────────────────
export interface InvoiceCompanyInfo {
  company_name:     string;
  company_trn:      string;
  company_address:  string;
  company_phone:    string;
  company_email:    string;
  company_logo_url?: string;
}

/** Sync fallback — used only when async version cannot be awaited */
export function getCompanyInvoiceInfo(): InvoiceCompanyInfo {
  return {
    company_name:     COMPANY_INFO.name,
    company_trn:      COMPANY_INFO.trn,
    company_address:  COMPANY_INFO.address,
    company_phone:    COMPANY_INFO.phone,
    company_email:    COMPANY_INFO.email,
    company_logo_url: COMPANY_INFO.logo_url,
  };
}

/** Async version — reads live values from company_settings with env fallbacks */
export async function getCompanyInvoiceInfoFromDB(): Promise<InvoiceCompanyInfo> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('company_settings').select('*').eq('id', 1).maybeSingle();
    return {
      company_name:     data?.company_name    ?? COMPANY_INFO.name,
      company_trn:      data?.company_trn     ?? COMPANY_INFO.trn,
      company_address:  data?.company_address ?? COMPANY_INFO.address,
      company_phone:    data?.company_phone   ?? COMPANY_INFO.phone,
      company_email:    data?.company_email   ?? COMPANY_INFO.email,
      company_logo_url: COMPANY_INFO.logo_url,
    };
  } catch {
    return getCompanyInvoiceInfo();
  }
}

/** Async version — reads T&C from DB with constant fallback */
export async function getTermsFromDB(): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('company_settings').select('terms_and_conditions').eq('id', 1).maybeSingle();
    return data?.terms_and_conditions ?? DEFAULT_TERMS;
  } catch {
    return DEFAULT_TERMS;
  }
}

// ── Estimated delivery calculation ───────────────────────────────────────────
const SERVICE_DAYS: Record<string, { min: number; max: number }> = {
  standard:      { min: 2, max: 3 },
  express:       { min: 1, max: 1 },
  same_day:      { min: 0, max: 0 },  // same calendar day
  international: { min: 5, max: 10 },
  cargo:         { min: 3, max: 7 },
};

/**
 * Estimate delivery date range based on service type.
 * Skips Fridays (UAE weekend day) for domestic services.
 */
export function estimateDeliveryDate(
  serviceType: string,
  bookingDate: Date = new Date(),
): { earliest: Date; latest: Date } {
  const range = SERVICE_DAYS[serviceType] ?? { min: 3, max: 5 };

  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      // Skip Friday (5) only — UAE moved to Sat/Sun weekend in 2022, but
      // couriers still avoid Friday for most deliveries
      if (result.getDay() !== 5) added++;
    }
    return result;
  }

  if (range.min === 0) {
    // Same day: add 6 hours to booking time
    const sameDay = new Date(bookingDate.getTime() + 6 * 60 * 60 * 1000);
    return { earliest: sameDay, latest: sameDay };
  }

  return {
    earliest: addBusinessDays(bookingDate, range.min),
    latest:   addBusinessDays(bookingDate, range.max),
  };
}
