-- ============================================================
-- seed.sql — SC Courier sample data
-- Run AFTER all migrations have been applied.
-- ============================================================
-- Usage:
--   supabase db reset   (applies migrations + seed automatically)
--   OR manually:
--   psql $DATABASE_URL -f supabase/seed.sql
-- ============================================================

BEGIN;

-- ── 1. Customers ─────────────────────────────────────────────────────────────
INSERT INTO customers (id, full_name, email, phone, phone_country_code, company_name,
                       trade_license_number, address_line_1, city, emirate, country)
VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'Ahmed Hassan Al Rashidi',
    'ahmed.hassan@logitech-uae.com',
    '0501234567',
    '+971',
    'LogiTech Solutions LLC',
    'TL-DXB-2021-88432',
    'Office 1404, Business Bay Tower',
    'Dubai',
    'Dubai',
    'UAE'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Sara Mohammed Al Zaabi',
    'sara@desertboutique.ae',
    '0507654321',
    '+971',
    'Desert Boutique FZE',
    'TL-ADH-2022-11209',
    'Shop 7, Al Reem Island Mall',
    'Abu Dhabi',
    'Abu Dhabi',
    'UAE'
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Khalid Saeed Al Mansoori',
    'khalid@gulftrade.ae',
    '0509988776',
    '+971',
    'Gulf Trade Group',
    NULL,
    'Warehouse 12, Sharjah Industrial Area',
    'Sharjah',
    'Sharjah',
    'UAE'
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. Bookings ──────────────────────────────────────────────────────────────
INSERT INTO bookings (
  id, booking_number, tracking_id, status,
  sender_id, sender_name, sender_phone, sender_email,
  sender_address, sender_city, sender_emirate, sender_country,
  receiver_name, receiver_phone, receiver_email,
  receiver_address, receiver_city, receiver_emirate, receiver_country,
  package_type, package_description, declared_value, weight_kg,
  number_of_pieces, is_fragile, requires_signature,
  service_type, pickup_requested, estimated_delivery,
  base_price, fuel_surcharge, insurance_fee,
  subtotal, vat_rate, vat_amount, total_amount,
  payment_method, payment_status, created_by
)
VALUES

  -- Booking 1: Delivered — Dubai → Abu Dhabi, express
  (
    '22222222-0000-0000-0000-000000000001',
    'SC-20240329-0001',
    'SC29030001',
    'delivered',
    '11111111-0000-0000-0000-000000000001',
    'Ahmed Hassan Al Rashidi', '0501234567', 'ahmed.hassan@logitech-uae.com',
    'Office 1404, Business Bay Tower', 'Dubai', 'Dubai', 'UAE',
    'Sara Mohammed Al Zaabi', '0507654321', 'sara@desertboutique.ae',
    'Shop 7, Al Reem Island Mall', 'Abu Dhabi', 'Abu Dhabi', 'UAE',
    'parcel', 'Electronic components — circuit boards', 2500.00, 3.5,
    1, FALSE, TRUE,
    'express', TRUE, '2024-03-30',
    55.00, 5.00, 50.00,
    110.00, 5.00, 5.50, 115.50,
    'card', 'paid', NULL
  ),

  -- Booking 2: Out for delivery — Sharjah → Dubai, same_day
  (
    '22222222-0000-0000-0000-000000000002',
    'SC-20240329-0002',
    'SC29030002',
    'out_for_delivery',
    '11111111-0000-0000-0000-000000000003',
    'Khalid Saeed Al Mansoori', '0509988776', 'khalid@gulftrade.ae',
    'Warehouse 12, Sharjah Industrial Area', 'Sharjah', 'Sharjah', 'UAE',
    'Ravi Nair', '0504455667', 'ravi@techparts-uae.com',
    'Office 302, DIFC Gate Village', 'Dubai', 'Dubai', 'UAE',
    'document', 'Signed contracts and trade documents', 500.00, 0.3,
    1, FALSE, TRUE,
    'same_day', FALSE, '2024-03-29',
    90.00, 5.00, 0.00,
    95.00, 5.00, 4.75, 99.75,
    'cash', 'paid', NULL
  ),

  -- Booking 3: In transit — Abu Dhabi → Dubai, standard
  (
    '22222222-0000-0000-0000-000000000003',
    'SC-20240329-0003',
    'SC29030003',
    'in_transit',
    '11111111-0000-0000-0000-000000000002',
    'Sara Mohammed Al Zaabi', '0507654321', 'sara@desertboutique.ae',
    'Shop 7, Al Reem Island Mall', 'Abu Dhabi', 'Abu Dhabi', 'UAE',
    'Fatima Al Zaabi', '0502233445', NULL,
    'Villa 22, Jumeirah Beach Road', 'Dubai', 'Dubai', 'UAE',
    'fragile', 'Handmade ceramic vases — FRAGILE', 1200.00, 4.8,
    3, TRUE, TRUE,
    'standard', TRUE, '2024-04-01',
    35.00, 5.00, 24.00,
    64.00, 5.00, 3.20, 67.20,
    'online', 'paid', NULL
  ),

  -- Booking 4: Pending — Dubai → Ajman, standard
  (
    '22222222-0000-0000-0000-000000000004',
    'SC-20240329-0004',
    'SC29030004',
    'pending',
    NULL,
    'Mohammed Al Falasi', '0553344556', NULL,
    'Apartment 1201, JBR Walk', 'Dubai', 'Dubai', 'UAE',
    'Layla Mahmoud', '0506677889', NULL,
    'House 5, Al Rashidiya', 'Ajman', 'Ajman', 'UAE',
    'parcel', 'Clothing and accessories', 800.00, 2.1,
    2, FALSE, FALSE,
    'standard', FALSE, '2024-04-02',
    35.00, 5.00, 0.00,
    40.00, 5.00, 2.00, 42.00,
    'cod', 'pending', NULL
  ),

  -- Booking 5: Returned — International Dubai → London
  (
    '22222222-0000-0000-0000-000000000005',
    'SC-20240328-0005',
    'SC28030005',
    'returned',
    '11111111-0000-0000-0000-000000000001',
    'Ahmed Hassan Al Rashidi', '0501234567', 'ahmed.hassan@logitech-uae.com',
    'Office 1404, Business Bay Tower', 'Dubai', 'Dubai', 'UAE',
    'James Wilson', '+442071234567', 'j.wilson@example.co.uk',
    '42 Baker Street', 'London', NULL, 'United Kingdom',
    'parcel', 'Industrial parts — returned to sender (recipient refused)', 5000.00, 8.2,
    1, FALSE, TRUE,
    'international', FALSE, '2024-04-05',
    120.00, 10.00, 100.00,
    230.00, 5.00, 11.50, 241.50,
    'bank_transfer', 'refunded', NULL
  )

