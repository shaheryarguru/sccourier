-- ============================================================
-- Migration 003: tracking_events table
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_events (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tracking_id           TEXT        NOT NULL,
  status                TEXT        NOT NULL
                        CHECK (status IN (
                          'booked','confirmed','picked_up','received_at_origin',
                          'in_transit','at_hub','customs_clearance','cleared_customs',
                          'arrived_at_destination','out_for_delivery','delivery_attempted',
                          'delivered','returned','on_hold','cancelled','pending'
                        )),
  status_detail         TEXT,
  location              TEXT,
  location_coordinates  POINT,
  facility_code         TEXT,
  updated_by            UUID,
  notes                 TEXT,
  photo_url             TEXT,
  signature_url         TEXT,
  event_timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes — tracking_id is queried constantly (public tracking page)
CREATE INDEX IF NOT EXISTS tracking_events_tracking_id_idx        ON tracking_events (tracking_id);
CREATE INDEX IF NOT EXISTS tracking_events_booking_id_idx         ON tracking_events (booking_id);
CREATE INDEX IF NOT EXISTS tracking_events_event_timestamp_idx    ON tracking_events (event_timestamp DESC);
CREATE INDEX IF NOT EXISTS tracking_events_tracking_timestamp_idx ON tracking_events (tracking_id, event_timestamp DESC);

COMMENT ON TABLE  tracking_events IS 'Immutable audit log of every status change for a shipment';
COMMENT ON COLUMN tracking_events.facility_code         IS 'Internal hub codes e.g. HUB-DXB, HUB-AUH';
COMMENT ON COLUMN tracking_events.location_coordinates  IS 'PostGIS POINT (lon lat) for map display';
COMMENT ON COLUMN tracking_events.photo_url             IS 'Proof-of-delivery photo (Cloudflare Images URL)';
COMMENT ON COLUMN tracking_events.signature_url         IS 'Delivery signature image (Cloudflare Images URL)';
