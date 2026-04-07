'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm"
        >
          <button
            type="button"
            aria-expanded={open === i}
            aria-controls={`faq-${i}`}
            id={`faq-btn-${i}`}
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface transition-colors"
          >
            <span className="font-body font-semibold text-text-primary text-sm pr-2">
              {item.q}
            </span>
            <ChevronDown
              className={`size-4 text-text-secondary shrink-0 transition-transform duration-200 ${
                open === i ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <div
            id={`faq-${i}`}
            role="region"
            aria-labelledby={`faq-btn-${i}`}
            className={`overflow-hidden transition-all duration-200 ${
              open === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <p className="px-5 pb-5 text-sm font-body text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
