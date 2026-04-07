-- ============================================================
-- Migration 010: Definitive fix for get_next_tracking_sequence ambiguity
-- ============================================================
-- Migration 009 used `v_date_prefix TEXT := date_prefix` in DECLARE and
-- `ON CONFLICT (date_prefix)` — both still reference the ambiguous name.
--
-- This migration eliminates ALL bare references to `date_prefix` inside the
-- function body:
--   • Assigns parameter to local var via $1 (positional — always unambiguous)
--   • Uses ON CONFLICT ON CONSTRAINT tracking_sequences_pkey (no column name)
--   • WHERE clause uses only the local variable v_date_prefix
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_tracking_sequence(date_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val      INTEGER;
  v_date_prefix TEXT;
BEGIN
  v_date_prefix := $1;   -- positional: unambiguously the function parameter

  INSERT INTO tracking_sequences (date_prefix, current_value)
  VALUES (v_date_prefix, 0)
  ON CONFLICT ON CONSTRAINT tracking_sequences_pkey DO NOTHING;

  UPDATE tracking_sequences
  SET    current_value = current_value + 1
  WHERE  tracking_sequences.date_prefix = v_date_prefix
  RETURNING current_value INTO next_val;

  RETURN next_val;
END;
$$;

COMMENT ON FUNCTION get_next_tracking_sequence(TEXT) IS
  'Atomically returns the next daily sequence number for tracking ID generation. Thread-safe.';
