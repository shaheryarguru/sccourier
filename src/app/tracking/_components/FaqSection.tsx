'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqSection({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <HelpCircle className="size-3.5" aria-hidden="true" />
        Frequently Asked Questions
      </p>
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border overflow-hidden">
          <button
            type="button"
            className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-surface/60 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <p className="text-sm font-body font-semibold text-text-primary leading-snug">{item.q}</p>
            {open === i
              ? <ChevronUp   className="size-4 text-text-secondary shrink-0 mt-0.5" aria-hidden="true" />
              : <ChevronDown className="size-4 text-text-secondary shrink-0 mt-0.5" aria-hidden="true" />
            }
          </button>
          {open === i && (
            <div className="px-4 pb-4 border-t border-border">
              <p className="text-sm font-body text-text-secondary leading-relaxed pt-3">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
