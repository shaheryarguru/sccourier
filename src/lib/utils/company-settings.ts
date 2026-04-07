/**
 * Server-side helper — fetches live company settings from the DB,
 * falling back to constants for any missing fields.
 *
 * Safe to call from Server Components and Route Handlers.
 * Do NOT import this in 'use client' files.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { COMPANY_INFO, PRICING } from '@/lib/utils/constants';

export interface CompanySettings {
  company_name:    string;
  company_trn:     string;
  company_address: string;
  company_phone:   string;
  company_email:   string;
  company_website: string;
}

let _cache: CompanySettings | null = null;
let _cacheAt = 0;
const TTL_MS = 60_000; // re-fetch at most once per minute per server instance

export async function getCompanySettings(): Promise<CompanySettings> {
  const now = Date.now();
  if (_cache && now - _cacheAt < TTL_MS) return _cache;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('company_settings')
      .select('company_name,company_trn,company_address,company_phone,company_email,company_website')
      .eq('id', 1)
      .maybeSingle();

    _cache = {
      company_name:    data?.company_name    || COMPANY_INFO.name,
      company_trn:     data?.company_trn     || COMPANY_INFO.trn,
      company_address: data?.company_address || COMPANY_INFO.address,
      company_phone:   data?.company_phone   || COMPANY_INFO.phone,
      company_email:   data?.company_email   || COMPANY_INFO.email,
      company_website: data?.company_website || COMPANY_INFO.website,
    };
    _cacheAt = now;
  } catch {
    // Fall back to constants if DB is unreachable
    _cache = {
      company_name:    COMPANY_INFO.name,
      company_trn:     COMPANY_INFO.trn,
      company_address: COMPANY_INFO.address,
      company_phone:   COMPANY_INFO.phone,
      company_email:   COMPANY_INFO.email,
      company_website: COMPANY_INFO.website,
    };
  }

  return _cache!;
}

/** Call this after a successful settings save so the next request re-fetches. */
export function invalidateCompanySettingsCache() {
  _cache = null;
  _cacheAt = 0;
}
