'use client';

import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { LogoUpload } from '@/components/settings/LogoUpload';

export function LogoSection() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/logo')
      .then(r => r.json() as Promise<{ logo_url: string | null }>)
      .then(d => setLogoUrl(d.logo_url ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ImageIcon className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-base text-primary">Invoice Logo</h2>
            <p className="font-body text-xs text-text-secondary mt-0.5">
              Appears in the header of every generated tax invoice
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        {loading ? (
          <div className="h-24 rounded-xl bg-surface animate-pulse" />
        ) : (
          <LogoUpload currentLogoUrl={logoUrl} onLogoChange={setLogoUrl} />
        )}
      </div>
    </div>
  );
}
