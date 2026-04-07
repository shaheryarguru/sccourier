-- ── Migration 013: Soft Delete Support for Bookings ──────────────────────────
-- Adds is_deleted, deleted_at, deleted_by columns to bookings table.
-- Soft-deleted bookings are hidden by default but restorable.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID;

-- Partial index: fast filtering of non-deleted bookings (the common case)
CREATE INDEX IF NOT EXISTS idx_bookings_not_deleted
  ON bookings (is_deleted)
  WHERE is_deleted = FALSE;

-- RLS: tracking_events remain readable even for soft-deleted bookings
-- (customers should still see tracking history via public tracking page)
-- No policy change needed — tracking_events already has "Public tracking read".

COMMENT ON COLUMN bookings.is_deleted IS
  'TRUE when soft-deleted by admin; hidden from default queries but recoverable';
COMMENT ON COLUMN bookings.deleted_at IS
  'Timestamp when the booking was soft-deleted';
COMMENT ON COLUMN bookings.deleted_by IS
  'UUID of the admin user who soft-deleted the booking';
