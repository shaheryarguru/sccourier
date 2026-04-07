import { z } from 'zod';
import {
  nameSchema,
  addressSchema,
  uaePhoneSchema,
  anyPhoneSchema,
  optionalEmailSchema,
  currencyAmountSchema,
  weightSchema,
  dimensionSchema,
  positiveIntSchema,
  dateStringSchema,
} from './common';

// ── Step 1: Sender ────────────────────────────────────────────────────────────
export const SenderSchema = z.object({
  full_name:        nameSchema,
  phone:            uaePhoneSchema,
  email:            optionalEmailSchema,
  company_name:     z.string().trim().max(150).optional(),
  emirates_id:      z
    .string()
    .trim()
    .regex(/^784-\d{4}-\d{7}-\d$/, 'Invalid Emirates ID format')
    .optional()
    .or(z.literal('')),
  address_line_1:   addressSchema,
  address_line_2:   z.string().trim().max(200).optional(),
  city:             z.string().trim().min(2, 'City is required').max(100),
  emirate:          z.string().min(1, 'Please select an emirate'),
  country:          z.string().min(1, 'Country is required'),
  postal_code:      z.string().trim().max(20).optional(),
  save_as_default:  z.boolean(),
});

// ── Step 2: Receiver ──────────────────────────────────────────────────────────
export const ReceiverSchema = z.object({
  full_name:             nameSchema,
  phone:                 anyPhoneSchema,
  phone_country_code:    z.string().min(1, 'Country code is required'),
  email:                 optionalEmailSchema,
  address_line_1:        addressSchema,
  address_line_2:        z.string().trim().max(200).optional(),
  city:                  z.string().trim().min(2, 'City is required').max(100),
  country:               z.string().min(1, 'Please select a country'),
  emirate:               z.string().trim().optional(),
  postal_code:           z.string().trim().max(20).optional(),
  delivery_instructions: z.string().trim().max(500).optional(),
});

// ── Step 3: Package ───────────────────────────────────────────────────────────
export const PackageSchema = z.object({
  package_type:       z.enum(
    ['document', 'parcel', 'fragile', 'heavy', 'perishable'],
    { error: 'Please select a package type' },
  ),
  item_name:          z.string().trim().min(2, 'Item name is required').max(200),
  description:        z.string().trim().min(5, 'Description must be at least 5 characters').max(500),
  declared_value:     currencyAmountSchema.refine(v => v >= 1, 'Declared value must be at least AED 1'),
  weight_kg:          weightSchema.refine(v => v >= 0.01, 'Weight must be at least 0.01 kg'),
  length_cm:          dimensionSchema.optional(),
  width_cm:           dimensionSchema.optional(),
  height_cm:          dimensionSchema.optional(),
  number_of_pieces:   positiveIntSchema.refine(v => v <= 999, 'Cannot exceed 999 pieces'),
  is_fragile:         z.boolean(),
  requires_signature: z.boolean(),
}).superRefine((data, ctx) => {
  const dims = [data.length_cm, data.width_cm, data.height_cm];
  const anySet = dims.some(d => d !== undefined);
  const allSet = dims.every(d => d !== undefined);
  if (anySet && !allSet) {
    (['length_cm', 'width_cm', 'height_cm'] as const).forEach((f, i) => {
      if (dims[i] === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [f], message: 'All three dimensions are required if any is provided' });
      }
    });
  }
  if (data.is_fragile && !data.requires_signature) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['requires_signature'], message: 'Fragile items must require a delivery signature' });
  }
});

// ── Step 4: Service ───────────────────────────────────────────────────────────
export const ServiceSchema = z.object({
  service_type:         z.enum(
    ['standard', 'express', 'same_day', 'international', 'cargo'],
    { error: 'Please select a service type' },
  ),
  pickup_requested:     z.boolean(),
  pickup_date:          dateStringSchema.optional(),
  pickup_time_slot:     z.enum(['morning', 'afternoon', 'evening']).optional(),
  insurance:            z.boolean(),
  cod:                  z.boolean(),
  special_instructions: z.string().trim().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.pickup_requested) {
    if (!data.pickup_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickup_date'], message: 'Please select a pickup date' });
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(data.pickup_date) < today) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickup_date'], message: 'Pickup date cannot be in the past' });
      }
    }
    if (!data.pickup_time_slot) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pickup_time_slot'], message: 'Please select a pickup time slot' });
    }
  }
  if (data.cod && data.service_type === 'international') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cod'], message: 'Cash on Delivery is not available for international shipments' });
  }
});

// ── Step 5: Payment ───────────────────────────────────────────────────────────
export const PaymentSchema = z.object({
  payment_method: z.enum(
    ['cash', 'card', 'bank_transfer', 'cod', 'online'],
    { error: 'Please select a payment method' },
  ),
  terms_accepted: z.literal(true, 'You must accept the terms and conditions'),
});

// ── Full booking schema ───────────────────────────────────────────────────────
export const BookingSchema = z.object({
  sender:   SenderSchema,
  receiver: ReceiverSchema,
  package:  PackageSchema,
  service:  ServiceSchema,
  payment:  PaymentSchema,
}).superRefine((data, ctx) => {
  if (data.payment.payment_method === 'cod' && !data.service.cod) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['payment', 'payment_method'], message: 'Please enable Cash on Delivery in the service options' });
  }
  if (data.service.cod && data.payment.payment_method !== 'cod') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['service', 'cod'], message: 'COD service requires COD as the payment method' });
  }
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type SenderFormData   = z.infer<typeof SenderSchema>;
export type ReceiverFormData = z.infer<typeof ReceiverSchema>;
export type PackageFormData  = z.infer<typeof PackageSchema>;
export type ServiceFormData  = z.infer<typeof ServiceSchema>;
export type PaymentFormData  = z.infer<typeof PaymentSchema>;
export type BookingFormData  = z.infer<typeof BookingSchema>;

// ── Short aliases (used by components) ───────────────────────────────────────
export type SenderForm   = SenderFormData;
export type ReceiverForm = ReceiverFormData;
export type PackageForm  = PackageFormData;
export type ServiceForm  = ServiceFormData;
export type PaymentForm  = PaymentFormData;

// ── Default values (pass to useForm({ defaultValues }) — NOT to schema) ───────
export const senderDefaults: SenderFormData = {
  full_name: '', phone: '', email: '', company_name: '', emirates_id: '',
  address_line_1: '', address_line_2: '', city: '', emirate: '',
  country: 'UAE', postal_code: '', save_as_default: false,
};

export const receiverDefaults: ReceiverFormData = {
  full_name: '', phone: '', phone_country_code: '+971', email: '',
  address_line_1: '', address_line_2: '', city: '', country: 'UAE',
  emirate: '', postal_code: '', delivery_instructions: '',
};

export const packageDefaults: PackageFormData = {
  package_type: 'parcel', item_name: '', description: '',
  declared_value: 0, weight_kg: 0,
  length_cm: undefined, width_cm: undefined, height_cm: undefined,
  number_of_pieces: 1, is_fragile: false, requires_signature: true,
};

export const serviceDefaults: ServiceFormData = {
  service_type: 'standard', pickup_requested: false,
  pickup_date: undefined, pickup_time_slot: undefined,
  insurance: false, cod: false, special_instructions: '',
};

export const paymentDefaults: PaymentFormData = {
  payment_method: 'cash',
  terms_accepted: true,
};
