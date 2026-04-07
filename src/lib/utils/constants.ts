// ── App-wide constants ────────────────────────────────────────────────────────

export const APP_NAME = 'SC Courier';
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com';

// UAE-specific
export const UAE_VAT_RATE       = 5;   // 5%
export const UAE_COUNTRY_CODE   = '+971';
export const DEFAULT_CURRENCY   = 'AED';

// ── Company info ──────────────────────────────────────────────────────────────
export const COMPANY_INFO = {
  name:    'SC Courier LLC',
  trn:     process.env.COMPANY_TRN ?? '100000000000000',
  address: 'Office 1204, Business Bay Tower B, Al Abraj Street, Dubai, UAE',
  phone:   '+971 4 000 0000',
  email:   'info@sccourier.com',
  website: 'https://sccourier.com',
  logo_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com'}/logo.svg`,
} as const;

// Legacy individual exports (kept for backwards compat)
export const COMPANY_NAME    = COMPANY_INFO.name;
export const COMPANY_ADDRESS = COMPANY_INFO.address;
export const COMPANY_PHONE   = COMPANY_INFO.phone;
export const COMPANY_EMAIL   = COMPANY_INFO.email;

// ── Tracking ──────────────────────────────────────────────────────────────────
export const MAX_MULTI_TRACK = 10;

// ── Emirates ──────────────────────────────────────────────────────────────────
export const EMIRATES = [
  { value: 'dubai',          label: 'Dubai'          },
  { value: 'abu_dhabi',      label: 'Abu Dhabi'      },
  { value: 'sharjah',        label: 'Sharjah'        },
  { value: 'ajman',          label: 'Ajman'          },
  { value: 'ras_al_khaimah', label: 'Ras Al Khaimah' },
  { value: 'fujairah',       label: 'Fujairah'       },
  { value: 'umm_al_quwain',  label: 'Umm Al Quwain'  },
] as const;

export type EmirateValue = typeof EMIRATES[number]['value'];

// ── Pickup time slots ─────────────────────────────────────────────────────────
export const PICKUP_SLOTS = [
  { value: 'morning',   label: 'Morning (9:00 AM – 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM – 5:00 PM)' },
  { value: 'evening',   label: 'Evening (5:00 PM – 9:00 PM)'  },
] as const;

// ── Package types ─────────────────────────────────────────────────────────────
export const PACKAGE_TYPES = [
  { value: 'document',   label: 'Document / Envelope', icon: 'FileText' },
  { value: 'parcel',     label: 'Parcel / Box',         icon: 'Package'  },
  { value: 'fragile',    label: 'Fragile Items',         icon: 'AlertTriangle' },
  { value: 'heavy',      label: 'Heavy Goods',           icon: 'Weight'   },
  { value: 'perishable', label: 'Perishable Items',      icon: 'Thermometer' },
] as const;

// ── Service types ─────────────────────────────────────────────────────────────
export const SERVICE_TYPES = [
  { value: 'standard',      label: 'Standard',       description: '2–3 business days',  badge: '',        color: 'text-text-secondary' },
  { value: 'express',       label: 'Express',         description: 'Next business day',  badge: 'Popular', color: 'text-secondary'      },
  { value: 'same_day',      label: 'Same Day',        description: 'Within 6 hours',     badge: 'Fastest', color: 'text-accent'         },
  { value: 'international', label: 'International',   description: '5–10 business days', badge: '',        color: 'text-text-secondary' },
  { value: 'cargo',         label: 'Cargo / Freight', description: 'Heavy & bulk items', badge: 'Quote',   color: 'text-text-secondary' },
] as const;

// ── Shipment statuses ─────────────────────────────────────────────────────────
export const SHIPMENT_STATUSES = {
  booked: {
    label:    'Booked',
    color:    'text-text-secondary',
    bg:       'bg-gray-100',
    dot:      'bg-gray-400',
    variant:  'default' as const,
    description: 'Shipment has been booked',
  },
  confirmed: {
    label:    'Confirmed',
    color:    'text-secondary',
    bg:       'bg-amber-50',
    dot:      'bg-amber-400',
    variant:  'warning' as const,
    description: 'Booking confirmed by SC Courier',
  },
  picked_up: {
    label:    'Picked Up',
    color:    'text-blue-600',
    bg:       'bg-blue-50',
    dot:      'bg-blue-400',
    variant:  'info' as const,
    description: 'Package collected from sender',
  },
  received_at_origin: {
    label:    'At Origin',
    color:    'text-blue-600',
    bg:       'bg-blue-50',
    dot:      'bg-blue-400',
    variant:  'info' as const,
    description: 'Arrived at origin facility',
  },
  in_transit: {
    label:    'In Transit',
    color:    'text-primary',
    bg:       'bg-blue-50',
    dot:      'bg-primary',
    variant:  'info' as const,
    description: 'In transit between facilities',
  },
  at_hub: {
    label:    'At Hub',
    color:    'text-primary',
    bg:       'bg-blue-50',
    dot:      'bg-primary',
    variant:  'info' as const,
    description: 'At sorting/distribution hub',
  },
  customs_clearance: {
    label:    'Customs',
    color:    'text-orange-600',
    bg:       'bg-orange-50',
    dot:      'bg-orange-400',
    variant:  'warning' as const,
    description: 'In customs clearance',
  },
  cleared_customs: {
    label:    'Customs Cleared',
    color:    'text-accent',
    bg:       'bg-emerald-50',
    dot:      'bg-accent',
    variant:  'success' as const,
    description: 'Customs cleared successfully',
  },
  arrived_at_destination: {
    label:    'At Destination',
    color:    'text-accent',
    bg:       'bg-emerald-50',
    dot:      'bg-accent',
    variant:  'success' as const,
    description: 'Arrived at destination facility',
  },
  out_for_delivery: {
    label:    'Out for Delivery',
    color:    'text-accent',
    bg:       'bg-emerald-50',
    dot:      'bg-accent',
    variant:  'success' as const,
    description: 'With delivery rider',
  },
  delivery_attempted: {
    label:    'Attempted',
    color:    'text-orange-600',
    bg:       'bg-orange-50',
    dot:      'bg-orange-400',
    variant:  'warning' as const,
    description: 'Delivery attempted, recipient unavailable',
  },
  delivered: {
    label:    'Delivered',
    color:    'text-accent',
    bg:       'bg-emerald-50',
    dot:      'bg-accent',
    variant:  'success' as const,
    description: 'Successfully delivered',
  },
  returned: {
    label:    'Returned',
    color:    'text-danger',
    bg:       'bg-red-50',
    dot:      'bg-danger',
    variant:  'danger' as const,
    description: 'Returned to sender',
  },
  on_hold: {
    label:    'On Hold',
    color:    'text-orange-600',
    bg:       'bg-orange-50',
    dot:      'bg-orange-400',
    variant:  'warning' as const,
    description: 'On hold — address, payment, or customs issue',
  },
  cancelled: {
    label:    'Cancelled',
    color:    'text-danger',
    bg:       'bg-red-50',
    dot:      'bg-danger',
    variant:  'danger' as const,
    description: 'Booking cancelled',
  },
  pending: {
    label:    'Pending',
    color:    'text-text-secondary',
    bg:       'bg-gray-100',
    dot:      'bg-gray-400',
    variant:  'default' as const,
    description: 'Pending processing',
  },
} as const;

