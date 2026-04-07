'use client';

import { useState } from 'react';
import { Scale, Pencil, X, Save, Loader2, CheckCircle } from 'lucide-react';

export interface PricingInitial {
  price_standard:        number;
  price_express:         number;
  price_same_day:        number;
  price_international:   number;
  price_intra_standard:  number;
  price_intra_express:   number;
  price_intra_same_day:  number;
  fuel_surcharge:        number;
  cod_fee:               number;
  insurance_rate:        number; // stored as decimal, e.g. 0.02
  remote_area_surcharge: number;
  weight_rate_per_kg:    number;
  weight_free_kg:        number;
  min_cancel_fee:        number;
  redelivery_fee:        number;
}

function numField(
  key: keyof PricingInitial,
  label: string,
  draft: PricingInitial,
  setDraft: React.Dispatch<React.SetStateAction<PricingInitial>>,
  editing: boolean,
  prefix = 'AED',
  hint?: string,
) {
  const raw = draft[key] as number;
  // insurance_rate is stored as 0.02 → show as 2 (%)
  const displayVal = key === 'insurance_rate' ? +(raw * 100).toFixed(4) : raw;

  return (
    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-3 border-b border-border last:border-0">
      <label className="font-body text-sm text-text-secondary sm:w-52 shrink-0">
        {label}
      </label>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          {prefix && (
            <span className="font-body text-sm text-text-secondary shrink-0">{prefix}</span>
          )}
          <input
            type="number"
            min={0}
            step={key === 'insurance_rate' || key === 'weight_free_kg' ? '0.01' : '0.5'}
            value={displayVal}
            onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              setDraft(p => ({
                ...p,
                [key]: key === 'insurance_rate' ? +(v / 100).toFixed(6) : v,
              }));
            }}
            className="w-32 border border-border rounded-xl px-3 py-1.5 text-sm font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          {hint && <span className="text-xs text-text-secondary">{hint}</span>}
        </div>
      ) : (
        <span className="font-body text-sm font-semibold text-text-primary">
          {key === 'insurance_rate'
            ? `${(raw * 100).toFixed(0)}% of declared value`
            : `${prefix} ${raw.toFixed(2)}`}
        </span>
      )}
    </div>
  );
}

export function PricingSection({ initial }: { initial: PricingInitial }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [form,    setForm]    = useState<PricingInitial>(initial);
  const [draft,   setDraft]   = useState<PricingInitial>(initial);

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Save failed');
      }
      setForm(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function cancel() { setDraft(form); setEditing(false); setError(null); }

  const f = (
    key: keyof PricingInitial,
    label: string,
    prefix?: string,
    hint?: string,
  ) => numField(key, label, draft, setDraft, editing, prefix, hint);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-primary">Pricing Reference</h2>
              <p className="font-body text-xs text-text-secondary mt-0.5">
                Base rates and surcharges (AED). Changes apply to new bookings immediately.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-body">
                <CheckCircle className="size-3.5" /> Saved
              </span>
            )}
            {!editing ? (
              <button
                onClick={() => { setDraft(form); setEditing(true); }}
                className="flex items-center gap-1.5 text-sm font-body font-medium text-primary border border-border rounded-xl px-3 py-1.5 hover:bg-surface transition"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  className="flex items-center gap-1.5 text-sm font-body text-text-secondary border border-border rounded-xl px-3 py-1.5 hover:bg-surface transition"
                >
                  <X className="size-3.5" /> Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-sm font-body font-medium text-white bg-primary rounded-xl px-3 py-1.5 hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-6">
        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* Service Base Prices */}
        <div>
          <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-1">
            Service Base Prices
          </p>
          <dl className="divide-y divide-border">
            {f('price_standard',      'Standard (2–3 days)')}
            {f('price_express',       'Express (next day)')}
            {f('price_same_day',      'Same Day (within 6 hrs)')}
            {f('price_international', 'International (5–10 days)')}
          </dl>
        </div>

        {/* Intra-Emirate Prices */}
        <div>
          <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-1">
            Intra-Emirate Prices
          </p>
          <dl className="divide-y divide-border">
            {f('price_intra_standard', 'Intra-Emirate Standard')}
            {f('price_intra_express',  'Intra-Emirate Express')}
            {f('price_intra_same_day', 'Intra-Emirate Same Day')}
          </dl>
        </div>

        {/* Surcharges & Fees */}
        <div>
          <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-1">
            Surcharges &amp; Fees
          </p>
          <dl className="divide-y divide-border">
            {f('fuel_surcharge',        'Fuel Surcharge')}
            {f('cod_fee',               'Cash on Delivery (COD) Fee')}
            {f('insurance_rate',        'Insurance Rate', '%', '% of declared value')}
            {f('remote_area_surcharge', 'Remote Area Surcharge')}
            {f('weight_rate_per_kg',    'Weight Rate (per kg over free)')}
            {f('weight_free_kg',        'Free Weight Allowance', 'kg')}
            {f('min_cancel_fee',        'Min. Cancellation Fee')}
            {f('redelivery_fee',        'Re-delivery Fee (3rd attempt+)')}
          </dl>
        </div>
      </div>
    </div>
  );
}
