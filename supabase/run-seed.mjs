/**
 * run-seed.mjs
 * Seeds the remote Supabase database using the service-role client.
 * Run once: node supabase/run-seed.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local manually (no dotenv dependency needed)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  process.env[key] = val;
}

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Seed data ─────────────────────────────────────────────────────────────────

async function seedCustomers() {
  const { error } = await supabase.from('customers').upsert([
    {
      id: '11111111-0000-0000-0000-000000000001',
      full_name: 'Ahmed Hassan Al Rashidi',
      email: 'ahmed.hassan@logitech-uae.com',
      phone: '0501234567',
      phone_country_code: '+971',
      company_name: 'LogiTech Solutions LLC',
      trade_license_number: 'TL-DXB-2021-88432',
      address_line_1: 'Office 1404, Business Bay Tower',
      city: 'Dubai',
      emirate: 'Dubai',
      country: 'UAE',
    },
    {
      id: '11111111-0000-0000-0000-000000000002',
      full_name: 'Sara Mohammed Al Zaabi',
      email: 'sara@desertboutique.ae',
      phone: '0507654321',
      phone_country_code: '+971',
      company_name: 'Desert Boutique FZE',
      trade_license_number: 'TL-ADH-2022-11209',
      address_line_1: 'Shop 7, Al Reem Island Mall',
      city: 'Abu Dhabi',
      emirate: 'Abu Dhabi',
      country: 'UAE',
    },
    {
      id: '11111111-0000-0000-0000-000000000003',
      full_name: 'Khalid Saeed Al Mansoori',
      email: 'khalid@gulftrade.ae',
      phone: '0509988776',
      phone_country_code: '+971',
      company_name: 'Gulf Trade Group',
      address_line_1: 'Warehouse 12, Sharjah Industrial Area',
      city: 'Sharjah',
      emirate: 'Sharjah',
      country: 'UAE',
    },
  ], { onConflict: 'id' });
  if (error) throw new Error(`customers: ${error.message}`);
  console.log('✓ customers (3 rows)');
}

async function seedBookings() {
  const { error } = await supabase.from('bookings').upsert([
    {
      id: '22222222-0000-0000-0000-000000000001',
      booking_number: 'SCC-20240329-0001',
      tracking_id: 'SC29030001',
      status: 'delivered',
      sender_id: '11111111-0000-0000-0000-000000000001',
      sender_name: 'Ahmed Hassan Al Rashidi',
      sender_phone: '0501234567',
      sender_email: 'ahmed.hassan@logitech-uae.com',
      sender_address: 'Office 1404, Business Bay Tower',
      sender_city: 'Dubai',
      sender_emirate: 'Dubai',
      sender_country: 'UAE',
      receiver_name: 'Sara Mohammed Al Zaabi',
      receiver_phone: '0507654321',
      receiver_email: 'sara@desertboutique.ae',
      receiver_address: 'Shop 7, Al Reem Island Mall',
      receiver_city: 'Abu Dhabi',
      receiver_emirate: 'Abu Dhabi',
      receiver_country: 'UAE',
      package_type: 'parcel',
      package_description: 'Electronic components — circuit boards',
      declared_value: 2500.00,
      weight_kg: 3.5,
      number_of_pieces: 1,
      is_fragile: false,
      requires_signature: true,
      service_type: 'express',
      pickup_requested: true,
      estimated_delivery: '2024-03-30',
      base_price: 55.00,
      fuel_surcharge: 5.00,
      insurance_fee: 50.00,
      subtotal: 110.00,
      vat_rate: 5.00,
      vat_amount: 5.50,
      total_amount: 115.50,
      payment_method: 'card',
      payment_status: 'paid',
    },
    {
      id: '22222222-0000-0000-0000-000000000002',
      booking_number: 'SCC-20240329-0002',
      tracking_id: 'SC29030002',
      status: 'out_for_delivery',
      sender_id: '11111111-0000-0000-0000-000000000003',
      sender_name: 'Khalid Saeed Al Mansoori',
      sender_phone: '0509988776',
      sender_email: 'khalid@gulftrade.ae',
      sender_address: 'Warehouse 12, Sharjah Industrial Area',
      sender_city: 'Sharjah',
      sender_emirate: 'Sharjah',
      sender_country: 'UAE',
      receiver_name: 'Ravi Nair',
      receiver_phone: '0504455667',
      receiver_email: 'ravi@techparts-uae.com',
      receiver_address: 'Office 302, DIFC Gate Village',
      receiver_city: 'Dubai',
      receiver_emirate: 'Dubai',
      receiver_country: 'UAE',
      package_type: 'document',
      package_description: 'Signed contracts and trade documents',
      declared_value: 500.00,
      weight_kg: 0.3,
      number_of_pieces: 1,
      is_fragile: false,
      requires_signature: true,
      service_type: 'same_day',
      pickup_requested: false,
      estimated_delivery: '2024-03-29',
      base_price: 90.00,
      fuel_surcharge: 5.00,
      insurance_fee: 0.00,
      subtotal: 95.00,
      vat_rate: 5.00,
      vat_amount: 4.75,
      total_amount: 99.75,
      payment_method: 'cash',
      payment_status: 'paid',
    },
    {
      id: '22222222-0000-0000-0000-000000000003',
      booking_number: 'SCC-20240329-0003',
      tracking_id: 'SC29030003',
      status: 'in_transit',
      sender_id: '11111111-0000-0000-0000-000000000002',
      sender_name: 'Sara Mohammed Al Zaabi',
      sender_phone: '0507654321',
      sender_email: 'sara@desertboutique.ae',
      sender_address: 'Shop 7, Al Reem Island Mall',
      sender_city: 'Abu Dhabi',
      sender_emirate: 'Abu Dhabi',
      sender_country: 'UAE',
      receiver_name: 'Fatima Al Zaabi',
      receiver_phone: '0502233445',
      receiver_address: 'Villa 22, Jumeirah Beach Road',
      receiver_city: 'Dubai',
      receiver_emirate: 'Dubai',
      receiver_country: 'UAE',
      package_type: 'fragile',
      package_description: 'Handmade ceramic vases — FRAGILE',
      declared_value: 1200.00,
      weight_kg: 4.8,
      number_of_pieces: 3,
      is_fragile: true,
      requires_signature: true,
      service_type: 'standard',
      pickup_requested: true,
      estimated_delivery: '2024-04-01',
      base_price: 35.00,
      fuel_surcharge: 5.00,
      insurance_fee: 24.00,
      subtotal: 64.00,
      vat_rate: 5.00,
      vat_amount: 3.20,
      total_amount: 67.20,
      payment_method: 'online',
      payment_status: 'paid',
    },
    {
      id: '22222222-0000-0000-0000-000000000004',
      booking_number: 'SCC-20240329-0004',
      tracking_id: 'SC29030004',
      status: 'pending',
      sender_name: 'Mohammed Al Falasi',
      sender_phone: '0553344556',
      sender_address: 'Apartment 1201, JBR Walk',
      sender_city: 'Dubai',
      sender_emirate: 'Dubai',
      sender_country: 'UAE',
      receiver_name: 'Layla Mahmoud',
      receiver_phone: '0506677889',
      receiver_address: 'House 5, Al Rashidiya',
      receiver_city: 'Ajman',
      receiver_emirate: 'Ajman',
      receiver_country: 'UAE',
      package_type: 'parcel',
      package_description: 'Clothing and accessories',
      declared_value: 800.00,
      weight_kg: 2.1,
      number_of_pieces: 2,
      is_fragile: false,
      requires_signature: false,
      service_type: 'standard',
      pickup_requested: false,
      estimated_delivery: '2024-04-02',
      base_price: 35.00,
      fuel_surcharge: 5.00,
      insurance_fee: 0.00,
      subtotal: 40.00,
      vat_rate: 5.00,
      vat_amount: 2.00,
      total_amount: 42.00,
      payment_method: 'cod',
      payment_status: 'pending',
    },
    {
      id: '22222222-0000-0000-0000-000000000005',
      booking_number: 'SCC-20240328-0005',
      tracking_id: 'SC28030005',
      status: 'returned',
      sender_id: '11111111-0000-0000-0000-000000000001',
      sender_name: 'Ahmed Hassan Al Rashidi',
      sender_phone: '0501234567',
      sender_email: 'ahmed.hassan@logitech-uae.com',
      sender_address: 'Office 1404, Business Bay Tower',
      sender_city: 'Dubai',
      sender_emirate: 'Dubai',
      sender_country: 'UAE',
      receiver_name: 'James Wilson',
      receiver_phone: '+442071234567',
      receiver_email: 'j.wilson@example.co.uk',
      receiver_address: '42 Baker Street',
      receiver_city: 'London',
      receiver_country: 'United Kingdom',
      package_type: 'parcel',
      package_description: 'Industrial parts — returned to sender (recipient refused)',
      declared_value: 5000.00,
      weight_kg: 8.2,
      number_of_pieces: 1,
      is_fragile: false,
      requires_signature: true,
      service_type: 'international',
      pickup_requested: false,
      estimated_delivery: '2024-04-05',
      base_price: 120.00,
      fuel_surcharge: 10.00,
      insurance_fee: 100.00,
      subtotal: 230.00,
      vat_rate: 5.00,
      vat_amount: 11.50,
      total_amount: 241.50,
      payment_method: 'bank_transfer',
      payment_status: 'refunded',
    },
  ], { onConflict: 'id' });
  if (error) throw new Error(`bookings: ${error.message}`);
  console.log('✓ bookings (5 rows)');
}

async function seedTrackingEvents() {
  const events = [
    // SC29030001 — Delivered (8 events)
    { id: '33333333-0001-0000-0000-000000000001', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'booked',                 status_detail: 'Shipment booked online',                                    location: 'Dubai, UAE',                event_timestamp: '2024-03-29T05:00:00Z' },
    { id: '33333333-0001-0000-0000-000000000002', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'confirmed',              status_detail: 'Booking confirmed — pickup scheduled for 11:00 AM',          location: 'Dubai, UAE',                event_timestamp: '2024-03-29T05:15:00Z' },
    { id: '33333333-0001-0000-0000-000000000003', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'picked_up',              status_detail: 'Package collected from sender',                              location: 'Business Bay, Dubai',       facility_code: 'HUB-DXB', event_timestamp: '2024-03-29T07:32:00Z' },
    { id: '33333333-0001-0000-0000-000000000004', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'received_at_origin',     status_detail: 'Package received at Dubai sorting facility',                 location: 'Dubai Hub, Jebel Ali',      facility_code: 'HUB-DXB', event_timestamp: '2024-03-29T09:10:00Z' },
    { id: '33333333-0001-0000-0000-000000000005', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'in_transit',             status_detail: 'Package dispatched towards Abu Dhabi',                       location: 'Dubai–Abu Dhabi Highway',   facility_code: 'HUB-DXB', event_timestamp: '2024-03-29T10:00:00Z' },
    { id: '33333333-0001-0000-0000-000000000006', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'arrived_at_destination', status_detail: 'Package arrived at Abu Dhabi delivery facility',              location: 'Mussafah, Abu Dhabi',       facility_code: 'HUB-AUH', event_timestamp: '2024-03-29T12:20:00Z' },
    { id: '33333333-0001-0000-0000-000000000007', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'out_for_delivery',       status_detail: 'Package with delivery rider — out for delivery',              location: 'Al Reem Island, Abu Dhabi', facility_code: 'HUB-AUH', event_timestamp: '2024-03-30T05:05:00Z' },
    { id: '33333333-0001-0000-0000-000000000008', booking_id: '22222222-0000-0000-0000-000000000001', tracking_id: 'SC29030001', status: 'delivered',              status_detail: 'Package delivered — signed by recipient',                    location: 'Al Reem Island Mall, Abu Dhabi', facility_code: 'HUB-AUH', event_timestamp: '2024-03-30T07:47:00Z' },
    // SC29030002 — Out for delivery (4 events)
    { id: '33333333-0002-0000-0000-000000000001', booking_id: '22222222-0000-0000-0000-000000000002', tracking_id: 'SC29030002', status: 'booked',           status_detail: 'Shipment booked — same day service',                      location: 'Sharjah, UAE',              event_timestamp: '2024-03-29T04:30:00Z' },
    { id: '33333333-0002-0000-0000-000000000002', booking_id: '22222222-0000-0000-0000-000000000002', tracking_id: 'SC29030002', status: 'picked_up',        status_detail: 'Documents collected from sender in Sharjah Industrial Area', location: 'Sharjah Industrial Area',   facility_code: 'HUB-SHJ', event_timestamp: '2024-03-29T06:15:00Z' },
    { id: '33333333-0002-0000-0000-000000000003', booking_id: '22222222-0000-0000-0000-000000000002', tracking_id: 'SC29030002', status: 'in_transit',       status_detail: 'En route to Dubai DIFC',                                  location: 'Sharjah–Dubai Highway',     facility_code: 'HUB-SHJ', event_timestamp: '2024-03-29T07:00:00Z' },
    { id: '33333333-0002-0000-0000-000000000004', booking_id: '22222222-0000-0000-0000-000000000002', tracking_id: 'SC29030002', status: 'out_for_delivery', status_detail: 'With rider — delivering to DIFC Gate Village',              location: 'DIFC, Dubai',               facility_code: 'HUB-DXB', event_timestamp: '2024-03-29T08:30:00Z' },
    // SC29030003 — In transit (4 events)
    { id: '33333333-0003-0000-0000-000000000001', booking_id: '22222222-0000-0000-0000-000000000003', tracking_id: 'SC29030003', status: 'booked',     status_detail: 'Shipment booked — standard delivery',              location: 'Abu Dhabi, UAE',             event_timestamp: '2024-03-29T06:00:00Z' },
    { id: '33333333-0003-0000-0000-000000000002', booking_id: '22222222-0000-0000-0000-000000000003', tracking_id: 'SC29030003', status: 'confirmed',  status_detail: 'Pickup confirmed for afternoon slot',              location: 'Abu Dhabi, UAE',             event_timestamp: '2024-03-29T06:30:00Z' },
    { id: '33333333-0003-0000-0000-000000000003', booking_id: '22222222-0000-0000-0000-000000000003', tracking_id: 'SC29030003', status: 'picked_up',  status_detail: '3 fragile ceramic packages collected — packed securely', location: 'Al Reem Island, Abu Dhabi', facility_code: 'HUB-AUH', event_timestamp: '2024-03-29T10:45:00Z' },
    { id: '33333333-0003-0000-0000-000000000004', booking_id: '22222222-0000-0000-0000-000000000003', tracking_id: 'SC29030003', status: 'in_transit', status_detail: 'Shipment in transit via Abu Dhabi–Dubai corridor', location: 'Abu Dhabi–Dubai Highway',    facility_code: 'HUB-AUH', event_timestamp: '2024-03-29T12:00:00Z' },
    // SC29030004 — Pending (1 event)
    { id: '33333333-0004-0000-0000-000000000001', booking_id: '22222222-0000-0000-0000-000000000004', tracking_id: 'SC29030004', status: 'booked', status_detail: 'Shipment booked — awaiting confirmation', location: 'Dubai, UAE', event_timestamp: '2024-03-29T13:00:00Z' },
    // SC28030005 — Returned (6 events)
    { id: '33333333-0005-0000-0000-000000000001', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'booked',             status_detail: 'International shipment booked — Dubai to London',               location: 'Dubai, UAE',                  event_timestamp: '2024-03-28T04:00:00Z' },
    { id: '33333333-0005-0000-0000-000000000002', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'picked_up',          status_detail: 'Package collected from Business Bay, Dubai',                    location: 'Business Bay, Dubai',         facility_code: 'HUB-DXB',     event_timestamp: '2024-03-28T07:00:00Z' },
    { id: '33333333-0005-0000-0000-000000000003', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'at_hub',             status_detail: 'Package at Dubai International Airport facility',               location: 'Dubai International Airport', facility_code: 'HUB-DXB-AIR', event_timestamp: '2024-03-28T11:00:00Z' },
    { id: '33333333-0005-0000-0000-000000000004', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'customs_clearance', status_detail: 'Package in UK customs clearance — Heathrow',                    location: 'London Heathrow, UK',         facility_code: 'HUB-LHR',     event_timestamp: '2024-03-30T09:00:00Z' },
    { id: '33333333-0005-0000-0000-000000000005', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'on_hold',            status_detail: 'Delivery refused by recipient — contact sender for instructions', location: 'London, UK',                 facility_code: 'HUB-LHR',     event_timestamp: '2024-04-01T14:30:00Z' },
    { id: '33333333-0005-0000-0000-000000000006', booking_id: '22222222-0000-0000-0000-000000000005', tracking_id: 'SC28030005', status: 'returned',           status_detail: 'Return to sender initiated — package dispatched back to Dubai',  location: 'London, UK',                 facility_code: 'HUB-LHR',     event_timestamp: '2024-04-02T10:00:00Z' },
  ];

  const { error } = await supabase.from('tracking_events').upsert(events, { onConflict: 'id' });
  if (error) throw new Error(`tracking_events: ${error.message}`);
  console.log(`✓ tracking_events (${events.length} rows)`);
}

async function seedInvoices() {
  const { error } = await supabase.from('invoices').upsert([
    {
      id: '44444444-0000-0000-0000-000000000001',
      invoice_number: 'INV-202403-0001',
      booking_id: '22222222-0000-0000-0000-000000000001',
      tracking_id: 'SC29030001',
      company_name: 'SCC Courier LLC',
      company_trn: '100123456780003',
      company_address: 'Office 1204, Business Bay, Dubai, UAE',
      company_phone: '+971 4 000 0000',
      company_email: 'info@sccourier.com',
      customer_id: '11111111-0000-0000-0000-000000000001',
      customer_name: 'Ahmed Hassan Al Rashidi',
      customer_trn: 'TL-DXB-2021-88432',
      customer_address: 'Office 1404, Business Bay Tower, Dubai, UAE',
      customer_phone: '+971 50 123 4567',
      customer_email: 'ahmed.hassan@logitech-uae.com',
      line_items: [
        { item_name: 'Express Courier Service', description: 'Express Delivery — Dubai to Abu Dhabi', hsn_code: '9961', quantity: 1, unit_price: 55.00, total: 55.00 },
        { item_name: 'Fuel Surcharge', description: 'Fuel surcharge', hsn_code: '9961', quantity: 1, unit_price: 5.00, total: 5.00 },
        { item_name: 'Shipment Insurance', description: 'Package insurance — declared value AED 2,500', hsn_code: '9961', quantity: 1, unit_price: 50.00, total: 50.00 },
      ],
      subtotal: 110.00, discount_amount: 0, taxable_amount: 110.00,
      vat_rate: 5.00, vat_amount: 5.50, total_amount: 115.50, currency: 'AED',
      payment_method: 'card', payment_status: 'paid', payment_date: '2024-03-29T05:20:00Z',
      terms_and_conditions: '1. All shipments subject to SCC Courier standard terms. 2. VAT at 5% per UAE FTA regulations.',
      qr_code_data: 'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEifQ',
      qr_verification_hash: 'sha256_placeholder_hash_001',
      issue_date: '2024-03-29', is_draft: false, is_cancelled: false,
    },
    {
      id: '44444444-0000-0000-0000-000000000002',
      invoice_number: 'INV-202403-0002',
      booking_id: '22222222-0000-0000-0000-000000000002',
      tracking_id: 'SC29030002',
      company_name: 'SCC Courier LLC',
      company_trn: '100123456780003',
      company_address: 'Office 1204, Business Bay, Dubai, UAE',
      company_phone: '+971 4 000 0000',
      company_email: 'info@sccourier.com',
      customer_id: '11111111-0000-0000-0000-000000000003',
      customer_name: 'Khalid Saeed Al Mansoori',
      customer_address: 'Warehouse 12, Sharjah Industrial Area, Sharjah, UAE',
      customer_phone: '+971 50 998 8776',
      customer_email: 'khalid@gulftrade.ae',
      line_items: [
        { item_name: 'Same Day Courier Service', description: 'Same Day Delivery — Sharjah to Dubai DIFC', hsn_code: '9961', quantity: 1, unit_price: 90.00, total: 90.00 },
        { item_name: 'Fuel Surcharge', description: 'Fuel surcharge', hsn_code: '9961', quantity: 1, unit_price: 5.00, total: 5.00 },
      ],
      subtotal: 95.00, discount_amount: 0, taxable_amount: 95.00,
      vat_rate: 5.00, vat_amount: 4.75, total_amount: 99.75, currency: 'AED',
      payment_method: 'cash', payment_status: 'paid', payment_date: '2024-03-29T04:35:00Z',
      terms_and_conditions: '1. All shipments subject to SCC Courier standard terms. 2. VAT at 5% per UAE FTA regulations.',
      qr_code_data: 'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDIifQ',
      qr_verification_hash: 'sha256_placeholder_hash_002',
      issue_date: '2024-03-29', is_draft: false, is_cancelled: false,
    },
    {
      id: '44444444-0000-0000-0000-000000000003',
      invoice_number: 'INV-202403-0003',
      booking_id: '22222222-0000-0000-0000-000000000005',
      tracking_id: 'SC28030005',
      company_name: 'SCC Courier LLC',
      company_trn: '100123456780003',
      company_address: 'Office 1204, Business Bay, Dubai, UAE',
      company_phone: '+971 4 000 0000',
      company_email: 'info@sccourier.com',
      customer_id: '11111111-0000-0000-0000-000000000001',
      customer_name: 'Ahmed Hassan Al Rashidi',
      customer_trn: 'TL-DXB-2021-88432',
      customer_address: 'Office 1404, Business Bay Tower, Dubai, UAE',
      customer_phone: '+971 50 123 4567',
      customer_email: 'ahmed.hassan@logitech-uae.com',
      line_items: [
        { item_name: 'International Courier Service', description: 'International Delivery — Dubai to London, UK', hsn_code: '9961', quantity: 1, unit_price: 120.00, total: 120.00 },
        { item_name: 'Fuel Surcharge', description: 'International fuel surcharge', hsn_code: '9961', quantity: 1, unit_price: 10.00, total: 10.00 },
        { item_name: 'Shipment Insurance', description: 'Package insurance — declared value AED 5,000', hsn_code: '9961', quantity: 1, unit_price: 100.00, total: 100.00 },
      ],
      subtotal: 230.00, discount_amount: 0, taxable_amount: 230.00,
      vat_rate: 5.00, vat_amount: 11.50, total_amount: 241.50, currency: 'AED',
      payment_method: 'bank_transfer', payment_status: 'refunded', payment_date: '2024-03-28T04:10:00Z',
      terms_and_conditions: '1. All shipments subject to SCC Courier standard terms. 2. VAT at 5% per UAE FTA regulations.',
      qr_code_data: 'eyJpbnZvaWNlSWQiOiI0NDQ0NDQ0NC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDMifQ',
      qr_verification_hash: 'sha256_placeholder_hash_003',
      issue_date: '2024-03-28', is_draft: false, is_cancelled: false,
    },
  ], { onConflict: 'id' });
  if (error) throw new Error(`invoices: ${error.message}`);
  console.log('✓ invoices (3 rows)');
}

// ── Run all seeds ─────────────────────────────────────────────────────────────
console.log('\nSeeding SCC Courier database...\n');

try {
  await seedCustomers();
  await seedBookings();
  await seedTrackingEvents();
  await seedInvoices();
  console.log('\n✅ Seed complete!\n');
} catch (err) {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
}
