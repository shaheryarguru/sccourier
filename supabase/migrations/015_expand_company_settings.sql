-- Migration 015: Expand company_settings with editable company info, bank details, and T&C

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS company_name     TEXT,
  ADD COLUMN IF NOT EXISTS company_trn      TEXT,
  ADD COLUMN IF NOT EXISTS company_address  TEXT,
  ADD COLUMN IF NOT EXISTS company_phone    TEXT,
  ADD COLUMN IF NOT EXISTS company_email    TEXT,
  ADD COLUMN IF NOT EXISTS company_website  TEXT,
  ADD COLUMN IF NOT EXISTS bank_name        TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_no  TEXT,
  ADD COLUMN IF NOT EXISTS bank_iban        TEXT,
  ADD COLUMN IF NOT EXISTS bank_swift       TEXT,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

COMMENT ON TABLE company_settings IS 'Single-row company configuration editable from admin panel';
