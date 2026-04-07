import React from 'react';
import { ScrollText, ShieldCheck } from 'lucide-react';
import { DEFAULT_TERMS } from '@/lib/utils/constants';

interface Props {
  terms: string;
}

export function InvoiceTerms({ terms }: Props) {
  // Fall back to DEFAULT_TERMS if stored value is missing any of the 10 terms
  const parsed = terms.split('\n').map(l => l.trim()).filter(Boolean);
  const lines  = parsed.length >= 10 ? parsed : DEFAULT_TERMS.split('\n').map(l => l.trim()).filter(Boolean);
  const half   = Math.ceil(lines.length / 2);
  const left   = lines.slice(0, half);
  const right  = lines.slice(half);

  function TermItem({ line, num }: { line: string; num: number }) {
    const clean = line.replace(/^\d+\.\s*/, '');
    return (
      <div className="flex gap-2 text-[11px] font-body text-text-secondary leading-relaxed">
        <span className="text-text-disabled shrink-0 font-mono w-5 text-right">{num}.</span>
        <span>{clean}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScrollText className="size-4 text-text-secondary shrink-0" aria-hidden="true" />
        <ShieldCheck  className="size-4 text-text-secondary shrink-0" aria-hidden="true" />
        <p className="text-xs font-body font-bold text-text-secondary uppercase tracking-wider">
          Terms &amp; Conditions — UAE Regulatory Compliance
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        <div className="space-y-1.5">
          {left.map((line, i) => <TermItem key={i} line={line} num={i + 1} />)}
        </div>
        <div className="space-y-1.5">
          {right.map((line, i) => <TermItem key={i} line={line} num={half + i + 1} />)}
        </div>
      </div>
    </div>
  );
}

export default InvoiceTerms;