ON CONFLICT (id) DO NOTHING;

-- ── 3. Tracking Events ────────────────────────────────────────────────────────

-- ── Booking 1 (SC29030001) — Delivered ───────────────────────────────────────
INSERT INTO tracking_events (
  id, booking_id, tracking_id, status, status_detail,
  location, facility_code, event_timestamp
)
VALUES
  (
    '33333333-0001-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'booked', 'Shipment booked online',
    'Dubai, UAE', NULL,
    '2024-03-29 09:00:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'confirmed', 'Booking confirmed — pickup scheduled for 11:00 AM',
    'Dubai, UAE', NULL,
    '2024-03-29 09:15:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'picked_up', 'Package collected from sender',
    'Business Bay, Dubai', 'HUB-DXB',
    '2024-03-29 11:32:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'received_at_origin', 'Package received at Dubai sorting facility',
    'Dubai Hub, Jebel Ali', 'HUB-DXB',
    '2024-03-29 13:10:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'in_transit', 'Package dispatched towards Abu Dhabi',
    'Dubai–Abu Dhabi Highway', 'HUB-DXB',
    '2024-03-29 14:00:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'arrived_at_destination', 'Package arrived at Abu Dhabi delivery facility',
    'Mussafah, Abu Dhabi', 'HUB-AUH',
    '2024-03-29 16:20:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000007',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'out_for_delivery', 'Package with delivery rider — out for delivery',
    'Al Reem Island, Abu Dhabi', 'HUB-AUH',
    '2024-03-30 09:05:00+04'
  ),
  (
    '33333333-0001-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000001', 'SC29030001',
    'delivered', 'Package delivered — signed by recipient',
    'Al Reem Island Mall, Abu Dhabi', 'HUB-AUH',
    '2024-03-30 11:47:00+04'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Booking 2 (SC29030002) — Out for delivery ─────────────────────────────────
INSERT INTO tracking_events (
  id, booking_id, tracking_id, status, status_detail,
  location, facility_code, event_timestamp
)
VALUES
  (
    '33333333-0002-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002', 'SC29030002',
    'booked', 'Shipment booked — same day service',
    'Sharjah, UAE', NULL,
    '2024-03-29 08:30:00+04'
  ),
  (
    '33333333-0002-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000002', 'SC29030002',
    'picked_up', 'Documents collected from sender in Sharjah Industrial Area',
    'Sharjah Industrial Area', 'HUB-SHJ',
    '2024-03-29 10:15:00+04'
  ),
  (
    '33333333-0002-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002', 'SC29030002',
    'in_transit', 'En route to Dubai DIFC',
    'Sharjah–Dubai Highway', 'HUB-SHJ',
    '2024-03-29 11:00:00+04'
  ),
  (
    '33333333-0002-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000002', 'SC29030002',
    'out_for_delivery', 'With rider — delivering to DIFC Gate Village',
    'DIFC, Dubai', 'HUB-DXB',
    '2024-03-29 12:30:00+04'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Booking 3 (SC29030003) — In transit ──────────────────────────────────────
INSERT INTO tracking_events (
  id, booking_id, tracking_id, status, status_detail,
  location, facility_code, event_timestamp
)
VALUES
  (
    '33333333-0003-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000003', 'SC29030003',
    'booked', 'Shipment booked — standard delivery',
    'Abu Dhabi, UAE', NULL,
    '2024-03-29 10:00:00+04'
  ),
  (
    '33333333-0003-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000003', 'SC29030003',
    'confirmed', 'Pickup confirmed for afternoon slot',
    'Abu Dhabi, UAE', NULL,
    '2024-03-29 10:30:00+04'
  ),
  (
    '33333333-0003-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000003', 'SC29030003',
    'picked_up', '3 fragile ceramic packages collected — packed securely',
    'Al Reem Island, Abu Dhabi', 'HUB-AUH',
    '2024-03-29 14:45:00+04'
  ),
  (
    '33333333-0003-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000003', 'SC29030003',
    'in_transit', 'Shipment in transit via Abu Dhabi–Dubai corridor',
    'Abu Dhabi–Dubai Highway', 'HUB-AUH',
    '2024-03-29 16:00:00+04'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Booking 4 (SC29030004) — Pending ─────────────────────────────────────────
INSERT INTO tracking_events (
  id, booking_id, tracking_id, status, status_detail,
  location, facility_code, event_timestamp
)
VALUES
  (
    '33333333-0004-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000004', 'SC29030004',
    'booked', 'Shipment booked — awaiting confirmation',
    'Dubai, UAE', NULL,
    '2024-03-29 17:00:00+04'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Booking 5 (SC28030005) — Returned ────────────────────────────────────────
INSERT INTO tracking_events (
  id, booking_id, tracking_id, status, status_detail,
  location, facility_code, event_timestamp
)
VALUES
  (
    '33333333-0005-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'booked', 'International shipment booked — Dubai to London',
    'Dubai, UAE', NULL,
    '2024-03-28 08:00:00+04'
  ),
  (
    '33333333-0005-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'picked_up', 'Package collected from Business Bay, Dubai',
    'Business Bay, Dubai', 'HUB-DXB',
    '2024-03-28 11:00:00+04'
  ),
  (
    '33333333-0005-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'at_hub', 'Package at Dubai International Airport facility',
    'Dubai International Airport', 'HUB-DXB-AIR',
    '2024-03-28 15:00:00+04'
  ),
  (
    '33333333-0005-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'customs_clearance', 'Package in UK customs clearance — Heathrow',
    'London Heathrow, UK', 'HUB-LHR',
    '2024-03-30 09:00:00+00'
  ),
  (
    '33333333-0005-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'on_hold', 'Delivery refused by recipient — contact sender for instructions',
    'London, UK', 'HUB-LHR',
    '2024-04-01 14:30:00+00'
  ),
  (
    '33333333-0005-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000005', 'SC28030005',
    'returned', 'Return to sender initiated — package dispatched back to Dubai',
    'London, UK', 'HUB-LHR',
    '2024-04-02 10:00:00+00'
  )
ON CONFLICT (id) DO NOTHING;

-- ── 4. Invoices ───────────────────────────────────────────────────────────────
INSERT INTO invoices (
  id, invoice_number, booking_id, tracking_id,
  company_name, company_trn, company_address, company_phone, company_email,
  customer_id, customer_name, customer_address, customer_phone, customer_email,
  customer_trn,
  line_items,
  subtotal, discount_amount, taxable_amount,
  vat_rate, vat_amount, total_amount, currency,
  payment_method, payment_status, payment_date,
  terms_and_conditions,
  qr_code_data, qr_verification_hash,
  issue_date, is_draft, is_cancelled
)
VALUES

  -- Invoice 1 for Booking 1 (delivered)
  (
    '44444444-0000-0000-0000-000000000001',
    'INV-202403-0001',
    '22222222-0000-0000-0000-000000000001',
    'SC29030001',
    'SC Courier LLC',
    '100123456780003',
    'Office 1204, Business Bay, Dubai, UAE',
    '+971 4 000 0000',
    'info@sccourier.com',
    '11111111-0000-0000-0000-000000000001',
    'Ahmed Hassan Al Rashidi',
    'Office 1404, Business Bay Tower, Dubai, UAE',
    '+971 50 123 4567',
    'ahmed.hassan@logitech-uae.com',
    'TL-DXB-2021-88432',
    '[
      {"item_name":"Express Courier Service","description":"Express Delivery — Dubai (Business Bay) to Abu Dhabi (Al Reem Island)","hsn_code":"9961","quantity":1,"unit_price":55.00,"total":55.00},
      {"item_name":"Fuel Surcharge","description":"Fuel surcharge (9.09% of base)","hsn_code":"9961","quantity":1,"unit_price":5.00,"total":5.00},
      {"item_name":"Shipment Insurance","description":"Package insurance — declared value AED 2,500","hsn_code":"9961","quantity":1,"unit_price":50.00,"total":50.00}
    ]'::jsonb,
    110.00, 0.00, 110.00,
    5.00, 5.50, 115.50, 'AED',
    'card', 'paid', '2024-03-29 09:20:00+04',
    '1. All shipments are subject to SC Courier standard terms. 2. Liability limited to declared value or AED 100, whichever is lower. 3. VAT charged at 5% per UAE FTA regulations.',
    'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEifQ',
    'sha256_placeholder_hash_001',
    '2024-03-29', FALSE, FALSE
  ),

  -- Invoice 2 for Booking 2 (out for delivery)
  (
    '44444444-0000-0000-0000-000000000002',
    'INV-202403-0002',
    '22222222-0000-0000-0000-000000000002',
    'SC29030002',
    'SC Courier LLC',
    '100123456780003',
    'Office 1204, Business Bay, Dubai, UAE',
    '+971 4 000 0000',
    'info@sccourier.com',
    '11111111-0000-0000-0000-000000000003',
    'Khalid Saeed Al Mansoori',
    'Warehouse 12, Sharjah Industrial Area, Sharjah, UAE',
    '+971 50 998 8776',
    'khalid@gulftrade.ae',
    NULL,
    '[
      {"item_name":"Same Day Courier Service","description":"Same Day Delivery — Sharjah (Industrial Area) to Dubai (DIFC)","hsn_code":"9961","quantity":1,"unit_price":90.00,"total":90.00},
      {"item_name":"Fuel Surcharge","description":"Fuel surcharge","hsn_code":"9961","quantity":1,"unit_price":5.00,"total":5.00}
    ]'::jsonb,
    95.00, 0.00, 95.00,
    5.00, 4.75, 99.75, 'AED',
    'cash', 'paid', '2024-03-29 08:35:00+04',
    '1. All shipments are subject to SC Courier standard terms. 2. VAT charged at 5% per UAE FTA regulations.',
    'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIifQ',
    'sha256_placeholder_hash_002',
    '2024-03-29', FALSE, FALSE
  ),

  -- Invoice 3 for Booking 5 (returned — refunded)
  (
    '44444444-0000-0000-0000-000000000003',
    'INV-202403-0003',
    '22222222-0000-0000-0000-000000000005',
    'SC28030005',
    'SC Courier LLC',
    '100123456780003',
    'Office 1204, Business Bay, Dubai, UAE',
    '+971 4 000 0000',
    'info@sccourier.com',
    '11111111-0000-0000-0000-000000000001',
    'Ahmed Hassan Al Rashidi',
    'Office 1404, Business Bay Tower, Dubai, UAE',
    '+971 50 123 4567',
    'ahmed.hassan@logitech-uae.com',
    'TL-DXB-2021-88432',
    '[
      {"item_name":"International Courier Service","description":"International Delivery — Dubai to London, UK","hsn_code":"9961","quantity":1,"unit_price":120.00,"total":120.00},
      {"item_name":"Fuel Surcharge","description":"International fuel surcharge","hsn_code":"9961","quantity":1,"unit_price":10.00,"total":10.00},
      {"item_name":"Shipment Insurance","description":"Package insurance — declared value AED 5,000","hsn_code":"9961","quantity":1,"unit_price":100.00,"total":100.00}
    ]'::jsonb,
    230.00, 0.00, 230.00,
    5.00, 11.50, 241.50, 'AED',
    'bank_transfer', 'refunded', '2024-03-28 08:10:00+04',
    '1. All shipments are subject to SC Courier standard terms. 2. Liability limited to declared value. 3. VAT charged at 5% per UAE FTA regulations. 4. Returns incur handling fees.',
    'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDMifQ',
    'sha256_placeholder_hash_003',
    '2024-03-28', FALSE, FALSE
  )

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ── Verify seed data ──────────────────────────────────────────────────────────
SELECT 'customers'       AS "table", COUNT(*)::TEXT AS rows FROM customers       UNION ALL
SELECT 'bookings',                   COUNT(*)::TEXT         FROM bookings         UNION ALL
SELECT 'tracking_events',            COUNT(*)::TEXT         FROM tracking_events  UNION ALL
SELECT 'invoices',                   COUNT(*)::TEXT         FROM invoices;
