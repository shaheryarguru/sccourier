-- Migration 016: Store editable pricing in company_settings

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS price_standard      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_express       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_same_day      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_international NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_intra_standard  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_intra_express   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_intra_same_day  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fuel_surcharge      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cod_fee             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS insurance_rate      NUMERIC(6,4),
  ADD COLUMN IF NOT EXISTS remote_area_surcharge NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS weight_rate_per_kg  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS weight_free_kg      NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS min_cancel_fee      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS redelivery_fee      NUMERIC(10,2);
