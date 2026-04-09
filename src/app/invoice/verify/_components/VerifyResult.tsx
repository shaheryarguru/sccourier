import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CheckCircle2, XCircle, ShieldCheck, ShieldX,
  FileText, Calendar, Hash, Building2, ArrowRight,
  DollarSign, Banknote, FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo }   from '@/components/shared/Logo';
import { verifyQRSignature } from '@/lib/invoice/qr';
import { decodeQRPayload }   from '@/lib/utils/crypto';
import { formatAED, formatDate } from '@/lib/utils/format';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VerifyResultProps {
  data?:       string;
  sig?:        string;
  trackingId?: string;
}

// ── Server component — performs HMAC verification ─────────────────────────────

export async function VerifyResult({ data, sig, trackingId }: VerifyResultProps) {
  // ── Tracking ID shortcut: redirect to the invoice page directly ───────────
  // Used by the "View Invoice" button on the tracking page which passes
  // ?trackingId=SC... instead of QR ?data=...&sig=... params.
  if (!data || !sig) {
    if (trackingId) {
      const supabase = createAdminClient();
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('tracking_id', trackingId.toUpperCase())
        .eq('is_cancelled', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invoice?.id) {
        redirect(`/invoice/${invoice.id}`);
      }

      // Invoice doesn't exist yet for this shipment
      return <NoInvoiceCard trackingId={trackingId.toUpperCase()} />;
    }

    return (
      <InvalidCard
        message="This verification link is missing required parameters. Please scan the QR code directly from the original printed or digital invoice."
      />
    );
  }

  // Decode payload
  const payload = decodeQRPayload(data);
  if (!payload) {
    return (
      <InvalidCard
        message="The QR code data could not be decoded. The invoice may be corrupted or the link has been modified."
      />
    );
  }

  // Verify HMAC signature
  let isValid = false;
  try {
    isValid = await verifyQRSignature(data, sig);
  } catch {
    return <ErrorCard />;
  }

  if (!isValid) {
    return (
      <InvalidCard
        invoiceNumber={payload.invoiceNumber}
        message="The digital signature is invalid. This invoice may have been tampered with, or the QR code is from a fraudulent document. Do not accept this invoice."
      />
    );
  }

  // ── Valid ──────────────────────────────────────────────────────────────────
  const verifiedAt = new Date().toLocaleString('en-AE', {
    timeZone:    'Asia/Dubai',
    day:         '2-digit',
    month:       'short',
    year:        'numeric',
    hour:        '2-digit',
    minute:      '2-digit',
    hour12:      true,
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
      {/* Amber accent bar */}
      <div className="h-1.5 bg-[#F59E0B] w-full" aria-hidden="true" />

      {/* Success header */}
      <div className="bg-[#F0F9F4] border-b border-[#10B981]/20 px-6 py-8 text-center space-y-4">
        <div
          className="size-20 rounded-full bg-[#10B981]/15 border-2 border-[#10B981]/30 flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-10 text-[#10B981]" />
        </div>
        <div>
          <p className="font-heading font-bold text-2xl text-[#10B981]">Invoice Verified</p>
          <p className="text-sm font-body text-[#64748B] mt-1">
            This is an authentic SC Courier tax invoice
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-body font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          HMAC-SHA256 Signature Valid
        </div>
      </div>

      {/* Invoice summary */}
      <div className="p-6 space-y-3">
        <p className="text-[10px] font-body font-bold text-[#64748B] uppercase tracking-widest mb-4">
          Invoice Summary
        </p>

        <DetailRow
          icon={<Hash className="size-3.5" />}
          label="Invoice Number"
          value={payload.invoiceNumber}
          mono
        />
        <DetailRow
          icon={<Building2 className="size-3.5" />}
          label="Supplier TRN"
          value={payload.companyTRN}
          mono
        />
        <DetailRow
          icon={<Calendar className="size-3.5" />}
          label="Issue Date"
          value={formatDate(payload.issueDate)}
        />
        <DetailRow
          icon={<FileText className="size-3.5" />}
          label="Tracking ID"
          value={payload.trackingId}
          mono
        />

        <div className="border-t border-[#E5E7EB] pt-4 mt-4 grid grid-cols-2 gap-4">
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] p-3 text-center">
            <p className="text-[10px] font-body text-[#64748B] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Banknote className="size-3" /> VAT (5%)
            </p>
            <p className="font-body font-bold text-[#0F172A] text-base">
              {formatAED(payload.vatAmount)}
            </p>
          </div>
          <div className="bg-[#0F2B46] rounded-xl p-3 text-center">
            <p className="text-[10px] font-body text-white/60 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <DollarSign className="size-3" /> Total Amount
            </p>
            <p className="font-heading font-bold text-xl text-[#F59E0B]">
              {formatAED(payload.totalAmount)}
            </p>
          </div>
        </div>

        <p className="text-[10px] font-body text-[#94A3B8] border-t border-[#E5E7EB] pt-3 mt-2">
          Verified at {verifiedAt} (GST+4 · Dubai) · Secured by HMAC-SHA256
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex flex-col gap-2.5">
        <Link href={`/invoice/${payload.invoiceId}`}>
          <Button
            variant="primary"
            size="md"
            fullWidth
            rightIcon={<ArrowRight className="size-4" />}
          >
            View Full Invoice
          </Button>
        </Link>
        <Link href={`/tracking/${payload.trackingId}`}>
          <Button variant="outline" size="md" fullWidth>
            Track This Shipment
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" fullWidth>
            Back to SC Courier
          </Button>
        </Link>
      </div>

      {/* Footer branding */}
      <div className="border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-center gap-2">
        <Logo variant="icon" size="xs" theme="default" />
        <p className="text-[10px] font-body text-[#94A3B8]">
          sccourier.com · UAE FTA Decree-Law No. 8 of 2017
        </p>
      </div>
    </div>
  );
}

