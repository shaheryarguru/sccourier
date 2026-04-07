import React from 'react';
import { UAE_VAT_RATE } from '@/lib/utils/constants';
import { formatAED } from '@/lib/utils/format';
import type { InvoiceLineItem } from '@/lib/invoice/generator';

interface Props {
  items: InvoiceLineItem[];
}

export function InvoiceLineItems({ items }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm font-body border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-3 py-2.5 text-left font-bold text-[10px] tracking-wider uppercase w-8">#</th>
            <th className="px-3 py-2.5 text-left font-bold text-[10px] tracking-wider uppercase">Description</th>
            <th className="px-3 py-2.5 text-right font-bold text-[10px] tracking-wider uppercase w-12">Qty</th>
            <th className="px-3 py-2.5 text-right font-bold text-[10px] tracking-wider uppercase w-28">Unit Price (AED)</th>
            <th className="px-3 py-2.5 text-right font-bold text-[10px] tracking-wider uppercase w-24">Discount (AED)</th>
            <th className="px-3 py-2.5 text-right font-bold text-[10px] tracking-wider uppercase w-16">VAT (5%)</th>
            <th className="px-3 py-2.5 text-right font-bold text-[10px] tracking-wider uppercase w-28">Total (AED)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, idx) => {
            // Parse every numeric field before calculation — never display NaN
            const unitPrice = Number(item.unit_price) || 0;
            const qty       = Number(item.quantity)   || 1;
            const discount  = Number((item as unknown as Record<string, unknown>).discount) || 0;
            const taxable   = +(unitPrice * qty - discount).toFixed(2);
            const vatRate   = Number(item.vat_rate) || UAE_VAT_RATE;
            const vatAmt    = +(taxable * vatRate / 100).toFixed(2);
            const lineTotal = +(taxable + vatAmt).toFixed(2);

            return (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-surface/50' : 'bg-white'}>
                <td className="px-3 py-3 text-text-disabled text-xs">{idx + 1}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-text-primary">{item.item_name}</p>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{item.description}</p>
                  {item.hsn_code && (
                    <p className="text-[10px] text-text-disabled mt-0.5 font-mono">HSN: {item.hsn_code}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-text-primary tabular-nums">
                  {Number(item.quantity) || 1}
                </td>
                <td className="px-3 py-3 text-right text-text-primary tabular-nums font-medium">
                  {formatAED(unitPrice)}
                </td>
                <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                  {discount > 0 ? formatAED(discount) : '—'}
                </td>
                <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                  {formatAED(vatAmt)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-text-primary tabular-nums">
                  {formatAED(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceLineItems;
