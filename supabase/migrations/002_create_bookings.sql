-- ============================================================
-- Migration 002: bookings table
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  booking_number          TEXT           UNIQUE NOT NULL,
  tracking_id             TEXT           UNIQUE NOT NULL,
  status                  TEXT           NOT NULL DEFAULT 'pending'
                          CHECK (status IN (
                            'pending','confirmed','picked_up','received_at_origin',
                            'in_transit','at_hub','customs_clearance','cleared_customs',
                            'arrived_at_destination','out_for_delivery','delivery_attempted',
                            'delivered','returned','on_hold','cancelled','booked'
                          )),

  -- Sender
  sender_id               UUID           REFERENCES customers(id) ON DELETE SET NULL,
  sender_name             TEXT           NOT NULL,
  sender_phone            TEXT           NOT NULL,
  sender_email            TEXT,
  sender_address          TEXT           NOT NULL,
  sender_city             TEXT           NOT NULL,
  sender_emirate          TEXT           NOT NULL,
  sender_country          TEXT           NOT NULL DEFAULT 'UAE',
  sender_postal_code      TEXT,

  -- Receiver
  receiver_name           TEXT           NOT NULL,
  receiver_phone          TEXT           NOT NULL,
  receiver_email          TEXT,
  receiver_address        TEXT           NOT NULL,
  receiver_city           TEXT           NOT NULL,
  receiver_emirate        TEXT,
  receiver_country        TEXT           NOT NULL,
  receiver_postal_code    TEXT,

  -- Package
  package_type            TEXT           NOT NULL
                          CHECK (package_type IN ('document','parcel','fragile','heavy','perishable')),
  package_description     TEXT           NOT NULL,
  declared_value          DECIMAL(12,2)  NOT NULL CHECK (declared_value >= 0),
  weight_kg               DECIMAL(8,3)   NOT NULL CHECK (weight_kg > 0),
  dimensions_length_cm    DECIMAL(6,2),
  dimensions_width_cm     DECIMAL(6,2),
  dimensions_height_cm    DECIMAL(6,2),
  number_of_pieces        INTEGER        NOT NULL DEFAULT 1 CHECK (number_of_pieces >= 1),
  is_fragile              BOOLEAN        NOT NULL DEFAULT FALSE,
  requires_signature      BOOLEAN        NOT NULL DEFAULT TRUE,

  -- Service
  service_type            TEXT           NOT NULL
                          CHECK (service_type IN ('standard','express','same_day','international','cargo')),
  pickup_requested        BOOLEAN        NOT NULL DEFAULT FALSE,
  pickup_date             DATE,
  pickup_time_slot        TEXT
                          CHECK (pickup_time_slot IN ('morning','afternoon','evening') OR pickup_time_slot IS NULL),
  estimated_delivery      DATE,
  special_instructions    TEXT,

  -- Pricing (AED)
  base_price              DECIMAL(10,2)  NOT NULL CHECK (base_price >= 0),
  weight_surcharge        DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (weight_surcharge >= 0),
  fuel_surcharge          DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (fuel_surcharge >= 0),
  insurance_fee           DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (insurance_fee >= 0),
  cod_fee                 DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (cod_fee >= 0),
  remote_area_surcharge   DECIMAL(10,2)  NOT NULL DEFAULT 0 CHECK (remote_area_surcharge >= 0),
  subtotal                DECIMAL(10,2)  NOT NULL CHECK (subtotal >= 0),
  vat_rate                DECIMAL(4,2)   NOT NULL DEFAULT 5.00,
  vat_amount              DECIMAL(10,2)  NOT NULL CHECK (vat_amount >= 0),
  total_amount            DECIMAL(10,2)  NOT NULL CHECK (total_amount >= 0),

  -- Payment
  payment_method          TEXT           NOT NULL
                          CHECK (payment_method IN ('cash','card','bank_transfer','cod','online')),
  payment_status          TEXT           NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending','paid','partial','refunded')),

  -- Metadata
  created_by              UUID,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS bookings_tracking_id_idx     ON bookings (tracking_id);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_number_idx  ON bookings (booking_number);
CREATE        INDEX IF NOT EXISTS bookings_status_idx          ON bookings (status);
CREATE        INDEX IF NOT EXISTS bookings_sender_id_idx       ON bookings (sender_id) WHERE sender_id IS NOT NULL;
CREATE        INDEX IF NOT EXISTS bookings_sender_phone_idx    ON bookings (sender_phone);
CREATE        INDEX IF NOT EXISTS bookings_created_at_idx      ON bookings (created_at DESC);
CREATE        INDEX IF NOT EXISTS bookings_service_type_idx    ON bookings (service_type);

COMMENT ON TABLE  bookings IS 'Core shipment bookings — one row per parcel/shipment';
COMMENT ON COLUMN bookings.tracking_id    IS 'Public tracking ID in SCDDMM#### format';
COMMENT ON COLUMN bookings.vat_rate       IS 'UAE VAT rate — 5% as per FTA regulations';
COMMENT ON COLUMN bookings.declared_value IS 'Customer-declared value in AED for insurance / customs';