// ── Invalid card ──────────────────────────────────────────────────────────────

function InvalidCard({ message, invoiceNumber }: { message: string; invoiceNumber?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EF4444]/20 shadow-md overflow-hidden">
      <div className="h-1.5 bg-[#EF4444] w-full" aria-hidden="true" />
      <div className="bg-[#FEF2F2] border-b border-[#EF4444]/20 px-6 py-8 text-center space-y-4">
        <div className="size-20 rounded-full bg-[#EF4444]/10 border-2 border-[#EF4444]/25 flex items-center justify-center mx-auto" aria-hidden="true">
          <XCircle className="size-10 text-[#EF4444]" />
        </div>
        <div>
          <p className="font-heading font-bold text-2xl text-[#EF4444]">Verification Failed</p>
          {invoiceNumber && (
            <p className="text-sm font-mono text-[#64748B] mt-1">{invoiceNumber}</p>
          )}
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-xs font-body font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
          <ShieldX className="size-3.5" aria-hidden="true" />
          Signature Invalid
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm font-body text-[#64748B] leading-relaxed">{message}</p>
        <div className="bg-[#FEF2F2] rounded-xl p-4 border border-[#EF4444]/15">
          <p className="text-xs font-body text-[#EF4444] font-bold mb-1.5">What to do</p>
          <p className="text-xs font-body text-[#64748B] leading-relaxed">
            If you received this invoice from SC Courier, please contact us immediately at{' '}
            <strong>info@sccourier.com</strong> or call <strong>+971 4 000 0000</strong> with the invoice number.
            Do not make any payment based on an unverified invoice.
          </p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="md" fullWidth>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

// ── No invoice card ───────────────────────────────────────────────────────────

function NoInvoiceCard({ trackingId }: { trackingId: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
      <div className="h-1.5 bg-[#F59E0B] w-full" aria-hidden="true" />
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB] px-6 py-8 text-center space-y-4">
        <div className="size-20 rounded-full bg-[#0F2B46]/8 border-2 border-[#0F2B46]/15 flex items-center justify-center mx-auto" aria-hidden="true">
          <FileSearch className="size-10 text-[#0F2B46]" />
        </div>
        <div>
          <p className="font-heading font-bold text-2xl text-[#0F2B46]">No Invoice Yet</p>
          <p className="font-mono text-sm text-[#64748B] mt-1">{trackingId}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#92400E] text-xs font-body font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
          Invoice Not Generated
        </div>
      </div>
      <div className="p-6 space-y-4">
        <p className="text-sm font-body text-[#64748B] leading-relaxed">
          An invoice has not been generated for shipment{' '}
          <span className="font-mono font-semibold text-[#0F2B46]">{trackingId}</span> yet.
          Invoices are typically issued after the booking is confirmed.
        </p>
        <div className="flex flex-col gap-2.5">
          <Link href={`/tracking/${trackingId}`}>
            <Button variant="primary" size="md" fullWidth rightIcon={<ArrowRight className="size-4" />}>
              Track This Shipment
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="md" fullWidth>Back to Home</Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-center gap-2">
        <Logo variant="icon" size="xs" theme="default" />
        <p className="text-[10px] font-body text-[#94A3B8]">sccourier.com · UAE FTA Decree-Law No. 8 of 2017</p>
      </div>
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────

function ErrorCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center space-y-4">
      <div className="h-1.5 bg-[#F59E0B] w-full absolute top-0 left-0 rounded-t-2xl" />
      <XCircle className="size-10 text-[#94A3B8] mx-auto" aria-hidden="true" />
      <div>
        <p className="font-heading font-semibold text-[#0F172A] text-lg">Verification Error</p>
        <p className="text-sm font-body text-[#64748B] mt-1">
          An error occurred while verifying this invoice. Please try again or contact support.
        </p>
      </div>
      <Link href="/">
        <Button variant="ghost" size="sm">Back to Home</Button>
      </Link>
    </div>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value, mono }: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <p className="text-xs font-body text-[#94A3B8] flex items-center gap-1.5 shrink-0">
        {icon} {label}
      </p>
      <p className={[
        'text-sm font-body text-[#0F172A] text-right',
        mono ? 'font-mono font-semibold' : 'font-medium',
      ].join(' ')}>
        {value}
      </p>
    </div>
  );
}
