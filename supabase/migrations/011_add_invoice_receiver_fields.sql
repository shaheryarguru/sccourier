-- ============================================================
-- Migration 011: Add receiver fields + supply_date + amount_in_words to invoices
-- These fields denormalise receiver data from the booking for immutable records
-- and add UAE FTA supply date and amount-in-words for compliance.
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS receiver_name      TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone     TEXT,
  ADD COLUMN IF NOT EXISTS receiver_email     TEXT,
  ADD COLUMN IF NOT EXISTS receiver_address   TEXT,
  ADD COLUMN IF NOT EXISTS receiver_city      TEXT,
  ADD COLUMN IF NOT EXISTS receiver_emirate   TEXT,
  ADD COLUMN IF NOT EXISTS receiver_country   TEXT,
  ADD COLUMN IF NOT EXISTS supply_date        DATE,
  ADD COLUMN IF NOT EXISTS amount_in_words    TEXT;

COMMENT ON COLUMN invoices.receiver_name    IS 'Shipment receiver name (denormalised from booking)';
COMMENT ON COLUMN invoices.receiver_phone   IS 'Shipment receiver phone (denormalised from booking)';
COMMENT ON COLUMN invoices.receiver_email   IS 'Shipment receiver email (denormalised from booking)';
COMMENT ON COLUMN invoices.receiver_address IS 'Shipment receiver full address (denormalised from booking)';
COMMENT ON COLUMN invoices.receiver_city    IS 'Shipment receiver city';
COMMENT ON COLUMN invoices.receiver_emirate IS 'Shipment receiver emirate (UAE) or state/province';
COMMENT ON COLUMN invoices.receiver_country IS 'Shipment receiver country';
COMMENT ON COLUMN invoices.supply_date      IS 'Date of supply (pickup_date or booking date) — UAE FTA Article 59 requirement';
COMMENT ON COLUMN invoices.amount_in_words  IS 'Total amount written in English words — common UAE invoice practice';
