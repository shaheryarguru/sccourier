import { z } from 'zod';

// ── UAE phone ─────────────────────────────────────────────────────────────────
// Accepts: +971 5X XXXXXXX | 05X XXXXXXX | 971 5X XXXXXXX
// Mobile: 050, 052, 054, 055, 056, 058
// Landline: 02, 03, 04, 06, 07, 09
export const uaePhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+971|00971|0)?(5[024568]\d{7}|[2346789]\d{7})$/,
    'Enter a valid UAE phone number (e.g. 0501234567)',
  );

// ── International phone (E.164) ───────────────────────────────────────────────
// +[country code][number], 7–15 digits total
export const internationalPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    'Enter a valid international phone number in E.164 format (e.g. +442071234567)',
  );

// ── Generic phone (UAE or international) ─────────────────────────────────────
export const anyPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[\d\s\-().]{7,20}$/,
    'Enter a valid phone number',
  );

// ── Email ─────────────────────────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address');

// Optional email — accepts empty string or valid email
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''));

// ── UAE Emirates ID ───────────────────────────────────────────────────────────
// Format: 784-YYYY-XXXXXXX-X  (784 = UAE country code)
export const emiratesIdSchema = z
  .string()
  .trim()
  .regex(
    /^784-\d{4}-\d{7}-\d$/,
    'Emirates ID must be in format 784-YYYY-XXXXXXX-X',
  );

// ── Tracking ID (SCDDMM####) ──────────────────────────────────────────────────
export const trackingIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^SC\d{8}$/,
    'Tracking ID must be in format SCDDMM#### (e.g. SC29030001)',
  );

// ── Invoice number ────────────────────────────────────────────────────────────
// Format: INV-YYYYMM-XXXX
export const invoiceNumberSchema = z
  .string()
  .trim()
  .regex(
    /^INV-\d{6}-\d{4}$/,
    'Invoice number must be in format INV-YYYYMM-XXXX (e.g. INV-202603-0001)',
  );

// ── Booking number ────────────────────────────────────────────────────────────
// Format: SC-YYYYMMDD-XXXX
export const bookingNumberSchema = z
  .string()
  .trim()
  .regex(
    /^SC-\d{8}-\d{4}$/,
    'Booking number must be in format SC-YYYYMMDD-XXXX (e.g. SC-20260329-0001)',
  );

// ── UAE TRN ───────────────────────────────────────────────────────────────────
// Format: 15 digits (UAE FTA Tax Registration Number)
export const trnSchema = z
  .string()
  .trim()
  .regex(
    /^\d{15}$/,
    'TRN must be exactly 15 digits',
  );

// ── Currency amount ───────────────────────────────────────────────────────────
// Positive number, max 2 decimal places
export const currencyAmountSchema = z
  .number({ error: 'Enter a valid amount' })
  .positive('Amount must be greater than 0')
  .multipleOf(0.01, 'Amount cannot have more than 2 decimal places');

// ── Weight ────────────────────────────────────────────────────────────────────
// Positive, max 3 decimal places
export const weightSchema = z
  .number({ error: 'Enter a valid weight' })
  .positive('Weight must be greater than 0')
  .max(9999, 'Weight cannot exceed 9,999 kg')
  .multipleOf(0.001, 'Weight cannot have more than 3 decimal places');

// ── Dimension (cm) ────────────────────────────────────────────────────────────
export const dimensionSchema = z
  .number({ error: 'Enter a valid measurement' })
  .positive('Dimension must be greater than 0')
  .max(999, 'Dimension cannot exceed 999 cm');

// ── Positive integer ──────────────────────────────────────────────────────────
export const positiveIntSchema = z
  .number({ error: 'Enter a whole number' })
  .int('Must be a whole number')
  .positive('Must be at least 1');

// ── Date string (YYYY-MM-DD) ──────────────────────────────────────────────────
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ── Non-empty string helpers ──────────────────────────────────────────────────
export const requiredString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters');

export const addressSchema = z
  .string()
  .trim()
  .min(5, 'Address must be at least 5 characters')
  .max(300, 'Address cannot exceed 300 characters');
