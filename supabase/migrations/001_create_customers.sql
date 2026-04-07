-- ============================================================
-- Migration 001: customers table
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            TEXT        NOT NULL,
  email                TEXT        UNIQUE,
  phone                TEXT        NOT NULL,
  phone_country_code   TEXT        NOT NULL DEFAULT '+971',
  emirates_id          TEXT,
  company_name         TEXT,
  trade_license_number TEXT,
  address_line_1       TEXT        NOT NULL,
  address_line_2       TEXT,
  city                 TEXT        NOT NULL,
  emirate              TEXT        NOT NULL,
  country              TEXT        NOT NULL DEFAULT 'UAE',
  postal_code          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS customers_email_idx  ON customers (email)  WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_phone_idx  ON customers (phone);
CREATE INDEX IF NOT EXISTS customers_emirate_idx ON customers (emirate);

COMMENT ON TABLE  customers IS 'SC Courier customer records';
COMMENT ON COLUMN customers.emirates_id          IS 'UAE National ID (optional)';
COMMENT ON COLUMN customers.trade_license_number IS 'UAE trade license number for B2B customers';
COMMENT ON COLUMN customers.emirate              IS 'One of the seven UAE emirates';
