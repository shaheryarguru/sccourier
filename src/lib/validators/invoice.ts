import { z } from 'zod';
import {
  invoiceNumberSchema,
  trackingIdSchema,
  trnSchema,
  currencyAmountSchema,
  optionalEmailSchema,
  anyPhoneSchema,
  nameSchema,
  addressSchema,
  dateStringSchema,
} from './common';

// ── Line item ─────────────────────────────────────────────────────────────────
export const LineItemSchema = z.object({
  item_name:   z.string().trim().min(1, 'Item name is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(500),
  hsn_code:    z.string().trim().max(20).optional(),
  quantity:    z
    .number({ error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1'),
  unit_price: currencyAmountSchema,
  total:      currencyAmountSchema,
}).superRefine((data, ctx) => {
  const expected = +(data.quantity * data.unit_price).toFixed(2);
  if (Math.abs(data.total - expected) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['total'],
      message: `Line total must equal quantity × unit price (expected ${expected})`,
    });
  }
});

// ── Create invoice request ────────────────────────────────────────────────────
export const CreateInvoiceSchema = z.object({
  booking_id:  z.string().uuid('Invalid booking ID'),
  tracking_id: trackingIdSchema,

  // Company
  company_name:    z.string().trim().min(1).max(200).optional(),
  company_trn:     trnSchema,
  company_address: addressSchema,
  company_phone:   anyPhoneSchema,
  company_email:   z.string().trim().toLowerCase().email('Invalid company email'),
  company_logo_url: z.string().url('Invalid logo URL').optional(),

  // Customer
  customer_id:      z.string().uuid('Invalid customer ID').optional(),
  customer_name:    nameSchema,
  customer_trn:     trnSchema.optional().or(z.literal('')),
  customer_address: addressSchema,
  customer_phone:   anyPhoneSchema,
  customer_email:   optionalEmailSchema,

  // Line items
  line_items: z
    .array(LineItemSchema)
    .min(1, 'At least one line item is required')
    .max(50, 'Cannot exceed 50 line items'),

  // Pricing (all AED)
  subtotal:        currencyAmountSchema,
  discount_amount: z.number().min(0).multipleOf(0.01).optional().default(0),
  discount_reason: z.string().trim().max(200).optional(),
  taxable_amount:  currencyAmountSchema,
  vat_rate:        z.number().min(0).max(100).multipleOf(0.01).default(5),
  vat_amount:      currencyAmountSchema,
  total_amount:    currencyAmountSchema,
  currency:        z.string().length(3).default('AED'),

  // Payment
  payment_method:    z.enum(['cash', 'card', 'bank_transfer', 'cod', 'online'], {
    error: 'Invalid payment method',
  }),
  payment_status:    z.enum(['unpaid', 'paid', 'partial', 'overdue', 'refunded']).default('unpaid'),
  payment_date:      z.string().datetime({ offset: true }).optional(),
  payment_reference: z.string().trim().max(100).optional(),

  // Dates
  issue_date: dateStringSchema,
  due_date:   dateStringSchema.optional(),

  // Terms
  terms_and_conditions: z.string().trim().min(10, 'Terms must be at least 10 characters').max(5000),

  // Misc
  notes:    z.string().trim().max(1000).optional(),
  is_draft: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Verify subtotal matches sum of line items
  const lineTotal = +data.line_items.reduce((sum, item) => sum + item.total, 0).toFixed(2);
  if (Math.abs(data.subtotal - lineTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['subtotal'],
      message: `Subtotal (${data.subtotal}) must equal sum of line items (${lineTotal})`,
    });
  }

  // Verify VAT calculation
  const expectedVat = +(data.taxable_amount * (data.vat_rate / 100)).toFixed(2);
  if (Math.abs(data.vat_amount - expectedVat) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['vat_amount'],
      message: `VAT amount must equal taxable amount × VAT rate (expected ${expectedVat})`,
    });
  }

  // Verify total
  const expectedTotal = +(data.taxable_amount + data.vat_amount).toFixed(2);
  if (Math.abs(data.total_amount - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['total_amount'],
      message: `Total must equal taxable amount + VAT (expected ${expectedTotal})`,
    });
  }

  // Due date must be on or after issue date
  if (data.due_date && data.due_date < data.issue_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['due_date'],
      message: 'Due date cannot be before issue date',
    });
  }

  // Payment date required when status is 'paid'
  if (data.payment_status === 'paid' && !data.payment_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['payment_date'],
      message: 'Payment date is required when status is "paid"',
    });
  }
});

// ── Invoice number query (for GET/verify) ─────────────────────────────────────
export const InvoiceQuerySchema = z.object({
  invoice_number: invoiceNumberSchema.optional(),
  tracking_id:    trackingIdSchema.optional(),
  booking_id:     z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  if (!data.invoice_number && !data.tracking_id && !data.booking_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: 'At least one of invoice_number, tracking_id, or booking_id is required',
    });
  }
});

// ── QR verification payload ───────────────────────────────────────────────────
export const QRVerificationSchema = z.object({
  data: z.string().min(1, 'Verification data is required'),
  sig:  z.string().length(64, 'Invalid signature'),
});

// ── Cancel invoice ────────────────────────────────────────────────────────────
export const CancelInvoiceSchema = z.object({
  invoice_id:       z.string().uuid('Invalid invoice ID'),
  cancelled_reason: z.string().trim().min(5, 'Cancellation reason must be at least 5 characters').max(500),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type LineItemData         = z.infer<typeof LineItemSchema>;
export type CreateInvoiceData    = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceQueryData     = z.infer<typeof InvoiceQuerySchema>;
export type QRVerificationData   = z.infer<typeof QRVerificationSchema>;
export type CancelInvoiceData    = z.infer<typeof CancelInvoiceSchema>;
