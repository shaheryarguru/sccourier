-- ============================================================
-- Migration 009: Fix ambiguous column reference in get_next_tracking_sequence
-- ============================================================
-- Root cause: the function parameter `date_prefix` shares its name with the
-- `tracking_sequences.date_prefix` column. PostgreSQL raises error 42702
-- ("column reference is ambiguous") in both the VALUES clause and the WHERE
-- clause of the UPDATE.
--
-- Fix strategy:
--   1. Capture the parameter into a local variable via $1 (positional, always
--      unambiguous) rather than by name in the assignment.
--   2. Use ON CONFLICT ON CONSTRAINT … instead of ON CONFLICT (date_prefix) so
--      the conflict target is identified by constraint name, not column name.
--   3. Use the local variable v_date_prefix everywhere in the body — no bare
--      `date_prefix` reference that could be mistaken for the column.
-- ============================================================

CREATE OR REPLACE FUNCTION get_next_tracking_sequence(date_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val      INTEGER;
  v_date_prefix TEXT;          -- local alias; assigned from $1 (positional) below
BEGIN
  v_date_prefix := $1;         -- $1 always refers to the first parameter unambiguously

  -- Initialise the row if this is the first booking for the date prefix
  INSERT INTO tracking_sequences (date_prefix, current_value)
  VALUES (v_date_prefix, 0)
  ON CONFLICT ON CONSTRAINT tracking_sequences_pkey DO NOTHING;

  -- Atomically increment and retrieve the new sequence value
  UPDATE tracking_sequences
  SET    current_value = current_value + 1
  WHERE  tracking_sequences.date_prefix = v_date_prefix
  RETURNING current_value INTO next_val;

  RETURN next_val;
END;
$$;

COMMENT ON FUNCTION get_next_tracking_sequence(TEXT) IS
  'Atomically returns the next daily sequence number for tracking ID generation. Thread-safe.';
