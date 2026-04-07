-- ── Migration 012: Backdating & Admin Override Support ─────────────────────────
-- Adds audit trail, backdating, custom event, and delivery proof columns
-- to tracking_events; adds discount columns to bookings.

-- ── tracking_events additions ─────────────────────────────────────────────────

-- Backdating audit trail
ALTER TABLE tracking_events
  ADD COLUMN IF NOT EXISTS is_backdated        BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_timestamp  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS modified_by         UUID,
  ADD COLUMN IF NOT EXISTS modification_reason TEXT;

-- Delivery proof extras
ALTER TABLE tracking_events
  ADD COLUMN IF NOT EXISTS delivered_to   TEXT,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Custom / free-form events (do not change booking status)
ALTER TABLE tracking_events
  ADD COLUMN IF NOT EXISTS is_custom_event    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_event_label TEXT;

-- ── bookings additions ────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tracking_events_backdated
  ON tracking_events (is_backdated)
  WHERE is_backdated = TRUE;

CREATE INDEX IF NOT EXISTS idx_tracking_events_custom
  ON tracking_events (is_custom_event)
  WHERE is_custom_event = TRUE;

-- ── Comment ───────────────────────────────────────────────────────────────────
COMMENT ON COLUMN tracking_events.is_backdated IS
  'TRUE when the event_timestamp was manually set by an admin (not NOW())';
COMMENT ON COLUMN tracking_events.original_timestamp IS
  'The server time when the record was actually inserted (audit trail)';
COMMENT ON COLUMN tracking_events.is_custom_event IS
  'TRUE for free-form admin notes that do not change the booking status';
