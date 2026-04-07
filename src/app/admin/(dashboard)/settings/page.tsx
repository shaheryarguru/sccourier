import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { COMPANY_INFO, PRICING, DEFAULT_TERMS, EMIRATES } from '@/lib/utils/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { LogoSection }        from './_components/LogoSection';
import { CompanyInfoSection } from './_components/CompanyInfoSection';
import { BankDetailsSection } from './_components/BankDetailsSection';
import { TermsSection }       from './_components/TermsSection';
import { PricingSection }     from './_components/PricingSection';

export const metadata: Metadata = { title: 'Settings' };

function SettingsSection({ title, icon: Icon, description, children }: {
  title: string; icon: LucideIcon; description?: string; children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-base text-primary">{title}</h2>
            {description && <p className="font-body text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Page — server component (fetches initial settings from DB) ────────────────

export default async function SettingsPage() {
  const admin = createAdminClient();
  const { data } = await admin.from('company_settings').select('*').eq('id', 1).maybeSingle();

  const companyInitial = {
    company_name:    data?.company_name    ?? COMPANY_INFO.name,
    company_trn:     data?.company_trn     ?? COMPANY_INFO.trn,
    company_address: data?.company_address ?? COMPANY_INFO.address,
    company_phone:   data?.company_phone   ?? COMPANY_INFO.phone,
    company_email:   data?.company_email   ?? COMPANY_INFO.email,
    company_website: data?.company_website ?? COMPANY_INFO.website,
  };

  const bankInitial = {
    bank_name:         data?.bank_name         ?? 'Emirates NBD',
    bank_account_name: data?.bank_account_name ?? 'SC Courier LLC',
    bank_account_no:   data?.bank_account_no   ?? '1234567890',
    bank_iban:         data?.bank_iban         ?? 'AE07 0260 0012 3456 7890 123',
    bank_swift:        data?.bank_swift        ?? 'EBILAEAD',
  };

  const termsInitial = data?.terms_and_conditions ?? DEFAULT_TERMS;

  const pricingInitial = {
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
  };

  return (
    <div className="space-y-6 max-w-screen-lg">

      {/* Page header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-primary">Settings</h1>
        <p className="text-sm font-body text-text-secondary mt-0.5">
          Company configuration — changes apply to all new invoices immediately.
        </p>
      </div>

      {/* Invoice Logo */}
      <LogoSection />

      {/* Company Information — editable */}
      <CompanyInfoSection initial={companyInitial} />

      {/* Bank Transfer Details — editable */}
      <BankDetailsSection initial={bankInitial} />

      {/* Terms & Conditions — editable */}
      <TermsSection initial={termsInitial} />

      {/* Pricing Reference — editable */}
      <PricingSection initial={pricingInitial} />

      {/* Service Areas */}
      <SettingsSection title="Service Areas" icon={MapPin} description="Emirates covered by SC Courier">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {EMIRATES.map(em => (
            <div key={em.value} className="bg-surface rounded-xl px-3 py-2.5 text-sm font-body text-text-primary">
              {em.label}
            </div>
          ))}
          <div className="bg-surface rounded-xl px-3 py-2.5 text-sm font-body text-text-secondary col-span-full">
            + International shipping worldwide
          </div>
        </div>
      </SettingsSection>

    </div>
  );
}
