-- ============================================================
-- Migration 004: invoices table (UAE FTA compliant)
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT          UNIQUE NOT NULL,
  booking_id            UUID          REFERENCES bookings(id) ON DELETE SET NULL,
  tracking_id           TEXT          NOT NULL,

  -- SC Courier company details (denormalised for immutability)
  company_name          TEXT          NOT NULL DEFAULT 'SC Courier LLC',
  company_trn           TEXT          NOT NULL,
  company_address       TEXT          NOT NULL,
  company_phone         TEXT          NOT NULL,
  company_email         TEXT          NOT NULL,
  company_logo_url      TEXT,

  -- Customer details (denormalised)
  customer_id           UUID          REFERENCES customers(id) ON DELETE SET NULL,
  customer_name         TEXT          NOT NULL,
  customer_trn          TEXT,
  customer_address      TEXT          NOT NULL,
  customer_phone        TEXT          NOT NULL,
  customer_email        TEXT,

  -- Line items stored as JSONB array
  -- Each element: { description, item_name, hsn_code, quantity, unit_price, total }
  line_items            JSONB         NOT NULL DEFAULT '[]'::jsonb,

  -- Pricing (AED)
  subtotal              DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_reason       TEXT,
  taxable_amount        DECIMAL(12,2) NOT NULL CHECK (taxable_amount >= 0),
  vat_rate              DECIMAL(4,2)  NOT NULL DEFAULT 5.00,
  vat_amount            DECIMAL(12,2) NOT NULL CHECK (vat_amount >= 0),
  total_amount          DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  currency              TEXT          NOT NULL DEFAULT 'AED',

  -- Payment
  payment_method        TEXT          NOT NULL,
  payment_status        TEXT          NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid','paid','partial','overdue','refunded')),
  payment_date          TIMESTAMPTZ,
  payment_reference     TEXT,

  -- UAE FTA mandated terms & conditions
  terms_and_conditions  TEXT          NOT NULL,

  -- QR verification (HMAC-SHA256 signed payload)
  qr_code_data          TEXT          NOT NULL,
  qr_verification_hash  TEXT          NOT NULL,
  digital_signature     TEXT,

  -- Lifecycle
  issue_date            DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date              DATE,
  notes                 TEXT,
  is_draft              BOOLEAN       NOT NULL DEFAULT FALSE,
  is_cancelled          BOOLEAN       NOT NULL DEFAULT FALSE,
  cancelled_reason      TEXT,
  pdf_url               TEXT,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_idx  ON invoices (invoice_number);
CREATE        INDEX IF NOT EXISTS invoices_booking_id_idx      ON invoices (booking_id) WHERE booking_id IS NOT NULL;
CREATE        INDEX IF NOT EXISTS invoices_tracking_id_idx     ON invoices (tracking_id);
CREATE        INDEX IF NOT EXISTS invoices_customer_id_idx     ON invoices (customer_id) WHERE customer_id IS NOT NULL;
CREATE        INDEX IF NOT EXISTS invoices_payment_status_idx  ON invoices (payment_status);
CREATE        INDEX IF NOT EXISTS invoices_issue_date_idx      ON invoices (issue_date DESC);
-- GIN index for JSONB line_items (for full-text search across item descriptions)
CREATE        INDEX IF NOT EXISTS invoices_line_items_gin_idx  ON invoices USING GIN (line_items);

COMMENT ON TABLE  invoices IS 'UAE FTA-compliant tax invoices. Immutable once issued (cancelled only).';
COMMENT ON COLUMN invoices.company_trn          IS 'SC Courier UAE Tax Registration Number';
COMMENT ON COLUMN invoices.customer_trn         IS 'Customer TRN for B2B invoices';
COMMENT ON COLUMN invoices.line_items           IS 'JSONB array of invoice line items with HSN codes';
COMMENT ON COLUMN invoices.qr_code_data         IS 'Base64url-encoded JSON payload for QR verification';
COMMENT ON COLUMN invoices.qr_verification_hash IS 'HMAC-SHA256 signature of qr_code_data';
COMMENT ON COLUMN invoices.vat_rate             IS 'UAE VAT rate — 5% per FTA regulations';
