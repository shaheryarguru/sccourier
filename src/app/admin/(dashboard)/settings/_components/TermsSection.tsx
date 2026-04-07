'use client';

import { useState } from 'react';
import { FileText, Pencil, X, Save, Loader2, CheckCircle, RotateCcw } from 'lucide-react';
import { DEFAULT_TERMS } from '@/lib/utils/constants';

export function TermsSection({ initial }: { initial: string }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [text,    setText]    = useState(initial);
  const [draft,   setDraft]   = useState(initial);

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_and_conditions: draft }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Save failed');
      }
      setText(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function cancel() { setDraft(text); setEditing(false); setError(null); }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-primary">Terms &amp; Conditions</h2>
              <p className="font-body text-xs text-text-secondary mt-0.5">Printed on every tax invoice — one clause per line</p>
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
                onClick={() => { setDraft(text); setEditing(true); }}
                className="flex items-center gap-1.5 text-sm font-body font-medium text-primary border border-border rounded-xl px-3 py-1.5 hover:bg-surface transition"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setDraft(DEFAULT_TERMS)}
                  title="Reset to defaults"
                  className="flex items-center gap-1.5 text-sm font-body text-text-secondary border border-border rounded-xl px-3 py-1.5 hover:bg-surface transition"
                >
                  <RotateCcw className="size-3.5" /> Reset
                </button>
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
      <div className="px-6 py-5">
        {error && (
          <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-xl px-3 py-2 mb-3">{error}</p>
        )}
        {editing ? (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={14}
            className="w-full border border-border rounded-xl px-4 py-3 text-xs font-body text-text-primary leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-y"
            placeholder="Enter terms and conditions, one clause per line…"
          />
        ) : (
          <pre className="text-xs font-body text-text-secondary leading-relaxed whitespace-pre-wrap bg-surface rounded-xl p-4 border border-border">
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}
