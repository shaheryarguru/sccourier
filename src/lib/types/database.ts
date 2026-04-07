// Auto-generated types from Supabase schema
// Run: npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Domain enums ──────────────────────────────────────────────────────────────
export type BookingStatus =
  | 'booked'
  | 'confirmed'
  | 'picked_up'
  | 'received_at_origin'
  | 'in_transit'
  | 'at_hub'
  | 'customs_clearance'
  | 'cleared_customs'
  | 'arrived_at_destination'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'returned'
  | 'on_hold'
  | 'cancelled'
  | 'pending';

export type PackageType = 'document' | 'parcel' | 'fragile' | 'heavy' | 'perishable';
export type ServiceType = 'standard' | 'express' | 'same_day' | 'international' | 'cargo';
export type PickupTimeSlot = 'morning' | 'afternoon' | 'evening';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cod' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type InvoicePaymentStatus = 'unpaid' | 'paid' | 'partial' | 'overdue' | 'refunded';

// ── Row types ─────────────────────────────────────────────────────────────────
export type CustomerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  phone_country_code: string;
  emirates_id: string | null;
  company_name: string | null;
  trade_license_number: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  emirate: string;
  country: string;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  booking_number: string;
  tracking_id: string;
  status: BookingStatus;
  sender_id: string | null;
  sender_name: string;
  sender_phone: string;
  sender_email: string | null;
  sender_address: string;
  sender_city: string;
  sender_emirate: string;
  sender_country: string;
  sender_postal_code: string | null;
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string | null;
  receiver_address: string;
  receiver_city: string;
  receiver_emirate: string | null;
  receiver_country: string;
  receiver_postal_code: string | null;
  package_type: PackageType;
  package_description: string;
  declared_value: number;
  weight_kg: number;
  dimensions_length_cm: number | null;
  dimensions_width_cm: number | null;
  dimensions_height_cm: number | null;
  number_of_pieces: number;
  is_fragile: boolean;
  requires_signature: boolean;
  service_type: ServiceType;
  pickup_requested: boolean;
  pickup_date: string | null;
  pickup_time_slot: PickupTimeSlot | null;
  estimated_delivery: string | null;
  special_instructions: string | null;
  base_price: number;
  weight_surcharge: number;
  fuel_surcharge: number;
  insurance_fee: number;
  cod_fee: number;
  remote_area_surcharge: number;
  discount_amount: number;
  discount_reason: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Migration 013 — soft delete
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type TrackingEventRow = {
  id: string;
  booking_id: string;
  tracking_id: string;
  status: BookingStatus;
  status_detail: string | null;
  location: string | null;
  location_coordinates: string | null;
  facility_code: string | null;
  updated_by: string | null;
  notes: string | null;
  photo_url: string | null;
  signature_url: string | null;
  event_timestamp: string;
  created_at: string;
  // Migration 012 — backdating & audit trail
  is_backdated: boolean;
  original_timestamp: string | null;
  modified_by: string | null;
  modification_reason: string | null;
  // Migration 012 — delivery proof extras
  delivered_to: string | null;
  delivery_notes: string | null;
  // Migration 012 — custom/free-form events
  is_custom_event: boolean;
  custom_event_label: string | null;
};

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  tracking_id: string;
  company_name: string;
  company_trn: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo_url: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_trn: string | null;
  customer_address: string;
  customer_phone: string;
  customer_email: string | null;
  // Receiver fields (added in migration 011)
  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_email: string | null;
  receiver_address: string | null;
  receiver_city: string | null;
  receiver_emirate: string | null;
  receiver_country: string | null;
  // Supply date + amount in words (added in migration 011)
  supply_date: string | null;
  amount_in_words: string | null;
  line_items: Json;
  subtotal: number;
  discount_amount: number;
  discount_reason: string | null;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: InvoicePaymentStatus;
  payment_date: string | null;
  payment_reference: string | null;
  terms_and_conditions: string;
  qr_code_data: string;
  qr_verification_hash: string;
  digital_signature: string | null;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  is_draft: boolean;
  is_cancelled: boolean;
  cancelled_reason: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  gateway_response: Json | null;
  status: PaymentStatus | 'failed';
  paid_at: string | null;
  created_at: string;
};

export type TrackingSequenceRow = {
  date_prefix:   string;
  current_value: number;
};

// ── Public tracking view (restricted columns for anon users) ──────────────────
export type PublicTrackingView = {
  tracking_id:      string;
  booking_number:   string;
  status:           BookingStatus;
  sender_city:      string;
  sender_emirate:   string;
  receiver_city:    string;
  receiver_country: string;
  service_type:     ServiceType;
  package_type:     PackageType;
  number_of_pieces: number;
  estimated_delivery: string | null;
  pickup_requested: boolean;
  pickup_date:      string | null;
  created_at:       string;
};

// ── Insert types (omit auto-generated fields) ─────────────────────────────────
export type CustomerInsert = Omit<CustomerRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; created_at?: string; updated_at?: string;
};
export type BookingInsert = Omit<BookingRow, 'id' | 'created_at' | 'updated_at' | 'discount_amount' | 'discount_reason' | 'is_deleted' | 'deleted_at' | 'deleted_by'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  // Migration 012 — have DB defaults, optional on insert
  discount_amount?: number;
  discount_reason?: string | null;
  // Migration 013 — soft delete (have DB defaults, optional on insert)
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};
export type TrackingEventInsert = Omit<
  TrackingEventRow,
  | 'id' | 'created_at'
  | 'is_backdated' | 'original_timestamp' | 'modified_by' | 'modification_reason'
  | 'delivered_to' | 'delivery_notes'
  | 'is_custom_event' | 'custom_event_label'
