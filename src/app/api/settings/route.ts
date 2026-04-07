import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { COMPANY_INFO, DEFAULT_TERMS, PRICING } from '@/lib/utils/constants';
import { invalidateCompanySettingsCache } from '@/lib/utils/company-settings';

// ── Schema ────────────────────────────────────────────────────────────────────

const positiveNum = z.coerce.number().min(0).optional();

// Strip all non-digit characters from TRN then validate 15 digits
const trnField = z
  .string()
  .transform(v => v.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{15}$/, 'TRN must contain exactly 15 digits (e.g. 100123456789003)'))
  .optional();

// Accept valid URL, empty string, or null/undefined
const websiteField = z
  .string()
  .nullish()
  .transform(v => v ?? '')
  .pipe(z.string().refine(v => v === '' || /^https?:\/\/.+/.test(v), 'Must be a valid URL or empty'));

const SettingsSchema = z.object({
  company_name:         z.string().min(1).max(120).optional(),
  company_trn:          trnField,
  company_address:      z.string().min(1).max(300).optional(),
  company_phone:        z.string().min(5).max(30).optional(),
  company_email:        z.string().email().optional().or(z.literal('')),
  company_website:      websiteField,
  bank_name:            z.string().max(100).optional(),
  bank_account_name:    z.string().max(100).optional(),
  bank_account_no:      z.string().max(40).optional(),
  bank_iban:            z.string().max(34).optional(),
  bank_swift:           z.string().max(11).optional(),
  terms_and_conditions: z.string().max(5000).optional(),
  // Pricing
  price_standard:        positiveNum,
  price_express:         positiveNum,
  price_same_day:        positiveNum,
  price_international:   positiveNum,
  price_intra_standard:  positiveNum,
  price_intra_express:   positiveNum,
  price_intra_same_day:  positiveNum,
  fuel_surcharge:        positiveNum,
  cod_fee:               positiveNum,
  insurance_rate:        z.coerce.number().min(0).max(1).optional(),
  remote_area_surcharge: positiveNum,
  weight_rate_per_kg:    positiveNum,
  weight_free_kg:        positiveNum,
  min_cancel_fee:        positiveNum,
  redelivery_fee:        positiveNum,
});

// ── GET /api/settings ─────────────────────────────────────────────────────────

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('company_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Merge DB values with env/constant fallbacks
  return NextResponse.json({
    company_name:         data?.company_name         ?? COMPANY_INFO.name,
    company_trn:          data?.company_trn          ?? COMPANY_INFO.trn,
    company_address:      data?.company_address      ?? COMPANY_INFO.address,
    company_phone:        data?.company_phone        ?? COMPANY_INFO.phone,
    company_email:        data?.company_email        ?? COMPANY_INFO.email,
    company_website:      data?.company_website      ?? COMPANY_INFO.website,
    logo_url:             data?.logo_url             ?? null,
    bank_name:            data?.bank_name            ?? 'Emirates NBD',
    bank_account_name:    data?.bank_account_name    ?? 'SC Courier LLC',
    bank_account_no:      data?.bank_account_no      ?? '1234567890',
    bank_iban:            data?.bank_iban            ?? 'AE07 0260 0012 3456 7890 123',
    bank_swift:           data?.bank_swift           ?? 'EBILAEAD',
    terms_and_conditions: data?.terms_and_conditions ?? DEFAULT_TERMS,
    // Pricing
    price_standard:        data?.price_standard        ?? PRICING.BASE.standard,
    price_express:         data?.price_express         ?? PRICING.BASE.express,
    price_same_day:        data?.price_same_day        ?? PRICING.BASE.same_day,
    price_international:   data?.price_international   ?? PRICING.BASE.international,
    price_intra_standard:  data?.price_intra_standard  ?? PRICING.INTRA_EMIRATE_BASE.standard,
    price_intra_express:   data?.price_intra_express   ?? PRICING.INTRA_EMIRATE_BASE.express,
    price_intra_same_day:  data?.price_intra_same_day  ?? PRICING.INTRA_EMIRATE_BASE.same_day,
    fuel_surcharge:        data?.fuel_surcharge        ?? PRICING.FUEL_SURCHARGE,
    cod_fee:               data?.cod_fee               ?? PRICING.COD_FEE,
    insurance_rate:        data?.insurance_rate        ?? PRICING.INSURANCE_RATE,
    remote_area_surcharge: data?.remote_area_surcharge ?? PRICING.REMOTE_AREA_SURCHARGE,
    weight_rate_per_kg:    data?.weight_rate_per_kg    ?? PRICING.WEIGHT.RATE_PER_KG,
    weight_free_kg:        data?.weight_free_kg        ?? PRICING.WEIGHT.FREE_KG,
    min_cancel_fee:        data?.min_cancel_fee        ?? PRICING.MIN_CANCEL_FEE,
    redelivery_fee:        data?.redelivery_fee        ?? PRICING.REDELIVERY_FEE,
  });
}

// ── PUT /api/settings ─────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  // Auth check
  const browser = await createClient();
  const { data: { user } } = await browser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
      : 'Validation error';
    return NextResponse.json({ error: message, details: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('company_settings')
    .upsert({ id: 1, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateCompanySettingsCache();
  return NextResponse.json({ success: true });
}
