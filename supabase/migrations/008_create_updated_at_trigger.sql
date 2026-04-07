-- ============================================================
-- Migration 008: auto-update updated_at trigger
-- ============================================================

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_set_updated_at() IS
  'Sets updated_at to NOW() on every UPDATE. Attach to any table with an updated_at column.';

-- ── Apply to tables with updated_at ──────────────────────────────────────────

CREATE OR REPLACE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Immutability guard for tracking_events ────────────────────────────────────
-- tracking_events is an append-only audit log — updates should never happen.
CREATE OR REPLACE FUNCTION prevent_tracking_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'tracking_events is append-only. Create a new event instead of updating id=%.', OLD.id;
END;
$$;

CREATE OR REPLACE TRIGGER enforce_tracking_events_immutable
  BEFORE UPDATE ON tracking_events
  FOR EACH ROW EXECUTE FUNCTION prevent_tracking_event_update();

-- ── Immutability guard for invoices ──────────────────────────────────────────
-- Once an invoice is issued (is_draft = FALSE), its financial data must not change.
-- Only administrative fields (payment_status, pdf_url, is_cancelled, notes,
-- cancelled_reason, updated_at) are allowed to change.
CREATE OR REPLACE FUNCTION prevent_invoice_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip the check while invoice is still a draft
  IF OLD.is_draft = TRUE THEN
    RETURN NEW;
  END IF;

  -- Enforce immutability of financial fields once issued
  IF (
    NEW.invoice_number      IS DISTINCT FROM OLD.invoice_number     OR
    NEW.booking_id          IS DISTINCT FROM OLD.booking_id         OR
    NEW.tracking_id         IS DISTINCT FROM OLD.tracking_id        OR
    NEW.subtotal            IS DISTINCT FROM OLD.subtotal           OR
    NEW.vat_amount          IS DISTINCT FROM OLD.vat_amount         OR
    NEW.total_amount        IS DISTINCT FROM OLD.total_amount       OR
    NEW.line_items          IS DISTINCT FROM OLD.line_items         OR
    NEW.qr_code_data        IS DISTINCT FROM OLD.qr_code_data       OR
    NEW.qr_verification_hash IS DISTINCT FROM OLD.qr_verification_hash OR
    NEW.issue_date          IS DISTINCT FROM OLD.issue_date         OR
    NEW.company_trn         IS DISTINCT FROM OLD.company_trn
  ) THEN
    RAISE EXCEPTION
      'Invoice % has been issued and its financial data cannot be modified. Cancel and reissue instead.',
      OLD.invoice_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER enforce_invoice_immutability
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION prevent_invoice_tampering();
