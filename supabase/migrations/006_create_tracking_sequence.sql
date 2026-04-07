-- ============================================================
-- Migration 006: tracking_sequences table + atomic sequence function
-- ============================================================
-- Purpose: Guarantee unique SCDDMM#### tracking IDs with no race conditions.
-- The function uses UPDATE ... RETURNING with a row-level lock so concurrent
-- requests on the same date_prefix are serialised — no duplicates possible.
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_sequences (
  date_prefix   TEXT    PRIMARY KEY,   -- e.g. 'SC2903' (SC + DD + MM)
  current_value INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE  tracking_sequences IS 'Per-day counters for generating unique tracking IDs';
COMMENT ON COLUMN tracking_sequences.date_prefix   IS 'SC + 2-digit day + 2-digit month, e.g. SC2903';
COMMENT ON COLUMN tracking_sequences.current_value IS 'Last issued sequence number for this date prefix';

-- ── Atomic increment function ─────────────────────────────────────────────────
-- Returns the NEXT sequence number for the given date prefix.
-- Uses INSERT ... ON CONFLICT to initialise the row, then UPDATE with FOR UPDATE
-- to atomically bump and return the value. Safe under concurrent load.

CREATE OR REPLACE FUNCTION get_next_tracking_sequence(date_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER   -- runs as the table owner, bypasses RLS
AS $$
DECLARE
  next_val      INTEGER;
  v_date_prefix TEXT;          -- local alias; assigned from $1 to avoid 42702 column/parameter collision
BEGIN
  v_date_prefix := $1;         -- $1 (positional) is unambiguously the function parameter

  -- Insert the row if it doesn't exist yet (first booking of the day)
  INSERT INTO tracking_sequences (date_prefix, current_value)
  VALUES (v_date_prefix, 0)
  ON CONFLICT ON CONSTRAINT tracking_sequences_pkey DO NOTHING;

  -- Atomically increment and retrieve the new value
  UPDATE tracking_sequences
  SET    current_value = current_value + 1
  WHERE  tracking_sequences.date_prefix = v_date_prefix
  RETURNING current_value INTO next_val;

  RETURN next_val;
END;
$$;

COMMENT ON FUNCTION get_next_tracking_sequence(TEXT) IS
  'Atomically returns the next daily sequence number for tracking ID generation. Thread-safe.';

-- ── Example: generating a tracking ID in application code ────────────────────
-- SELECT get_next_tracking_sequence('SC2903');   -- returns 1 the first call
-- SELECT get_next_tracking_sequence('SC2903');   -- returns 2 the next call
-- Full ID: 'SC2903' || LPAD(result::TEXT, 4, '0')  → 'SC29030001'
