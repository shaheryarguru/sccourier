-- ============================================================
-- Migration 005: payments table
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID          REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_id        UUID          REFERENCES invoices(id) ON DELETE SET NULL,
  amount            DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency          TEXT          NOT NULL DEFAULT 'AED',
  payment_method    TEXT          NOT NULL
                    CHECK (payment_method IN ('cash','card','bank_transfer','cod','online')),
  transaction_id    TEXT,
  gateway_response  JSONB,
  status            TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','partial','refunded','failed')),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS payments_booking_id_idx    ON payments (booking_id)   WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_invoice_id_idx    ON payments (invoice_id)   WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_status_idx        ON payments (status);
CREATE INDEX IF NOT EXISTS payments_transaction_id_idx ON payments (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_created_at_idx    ON payments (created_at DESC);

COMMENT ON TABLE  payments IS 'Payment records — one row per payment attempt or transaction';
COMMENT ON COLUMN payments.gateway_response IS 'Raw JSON response from payment gateway (Stripe/PayTabs)';
COMMENT ON COLUMN payments.transaction_id   IS 'External payment gateway transaction reference';
