/**
 * InvoiceDocument — UAE FTA-compliant premium tax invoice layout.
 *
 * Sections (top to bottom):
 *   1. Amber accent bar
 *   2. Header: Logo (left) + "Tax Invoice" title (right) + compliance badge + meta
 *   3. Parties: BILL TO/SENDER | RECEIVER | PAYMENT INFO (3-column)
 *   4. Shipment details bar
 *   5. Line items table (#, Description, Qty, Unit Price, Discount, VAT 5%, Total)
 *   6. Pricing summary + amount in words
 *   7. UAE FTA VAT Breakdown box + compliance statement
 *   8. Terms & Conditions (2-column grid)
 *   9. Footer: company details (left) + QR code (right)
 *  10. Action buttons (web only — hidden on print)
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck, Loader2,
  MapPin, Package, Calendar, CreditCard,
  FileText, ExternalLink, Phone, Mail,
  Truck, Scale, ScrollText, AlertCircle,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

import { formatAED, formatDate, slugToLabel, formatWeight, capitalizeProper, buildAddress } from '@/lib/utils/format';
import { amountToWords } from '@/lib/utils/amount-to-words';
import { DEFAULT_TERMS, UAE_VAT_RATE } from '@/lib/utils/constants';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';
import type { InvoiceLineItem } from '@/lib/invoice/generator';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceDocumentProps {
  invoice: InvoiceRow;
  booking?: BookingRow | null;
  /** Render action buttons (download / print / share) — pass false for print/PDF */
  showActions?: boolean;
  /** Optional slot for action buttons (e.g. <InvoiceActions />) */
  actions?: React.ReactNode;
}

// ── Status config ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  bg:    string;
  text:  string;
  dot:   string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  paid:     { label: 'Paid',            bg: 'bg-[#10B981]', text: 'text-white',     dot: 'bg-white' },
  unpaid:   { label: 'Unpaid',          bg: 'bg-[#F59E0B]', text: 'text-gray-900',  dot: 'bg-gray-900' },
  partial:  { label: 'Partially Paid',  bg: 'bg-blue-500',  text: 'text-white',     dot: 'bg-white' },
  overdue:  { label: 'Overdue',         bg: 'bg-[#EF4444]', text: 'text-white',     dot: 'bg-white' },
  refunded: { label: 'Refunded',        bg: 'bg-gray-500',  text: 'text-white',     dot: 'bg-white' },
};

// ── Main component ────────────────────────────────────────────────────────────