export type ShipmentStatus = keyof typeof SHIPMENT_STATUSES;

// ── Payment methods ───────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash',              icon: 'Banknote',    description: 'Pay in cash on pickup or delivery' },
  { value: 'card',          label: 'Credit / Debit Card', icon: 'CreditCard', description: 'Visa, Mastercard, AMEX'            },
  { value: 'bank_transfer', label: 'Bank Transfer',     icon: 'Building2',   description: 'Direct bank transfer (1-2 days)'   },
  { value: 'cod',           label: 'Cash on Delivery',  icon: 'PackageCheck', description: 'Receiver pays on delivery'         },
  { value: 'online',        label: 'Online Payment',    icon: 'Globe',       description: 'PayTabs / Stripe secure checkout'  },
] as const;

export type PaymentMethodValue = typeof PAYMENT_METHODS[number]['value'];

// ── Pricing (AED) ─────────────────────────────────────────────────────────────
export const PRICING = {
  // Base prices per service type
  BASE: {
    standard:      35,
    express:       55,
    same_day:      90,
    international: 120,
    cargo:         0,   // quote required
  },
  // Intra-emirate base prices (cheaper for local)
  INTRA_EMIRATE_BASE: {
    standard:  20,
    express:   35,
    same_day:  65,
    cargo:     0,
  },
  // Inter-emirate surcharges (added to base)
  INTER_EMIRATE_SURCHARGE: {
    dubai_abu_dhabi:     10,
    dubai_sharjah:        5,
    dubai_ajman:          8,
    dubai_ras_al_khaimah: 15,
    dubai_fujairah:       18,
    dubai_umm_al_quwain:  12,
  },
  // Weight brackets: free weight 1 kg, then per-kg charge
  WEIGHT: {
    FREE_KG:         1,
    RATE_PER_KG:     2,    // AED per kg after first kg
    HEAVY_THRESHOLD: 30,   // kg — triggers heavy surcharge
    HEAVY_RATE:      1.5,  // AED per kg (replaces base rate above threshold)
  },
  // Surcharges
  FUEL_SURCHARGE:        5,    // AED flat
  COD_FEE:               15,   // AED flat
  INSURANCE_RATE:        0.02, // 2% of declared value
  REMOTE_AREA_SURCHARGE: 20,   // AED flat
  MIN_CANCEL_FEE:        25,   // AED
  REDELIVERY_FEE:        15,   // AED per attempt after second
} as const;

// ── Facility codes ────────────────────────────────────────────────────────────
export const FACILITY_CODES: Record<string, string> = {
  'HUB-DXB': 'Dubai Hub',
  'HUB-AUH': 'Abu Dhabi Hub',
  'HUB-SHJ': 'Sharjah Hub',
  'HUB-AJM': 'Ajman Hub',
  'HUB-RAK': 'Ras Al Khaimah Hub',
  'HUB-FUJ': 'Fujairah Hub',
  'HUB-UAQ': 'Umm Al Quwain Hub',
};

// ── Default T&C ───────────────────────────────────────────────────────────────
export const DEFAULT_TERMS = `1. All shipments are subject to SC Courier's standard terms and conditions.
2. Liability is limited to declared value or AED 100, whichever is lower, unless insurance is purchased.
3. Delivery estimates are not guaranteed and may vary due to customs, weather, or force majeure.
4. Dangerous goods, prohibited items, and contraband are strictly not accepted.
5. Claims must be filed within 7 days of delivery or expected delivery date.
6. Cash on Delivery (COD) remittance is processed within 3–5 business days after delivery.
7. VAT is charged at 5% as per UAE Federal Tax Authority regulations.
8. Cancellation after pickup incurs a minimum charge of AED 25.
9. Re-delivery attempts beyond the second attempt are charged at AED 15 per attempt.
10. SC Courier reserves the right to inspect package contents for security compliance.`;
