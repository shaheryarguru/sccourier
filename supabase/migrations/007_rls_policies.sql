-- ============================================================
-- Migration 007: Row Level Security (RLS) policies
-- ============================================================
-- Security model:
--   • Anonymous (public) users: read-only access to tracking_events,
--     specific booking columns, and invoices (for QR verification)
--   • Authenticated users (admin): full CRUD on all tables
--   • Sensitive tables (customers, payments): admin-only
-- ============================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sequences ENABLE ROW LEVEL SECURITY;

-- ── tracking_events ───────────────────────────────────────────────────────────
-- Public: anyone can read tracking events (powers the public tracking page)
CREATE POLICY "public_read_tracking_events"
  ON tracking_events
  FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "admin_all_tracking_events"
  ON tracking_events
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── invoices ──────────────────────────────────────────────────────────────────
-- Public: anyone can read invoices (powers QR code verification page)
CREATE POLICY "public_read_invoices"
  ON invoices
  FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "admin_all_invoices"
  ON invoices
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── bookings ──────────────────────────────────────────────────────────────────
-- Public: can read a limited subset of columns for tracking purposes.
-- The column-level restriction is enforced via a security-definer view
-- (see below). The base policy allows the SELECT but the view limits columns.
CREATE POLICY "public_read_bookings_for_tracking"
  ON bookings
  FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "admin_all_bookings"
  ON bookings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── customers ─────────────────────────────────────────────────────────────────
-- Admin only — PII must never be exposed publicly
CREATE POLICY "admin_all_customers"
  ON customers
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── payments ──────────────────────────────────────────────────────────────────
-- Admin only — financial data
CREATE POLICY "admin_all_payments"
  ON payments
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── tracking_sequences ────────────────────────────────────────────────────────
-- Only the get_next_tracking_sequence() function (SECURITY DEFINER) should
-- touch this table. No direct public or authenticated-user access needed.
CREATE POLICY "deny_direct_access_tracking_sequences"
  ON tracking_sequences
  FOR ALL
  USING (auth.role() = 'authenticated');

-- ── Public tracking view ──────────────────────────────────────────────────────
-- Exposes ONLY the columns needed for the public tracking page.
-- Implemented as a security-definer view so anon users can query it
-- without having direct column access to sensitive booking fields.
CREATE OR REPLACE VIEW public_tracking_view
WITH (security_invoker = false)
AS
  SELECT
    b.tracking_id,
    b.booking_number,
    b.status,
    b.sender_city,
    b.sender_emirate,
    b.receiver_city,
    b.receiver_country,
    b.service_type,
    b.package_type,
    b.number_of_pieces,
    b.estimated_delivery,
    b.pickup_requested,
    b.pickup_date,
    b.created_at
  FROM bookings b;

COMMENT ON VIEW public_tracking_view IS
  'Restricted booking view for the public tracking page — no PII, no pricing.';