> & {
  id?: string;
  created_at?: string;
  // Migration 012 — all optional with safe defaults
  is_backdated?: boolean;
  original_timestamp?: string | null;
  modified_by?: string | null;
  modification_reason?: string | null;
  delivered_to?: string | null;
  delivery_notes?: string | null;
  is_custom_event?: boolean;
  custom_event_label?: string | null;
};
export type InvoiceInsert = Omit<InvoiceRow, 'id' | 'created_at' | 'updated_at' | 'receiver_name' | 'receiver_phone' | 'receiver_email' | 'receiver_address' | 'receiver_city' | 'receiver_emirate' | 'receiver_country' | 'supply_date' | 'amount_in_words'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  // Migration 011 fields — optional for backwards compatibility
  receiver_name?: string | null;
  receiver_phone?: string | null;
  receiver_email?: string | null;
  receiver_address?: string | null;
  receiver_city?: string | null;
  receiver_emirate?: string | null;
  receiver_country?: string | null;
  supply_date?: string | null;
  amount_in_words?: string | null;
};
export type PaymentInsert = Omit<PaymentRow, 'id' | 'created_at'> & {
  id?: string; created_at?: string;
};

// ── Database type (for Supabase client) ───────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      customers: {
        Row:           CustomerRow;
        Insert:        CustomerInsert;
        Update:        Partial<CustomerInsert>;
        Relationships: never[];
      };
      bookings: {
        Row:           BookingRow;
        Insert:        BookingInsert;
        Update:        Partial<BookingInsert>;
        Relationships: never[];
      };
      tracking_events: {
        Row:           TrackingEventRow;
        Insert:        TrackingEventInsert;
        Update:        Partial<TrackingEventInsert>;
        Relationships: never[];
      };
      invoices: {
        Row:           InvoiceRow;
        Insert:        InvoiceInsert;
        Update:        Partial<InvoiceInsert>;
        Relationships: never[];
      };
      payments: {
        Row:           PaymentRow;
        Insert:        PaymentInsert;
        Update:        Partial<PaymentInsert>;
        Relationships: never[];
      };
      company_settings: {
        Row: {
          id: number; logo_url: string | null; updated_at: string;
          company_name: string | null; company_trn: string | null;
          company_address: string | null; company_phone: string | null;
          company_email: string | null; company_website: string | null;
          bank_name: string | null; bank_account_name: string | null;
          bank_account_no: string | null; bank_iban: string | null;
          bank_swift: string | null; terms_and_conditions: string | null;
          // Pricing (migration 016)
          price_standard: number | null; price_express: number | null;
          price_same_day: number | null; price_international: number | null;
          price_intra_standard: number | null; price_intra_express: number | null;
          price_intra_same_day: number | null;
          fuel_surcharge: number | null; cod_fee: number | null;
          insurance_rate: number | null; remote_area_surcharge: number | null;
          weight_rate_per_kg: number | null; weight_free_kg: number | null;
          min_cancel_fee: number | null; redelivery_fee: number | null;
        };
        Insert: {
          id?: number; logo_url?: string | null; updated_at?: string;
          company_name?: string | null; company_trn?: string | null;
          company_address?: string | null; company_phone?: string | null;
          company_email?: string | null; company_website?: string | null;
          bank_name?: string | null; bank_account_name?: string | null;
          bank_account_no?: string | null; bank_iban?: string | null;
          bank_swift?: string | null; terms_and_conditions?: string | null;
          price_standard?: number | null; price_express?: number | null;
          price_same_day?: number | null; price_international?: number | null;
          price_intra_standard?: number | null; price_intra_express?: number | null;
          price_intra_same_day?: number | null;
          fuel_surcharge?: number | null; cod_fee?: number | null;
          insurance_rate?: number | null; remote_area_surcharge?: number | null;
          weight_rate_per_kg?: number | null; weight_free_kg?: number | null;
          min_cancel_fee?: number | null; redelivery_fee?: number | null;
        };
        Update: {
          id?: number; logo_url?: string | null; updated_at?: string;
          company_name?: string | null; company_trn?: string | null;
          company_address?: string | null; company_phone?: string | null;
          company_email?: string | null; company_website?: string | null;
          bank_name?: string | null; bank_account_name?: string | null;
          bank_account_no?: string | null; bank_iban?: string | null;
          bank_swift?: string | null; terms_and_conditions?: string | null;
          price_standard?: number | null; price_express?: number | null;
          price_same_day?: number | null; price_international?: number | null;
          price_intra_standard?: number | null; price_intra_express?: number | null;
          price_intra_same_day?: number | null;
          fuel_surcharge?: number | null; cod_fee?: number | null;
          insurance_rate?: number | null; remote_area_surcharge?: number | null;
          weight_rate_per_kg?: number | null; weight_free_kg?: number | null;
          min_cancel_fee?: number | null; redelivery_fee?: number | null;
        };
        Relationships: never[];
      };
    };
    Views:   Record<string, never>;
    Functions: {
      get_next_tracking_sequence: {
        Args:    { date_prefix: string };
        Returns: number;
      };
    };
    Enums:          Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