export function InvoiceDocument({ invoice, booking, actions }: InvoiceDocumentProps) {

  // ── Derived values ──────────────────────────────────────────────────────────
  const lineItems = (Array.isArray(invoice.line_items) ? invoice.line_items : []) as unknown as InvoiceLineItem[];

  const statusCfg = STATUS_CONFIG[invoice.payment_status] ?? {
    label: invoice.payment_status,
    bg: 'bg-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-700',
  };

  // Receiver info — prefer invoice columns (migration 011), fall back to booking
  const receiverName    = invoice.receiver_name    ?? booking?.receiver_name    ?? '—';
  const receiverPhone   = invoice.receiver_phone   ?? booking?.receiver_phone   ?? null;
  const receiverEmail   = invoice.receiver_email   ?? booking?.receiver_email   ?? null;
  const receiverAddress = invoice.receiver_address ?? booking?.receiver_address ?? null;
  const receiverCity    = invoice.receiver_city    ?? booking?.receiver_city    ?? null;
  const receiverEmirate = invoice.receiver_emirate ?? booking?.receiver_emirate ?? null;
  const receiverCountry = invoice.receiver_country ?? booking?.receiver_country ?? null;

  const supplyDate   = invoice.supply_date ?? booking?.pickup_date ?? invoice.issue_date;
  const amtWords     = amountToWords(Number(invoice.total_amount) || 0);

  // Booking-level fields
  const bookingNumber   = booking?.booking_number  ?? null;
  const serviceType     = booking?.service_type    ?? null;
  const packageType     = booking?.package_type    ?? null;
  const weightKg        = booking?.weight_kg       ?? null;
  const declaredValue   = booking?.declared_value  ?? null;
  const numPieces       = booking?.number_of_pieces ?? null;
  const senderCity      = booking?.sender_city     ?? invoice.customer_address.split(',')[0] ?? '';
  const senderEmirate   = booking?.sender_emirate  ?? '';

  // Receiver address — normalise casing and deduplicate redundant parts
  const receiverEmirateLabel = receiverEmirate ? capitalizeProper(receiverEmirate) : null;
  const receiverCityLabel    = receiverCity    ? capitalizeProper(receiverCity)    : null;
  const receiverAddressFormatted = buildAddress([receiverAddress, receiverCityLabel, receiverEmirateLabel, receiverCountry]);

  const senderCityLabel   = capitalizeProper(senderCity);
  const senderEmirateLabel = senderEmirate ? capitalizeProper(senderEmirate) : '';
  const receiverCityDisplay = receiverCityLabel ?? '';

  const route = receiverCityDisplay
    ? `${senderCityLabel}${senderEmirateLabel && senderEmirateLabel !== senderCityLabel ? ', ' + senderEmirateLabel : ''} → ${receiverCityDisplay}${receiverCountry && receiverCountry !== 'UAE' ? ', ' + receiverCountry : ''}`
    : null;

  return (
    <article
      className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden print:shadow-none print:border-0 print:rounded-none"
      aria-label={`Tax Invoice ${invoice.invoice_number}`}
    >
      {/* ── 1. Amber accent bar ─────────────────────────────────────────────── */}
      <div className="h-1.5 bg-[#F59E0B] w-full print:h-2" aria-hidden="true" />

      {/* ── 2. Header ───────────────────────────────────────────────────────── */}
      <header className="px-6 pt-6 pb-5 border-b border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

          {/* Left: Logo + company basics */}
          <div className="space-y-2">
            <Logo variant="full" size="md" theme="default" />
            <div className="space-y-0.5">
              <p className="text-xs font-body text-[#64748B]">{invoice.company_address}</p>
              <p className="text-xs font-body text-[#64748B]">
                {invoice.company_phone} · {invoice.company_email}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 bg-[#0F2B46]/8 border border-[#0F2B46]/15 text-[#0F2B46] text-[10px] font-body font-semibold px-2 py-0.5 rounded-full tracking-wider">
                TRN: {invoice.company_trn}
              </span>
            </div>
          </div>

          {/* Right: Title + badges */}
          <div className="text-left sm:text-right space-y-2">
            <div>
              <h1 className="font-heading font-bold text-[28px] text-[#0F2B46] leading-none tracking-tight">
                Tax Invoice
              </h1>
              <p className="font-mono text-[#64748B] text-sm mt-1">{invoice.invoice_number}</p>
            </div>
            {/* UAE FTA compliance badge */}
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex items-center gap-1 bg-[#F0F9F4] border border-[#10B981]/30 text-[#10B981] text-[10px] font-body font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
                <ShieldCheck className="size-3" aria-hidden="true" />
                VAT Receipt · UAE FTA Compliant
              </span>
              <span className={`inline-flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.text} text-xs font-body font-bold px-3 py-1 rounded-full`}>
                <span className={`size-1.5 rounded-full ${statusCfg.dot} opacity-80`} aria-hidden="true" />
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-4">
          <MetaCell label="Invoice No." value={invoice.invoice_number} mono />
          <MetaCell label="Issue Date"  value={formatDate(invoice.issue_date)} />
          <MetaCell label="Supply Date" value={formatDate(supplyDate)} />
          <MetaCell label="Due Date"    value={invoice.due_date ? formatDate(invoice.due_date) : 'On Receipt'} />
          <MetaCell label="Currency"    value={invoice.currency} />
        </div>
      </header>

      <div className="px-6 py-5 space-y-4 print:px-4">

        {/* ── Action buttons (web only) ────────────────────────────────────── */}
        {actions && (
          <div className="flex items-center gap-3 flex-wrap print:hidden" role="toolbar" aria-label="Invoice actions">
            {actions}
          </div>
        )}

        {/* ── 3. Parties: 3-column ────────────────────────────────────────── */}
        <section aria-label="Invoice parties" className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Bill To / Sender */}
          <PartyCard
            title="Bill To / Sender"
            name={invoice.customer_name}
            trn={invoice.customer_trn ?? undefined}
            address={invoice.customer_address}
            phone={invoice.customer_phone}
            email={invoice.customer_email ?? undefined}
            accent="primary"
          />

          {/* Receiver */}
          <PartyCard
            title="Ship To / Receiver"
            name={receiverName}
            address={receiverAddressFormatted || undefined}
            phone={receiverPhone ?? undefined}
            email={receiverEmail ?? undefined}
            accent="secondary"
          />

          {/* Payment info */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-4 space-y-3">
            <p className="text-[10px] font-body font-bold text-[#64748B] uppercase tracking-widest">
              Payment Info
            </p>

            {/* Status heading */}
            {invoice.payment_status === 'paid' ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#10B981] shrink-0">
                  <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="text-sm font-body font-bold text-[#10B981]">Payment Received</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#F59E0B] shrink-0" aria-hidden="true" />
                <span className="text-sm font-body font-bold text-[#F59E0B]">Payment Pending</span>
              </div>
            )}

            {/* Method pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-body font-semibold px-2.5 py-1 rounded-full">
                <CreditCard className="size-3" aria-hidden="true" />
                {slugToLabel(invoice.payment_method)}
              </span>
            </div>

            {/* Status text */}
            <InfoRow icon={<FileText className="size-3.5 text-[#0F2B46]" />} label="Status">
              <span className={`font-body font-bold text-xs ${
                invoice.payment_status === 'paid' ? 'text-[#10B981]'
                : invoice.payment_status === 'overdue' ? 'text-[#EF4444]'
                : 'text-[#F59E0B]'
              }`}>
                {invoice.payment_status === 'paid' ? 'Paid in Full'
                  : invoice.payment_status === 'overdue' ? 'Overdue'
                  : invoice.payment_status === 'partial' ? 'Partially Paid'
                  : invoice.payment_status === 'refunded' ? 'Refunded'
                  : 'Unpaid'}
              </span>
            </InfoRow>

            {invoice.payment_date && (
              <InfoRow icon={<Calendar className="size-3.5 text-[#0F2B46]" />} label="Date">
                <span className="font-semibold text-[#0F172A] text-xs">
                  {formatDate(invoice.payment_date)}
                </span>
              </InfoRow>
            )}
            {invoice.payment_reference && (
              <InfoRow icon={<FileText className="size-3.5 text-[#0F2B46]" />} label="Ref">
                <span className="font-mono text-xs text-[#0F172A]">
                  {invoice.payment_reference}
                </span>
              </InfoRow>
            )}
          </div>
        </section>

        {/* ── 4. Shipment details bar ──────────────────────────────────────── */}
        <section
          aria-label="Shipment details"
          className="bg-[#0F2B46] rounded-xl px-5 py-4"
        >
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <ShipDetail
              icon={<Package className="size-3.5 text-[#F59E0B]" />}
              label="Tracking ID"
            >
              <Link
                href={`/tracking/${invoice.tracking_id}`}
                className="font-mono font-bold text-white hover:text-[#F59E0B] transition-colors flex items-center gap-1"
                target="_blank"
              >
                {invoice.tracking_id}
                <ExternalLink className="size-3 opacity-60" aria-hidden="true" />
              </Link>
            </ShipDetail>

            {bookingNumber && (
              <ShipDetail icon={<FileText className="size-3.5 text-[#F59E0B]" />} label="Booking #">
                <span className="font-mono font-semibold text-white">{bookingNumber}</span>
              </ShipDetail>
            )}

            {serviceType && (
              <ShipDetail icon={<Truck className="size-3.5 text-[#F59E0B]" />} label="Service">
                <span className="font-semibold text-white">{slugToLabel(serviceType)}</span>
              </ShipDetail>
            )}

            {packageType && (
              <ShipDetail icon={<Package className="size-3.5 text-[#F59E0B]" />} label="Package">
                <span className="font-semibold text-white">{slugToLabel(packageType)}</span>
              </ShipDetail>
            )}

            {weightKg !== null && (
              <ShipDetail icon={<Scale className="size-3.5 text-[#F59E0B]" />} label="Weight">
                <span className="font-semibold text-white">{formatWeight(Number(weightKg))}</span>
              </ShipDetail>
            )}

            {numPieces !== null && (
              <ShipDetail icon={<Package className="size-3.5 text-[#F59E0B]" />} label="Pieces">
                <span className="font-semibold text-white">{numPieces} {numPieces === 1 ? 'pc' : 'pcs'}</span>
              </ShipDetail>
            )}

            {declaredValue !== null && (
              <ShipDetail icon={<FileText className="size-3.5 text-[#F59E0B]" />} label="Declared Value">
                <span className="font-semibold text-white">{formatAED(Number(declaredValue))}</span>
              </ShipDetail>
            )}

            {route && (
              <ShipDetail icon={<MapPin className="size-3.5 text-[#F59E0B]" />} label="Route">
                <span className="font-semibold text-white">{route}</span>
              </ShipDetail>
            )}
          </div>
        </section>

        {/* ── 5. Line items table ──────────────────────────────────────────── */}
        <section aria-label="Invoice line items" className="rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body border-collapse">
              <thead>
                <tr className="bg-[#0F2B46] text-white">
                  <th className="px-3 py-3 text-left text-[10px] font-bold tracking-wider uppercase w-8">#</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold tracking-wider uppercase">Description</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold tracking-wider uppercase w-12">Qty</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold tracking-wider uppercase w-28">Unit Price (AED)</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold tracking-wider uppercase w-24">Discount (AED)</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold tracking-wider uppercase w-16">VAT (5%)</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold tracking-wider uppercase w-28">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {lineItems.map((item, idx) => {
                  // Parse every numeric field before calculation — JSONB may return
                  // strings, null, or undefined for old records (never display NaN).
                  const unitPrice = Number(item.unit_price) || 0;
                  const qty       = Number(item.quantity)   || 1;
                  const discount  = Number((item as unknown as Record<string, unknown>).discount) || 0;
                  const taxable   = +(unitPrice * qty - discount).toFixed(2);
                  const vatRate   = Number(item.vat_rate) || UAE_VAT_RATE;
                  const vatAmt    = +(taxable * vatRate / 100).toFixed(2);
                  const lineTotal = +(taxable + vatAmt).toFixed(2);
                  return (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}
                    >
                      <td className="px-3 py-3 text-[#64748B] text-xs">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#0F172A]">{item.item_name}</p>
                        <p className="text-xs text-[#64748B] mt-0.5 leading-snug">{item.description}</p>
                        {item.hsn_code && (
                          <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">HSN: {item.hsn_code}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-[#0F172A] tabular-nums">{Number(item.quantity) || 1}</td>
                      <td className="px-3 py-3 text-right text-[#0F172A] tabular-nums font-medium">
                        {formatAED(unitPrice)}
                      </td>
                      {/* Discount — show dash when zero, formatted value otherwise */}
                      <td className="px-3 py-3 text-right text-[#64748B] tabular-nums">
                        {discount > 0 ? formatAED(discount) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-[#64748B] tabular-nums">
                        {formatAED(vatAmt)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-[#0F172A] tabular-nums">
                        {formatAED(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 6. Pricing summary + amount in words ────────────────────────── */}
        <section aria-label="Pricing summary" className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

          {/* Amount in words */}
          <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] border-l-4 border-l-[#F59E0B] p-4 h-full flex flex-col justify-between gap-3">
            <div>
              <p className="text-[10px] font-body font-bold text-[#92400E] uppercase tracking-widest mb-2">
                Amount in Words
              </p>
              <p className="font-body text-[14px] text-[#0F172A] leading-relaxed italic">
                {amtWords}
              </p>
            </div>
            {invoice.notes && (
              <div className="border-t border-[#FDE68A] pt-3">
                <p className="text-[10px] font-body font-bold text-[#92400E] uppercase tracking-widest mb-1">
                  Notes
                </p>
                <p className="text-xs font-body text-[#64748B] leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Totals table */}
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
            <table className="w-full text-sm font-body">
              <tbody className="divide-y divide-[#E5E7EB]">
                <TotalRow label="Subtotal"       value={formatAED(invoice.subtotal)} />
                {invoice.discount_amount > 0 && (
                  <TotalRow
                    label={`Discount${invoice.discount_reason ? ` — ${invoice.discount_reason}` : ''}`}
                    value={`− ${formatAED(invoice.discount_amount)}`}
                    danger
                  />
                )}
                <TotalRow label="Taxable Amount" value={formatAED(invoice.taxable_amount)} />
                <TotalRow label={`VAT (${invoice.vat_rate}%)`} value={formatAED(invoice.vat_amount)} />
              </tbody>
              <tfoot>
                <tr className="bg-[#0F2B46] text-white">
                  <td className="px-4 py-4 font-heading font-bold text-base tracking-wide">Total Due</td>
                  <td className="px-4 py-4 text-right font-heading font-extrabold text-2xl tabular-nums text-white">
                    {formatAED(Number(invoice.total_amount) || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── 7. UAE FTA VAT Breakdown box + compliance statement ──────────── */}
        <section aria-label="UAE FTA VAT breakdown">
          <div className="rounded-xl border-2 border-[#16A34A] overflow-hidden">
            {/* Green header bar */}
            <div className="bg-[#16A34A] px-4 py-2.5 flex items-center gap-2">
              <ShieldCheck className="size-4 text-white shrink-0" aria-hidden="true" />
              <p className="text-xs font-body font-bold text-white uppercase tracking-wider">
                UAE FTA VAT Breakdown · Federal Decree-Law No. 8 of 2017
              </p>
            </div>
            {/* Values grid */}
            <div className="bg-[#F0FDF4] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <VATBreakdownCell label="Taxable Amount"    value={formatAED(Number(invoice.taxable_amount) || 0)} />
              <VATBreakdownCell label="VAT Rate"          value={`${invoice.vat_rate}%`} />
              <VATBreakdownCell label="VAT Amount"        value={formatAED(Number(invoice.vat_amount) || 0)} />
              <VATBreakdownCell label="Total (inc. VAT)"  value={formatAED(Number(invoice.total_amount) || 0)} highlight />
            </div>
            {/* Compliance statement */}
            <div className="bg-[#F3F4F6] px-4 py-3 border-t border-[#16A34A]/20">
              <p className="text-[10px] font-body text-[#4B5563] leading-relaxed">
                This tax invoice has been issued by <strong>{invoice.company_name}</strong> (TRN: <strong>{invoice.company_trn}</strong>) in accordance
                with the UAE Federal Tax Authority requirements under Federal Decree-Law No. 8 of 2017 on Value Added Tax and its Executive Regulations.
                VAT at 5% standard rate applies to all taxable supplies. Billing enquiries: {invoice.company_email}.
                Records retained for 5 years per FTA requirements.
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. Terms & Conditions (2-column) ────────────────────────────── */}
        <section aria-label="Terms and conditions">
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ScrollText className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
              <ShieldCheck className="size-4 text-[#64748B] shrink-0" aria-hidden="true" />
              <p className="text-xs font-body font-bold text-[#64748B] uppercase tracking-wider">
                Terms &amp; Conditions — UAE Regulatory Compliance
              </p>
            </div>
            <TermsGrid terms={invoice.terms_and_conditions} />
          </div>
        </section>

        {/* ── 9. Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#E5E7EB] pt-3 mt-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

            {/* Company details */}
            <div className="space-y-1.5">
              <Logo variant="full" size="sm" theme="default" />
              <div className="space-y-0.5 mt-2">
                <p className="text-xs font-body text-[#64748B] flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  {invoice.company_address}
                </p>
                <p className="text-xs font-body text-[#64748B] flex items-center gap-1.5">
                  <Phone className="size-3 shrink-0" aria-hidden="true" />
                  {invoice.company_phone}
                </p>
                <p className="text-xs font-body text-[#64748B] flex items-center gap-1.5">
                  <Mail className="size-3 shrink-0" aria-hidden="true" />
                  {invoice.company_email}
                </p>
              </div>
              <p className="text-[10px] font-body text-[#94A3B8] mt-3 leading-relaxed max-w-xs">
                This is a computer-generated tax invoice and is valid without a physical signature.
                Issued under UAE Federal Tax Authority registration TRN: {invoice.company_trn}.
              </p>
            </div>

            {/* QR code */}
            {invoice.qr_code_data && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <InvoiceQRCode
                  qrUrl={invoice.qr_code_data}
                  invoiceNumber={invoice.invoice_number}
                  size={120}
                />
              </div>
            )}
          </div>
        </footer>

      </div>
    </article>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetaCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-body text-[#94A3B8] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={['text-sm font-body font-semibold text-[#0F172A]', mono ? 'font-mono' : ''].join(' ')}>
        {value}
      </p>
    </div>
  );
}

interface PartyCardProps {
  title:    string;
  name:     string;
  trn?:     string;
  address?: string;
  phone?:   string;
  email?:   string;
  accent:   'primary' | 'secondary';
}

function PartyCard({ title, name, trn, address, phone, email, accent }: PartyCardProps) {
  const accentClasses = accent === 'primary'
    ? 'border-l-4 border-l-[#0F2B46]'
    : 'border-l-4 border-l-[#F59E0B]';

  return (
    <div className={`bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] ${accentClasses} p-4 space-y-1.5`}>
      <p className="text-[10px] font-body font-bold text-[#64748B] uppercase tracking-widest">{title}</p>
      <p className="font-body font-bold text-[#0F172A] text-sm">{name}</p>
      {address && (
        <p className="text-xs font-body text-[#64748B] leading-snug">{address}</p>
      )}
      {phone && (
        <p className="text-xs font-body text-[#64748B] flex items-center gap-1">
          <Phone className="size-2.5 shrink-0" aria-hidden="true" /> {phone}
        </p>
      )}
      {email && (
        <p className="text-xs font-body text-[#64748B] flex items-center gap-1">
          <Mail className="size-2.5 shrink-0" aria-hidden="true" /> {email}
        </p>
      )}
      {trn && (
        <p className="text-[10px] font-body font-semibold text-[#0F2B46] mt-1">TRN: {trn}</p>
      )}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-body text-[#64748B] flex items-center gap-1 shrink-0">
        {icon} {label}
      </p>
      <div className="text-right">{children}</div>
    </div>
  );
}

function ShipDetail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] text-white/50 font-body uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function TotalRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-[#64748B] font-body text-sm">{label}</td>
      <td className={[
        'px-4 py-2.5 text-right tabular-nums font-medium font-body text-sm',
        danger ? 'text-[#EF4444]' : 'text-[#0F172A]',
      ].join(' ')}>
        {value}
      </td>
    </tr>
  );
}

function VATBreakdownCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`text-center rounded-lg p-3 border ${highlight ? 'bg-[#0F2B46] border-[#0F2B46]' : 'bg-white border-[#16A34A]/20'}`}>
      <p className={`text-[10px] font-body uppercase tracking-wider mb-1 ${highlight ? 'text-white/70' : 'text-[#64748B]'}`}>{label}</p>
      <p className={`font-body font-extrabold ${highlight ? 'text-white text-lg' : 'text-[#0F172A] text-base'}`}>
        {value}
      </p>
    </div>
  );
}

function TermsGrid({ terms }: { terms: string }) {
  // Fall back to DEFAULT_TERMS if stored value is missing any of the 10 terms
  const parsed = terms.split('\n').map(l => l.trim()).filter(Boolean);
  const lines  = parsed.length >= 10 ? parsed : DEFAULT_TERMS.split('\n').map(l => l.trim()).filter(Boolean);
  const half   = Math.ceil(lines.length / 2);
  const left   = lines.slice(0, half);
  const right  = lines.slice(half);

  function TermItem({ line, num }: { line: string; num: number }) {
    const clean = line.replace(/^\d+\.\s*/, '');
    return (
      <div className="flex gap-2 text-[11px] font-body text-[#64748B] leading-relaxed">
        <span className="text-[#94A3B8] shrink-0 font-mono w-5 text-right">{num}.</span>
        <span>{clean}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
      <div className="space-y-1.5">
        {left.map((line, i) => <TermItem key={i} line={line} num={i + 1} />)}
      </div>
      <div className="space-y-1.5">
        {right.map((line, i) => <TermItem key={i} line={line} num={half + i + 1} />)}
      </div>
    </div>
  );
}

// ── QR code (client component within server-renderable parent) ────────────────

function InvoiceQRCode({
  qrUrl,
  invoiceNumber,
  size,
}: {
  qrUrl:         string;
  invoiceNumber: string;
  size:          number;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error,  setError]  = useState(false);
  const [genTime, setGenTime] = useState<string>('');

  useEffect(() => {
    // Format generation timestamp in GST (UTC+4)
    const now = new Date();
    const gstOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dubai',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    };
    setGenTime(now.toLocaleString('en-AE', gstOptions) + ' GST');
  }, []);

  useEffect(() => {
    if (!qrUrl) return;
    let cancelled = false;

    import('qrcode').then(QRCode =>
      QRCode.default.toDataURL(qrUrl, {
        width:  size * 2,
        margin: 1,
        color:  { dark: '#0F2B46', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
    ).then(dataUrl => {
      if (!cancelled) setImgSrc(dataUrl);
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => { cancelled = true; };
  }, [qrUrl, size]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="rounded-xl border-2 border-[#0F2B46]/15 overflow-hidden bg-white p-2 shadow-sm"
        style={{ width: size + 16, height: size + 16 }}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={`QR code to verify invoice ${invoiceNumber}`}
            width={size}
            height={size}
            className="rounded-md"
          />
        ) : error ? (
          <div className="flex items-center justify-center w-full h-full text-[#94A3B8] text-[10px] font-body text-center p-2">
            <AlertCircle className="size-4" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="size-5 text-[#94A3B8] animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="text-center space-y-0.5">
        <p className="flex items-center gap-1 text-[10px] font-body text-[#0F2B46] justify-center font-bold uppercase tracking-wider">
          <ShieldCheck className="size-3 text-[#10B981]" aria-hidden="true" />
          Verify Invoice
        </p>
        <p className="text-[9px] font-mono text-[#0F2B46] font-semibold">{invoiceNumber}</p>
        {genTime && (
          <p className="text-[9px] font-body text-[#94A3B8]">Generated: {genTime}</p>
        )}
      </div>
    </div>
  );
}

export default InvoiceDocument;
