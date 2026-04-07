'use client';

import { useState } from 'react';
import { Building2, Pencil, X, Save, Loader2, CheckCircle } from 'lucide-react';

interface CompanyInfo {
  company_name:    string;
  company_trn:     string;
  company_address: string;
  company_phone:   string;
  company_email:   string;
  company_website: string;
}

export function CompanyInfoSection({ initial }: { initial: CompanyInfo }) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [form,    setForm]      = useState<CompanyInfo>(initial);
  const [draft,   setDraft]     = useState<CompanyInfo>(initial);

  const field = (key: keyof CompanyInfo, label: string, type = 'text', hint?: string) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3 border-b border-border last:border-0">
      <label className="font-body text-sm text-text-secondary sm:w-44 shrink-0 pt-0.5">
        {label}
      </label>
      {editing ? (
        <div className="flex-1 space-y-1">
          <input
            type={type}
            value={draft[key]}
            onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
            className="w-full border border-border rounded-xl px-3 py-1.5 text-sm font-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        </div>
      ) : (
        <span className="font-body text-sm text-text-primary font-medium">{form[key] || '—'}</span>
      )}
    </div>
  );

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

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-primary">Company Information</h2>
              <p className="font-body text-xs text-text-secondary mt-0.5">Legal and contact details printed on every invoice</p>
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
                <button onClick={cancel} className="flex items-center gap-1.5 text-sm font-body text-text-secondary border border-border rounded-xl px-3 py-1.5 hover:bg-surface transition">
                  <X className="size-3.5" /> Cancel
                </button>
                <button
                  onClick={save} disabled={saving}
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
      <div className="px-6 py-2">
        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2 mb-2">{error}</p>
        )}
        <dl className="divide-y divide-border">
          {field('company_name',    'Company Name')}
          {field('company_trn',     'Tax Reg. No. (TRN)', 'text', '15 digits only — e.g. 100123456789003')}
          {field('company_address', 'Address')}
          {field('company_phone',   'Phone', 'tel')}
          {field('company_email',   'Email', 'email')}
          {field('company_website', 'Website', 'url')}
        </dl>
      </div>
    </div>
  );
}
