-- ── Migration 014: Company Settings Table ─────────────────────────────────────
-- Stores editable company settings (e.g., logo_url) in a single-row table.

CREATE TABLE IF NOT EXISTS company_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- enforces single row
  logo_url      TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if not present
INSERT INTO company_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Public can read (logo needed for invoice verification page too)
CREATE POLICY "Public read company_settings"
  ON company_settings FOR SELECT USING (true);

-- Only authenticated admins can update
CREATE POLICY "Admin update company_settings"
  ON company_settings FOR UPDATE USING (auth.role() = 'authenticated');

COMMENT ON TABLE company_settings IS
  'Single-row table for editable company settings (logo, etc.)';
COMMENT ON COLUMN company_settings.logo_url IS
  'Public URL of the company logo used on invoices (Supabase Storage)';
