'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, X, FileText, Download, CheckCircle2, Ban,
  ChevronDown, RefreshCw, Eye, Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge, DataTable, useToast } from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { formatAED, formatDate, formatDateTime } from '@/lib/utils/format';
import type { InvoiceRow, InvoicePaymentStatus } from '@/lib/types/database';
import { markInvoicePaid, cancelInvoice } from './actions';

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<InvoicePaymentStatus, string> = {
  unpaid:   'Unpaid',
  paid:     'Paid',
  partial:  'Partial',
  overdue:  'Overdue',
  refunded: 'Refunded',
};

// ── Generate Invoice Modal ────────────────────────────────────────────────────

interface EligibleBooking {
  id:             string;
  booking_number: string;
  tracking_id:    string;
  sender_name:    string;
  total_amount:   number;
  status:         string;
  created_at:     string;
}

function GenerateInvoiceModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void;
  onCreated: (invoiceNumber: string) => void;
}) {
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [loadingBookings, setLoadingBookings]   = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [notes, setNotes]                       = useState('');
  const [dueDate, setDueDate]                   = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [fetchError, setFetchError]             = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Get all invoice booking IDs (non-cancelled)
      const { data: invoicedData } = await supabase
        .from('invoices')
        .select('booking_id')
        .eq('is_cancelled', false);

      const invoicedSet = new Set(
        (invoicedData ?? []).map(i => i.booking_id).filter(Boolean)
      );

      // Get eligible bookings
      const { data: allBookings, error: err } = await supabase
        .from('bookings')
        .select('id, booking_number, tracking_id, sender_name, total_amount, status, created_at')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(100);

      if (err) {
        setFetchError(err.message);
      } else {
        const eligible = (allBookings ?? []).filter(b => !invoicedSet.has(b.id));
        setEligibleBookings(eligible as EligibleBooking[]);
      }
      setLoadingBookings(false);
    }
    load();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBookingId) return;
    setSubmitting(true);

    const body: Record<string, unknown> = { bookingId: selectedBookingId };
    if (notes.trim())  body.notes   = notes.trim();
    if (dueDate)       body.dueDate = dueDate;

    const res = await fetch('/api/invoice', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();

    if (res.status === 409) {
      const existingId: string | null = json.existingInvoiceId ?? null;
      if (existingId) {
        window.open(`/invoice/${existingId}`, '_blank');
        success('Invoice exists', 'Opening existing invoice…');
        onClose();
      } else {
        toastError('Invoice exists', 'An invoice already exists for this booking.');
      }
    } else if (!res.ok) {
      const details: Array<{ message: string }> | undefined = json.details;
      const msg = details?.length
        ? `Validation: ${details.map(d => d.message).join('; ')}`
        : (json.message ?? 'Could not generate invoice');
      toastError('Invoice failed', msg);
    } else {
      success('Invoice created', `${json.invoiceNumber} — ${formatAED(json.totalAmount)}`);
      onCreated(json.invoiceNumber as string);
      onClose();
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-label="Generate invoice">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-primary">Generate Invoice</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {fetchError && (
            <p className="text-sm font-body text-danger bg-danger/5 rounded-xl px-4 py-3">{fetchError}</p>
          )}

          {/* Booking selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-body font-medium text-text-primary" htmlFor="booking-select">
              Select Booking <span className="text-danger">*</span>
            </label>
            {loadingBookings ? (
              <div className="h-10 bg-surface rounded-xl animate-pulse" />
            ) : eligibleBookings.length === 0 ? (
              <p className="text-sm font-body text-text-secondary italic">
                No bookings without invoices found.
              </p>
            ) : (
              <div className="relative">
                <select
                  id="booking-select"
                  required
                  value={selectedBookingId}
                  onChange={e => setSelectedBookingId(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors appearance-none"
                >
                  <option value="" disabled>Choose a booking…</option>
                  {eligibleBookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.booking_number} · {b.sender_name} · {formatAED(b.total_amount)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-sm font-body font-medium text-text-primary" htmlFor="due-date">
              Due Date <span className="text-text-disabled font-normal">(optional)</span>
            </label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-10 px-3 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-body font-medium text-text-primary" htmlFor="inv-notes">
              Notes <span className="text-text-disabled font-normal">(optional)</span>
            </label>
            <textarea
              id="inv-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes for this invoice"
              className="w-full px-3 py-2.5 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors placeholder:text-text-disabled resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 bg-surface border border-border text-text-primary font-body font-semibold text-sm rounded-xl hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedBookingId || loadingBookings}
              className="flex-1 h-10 bg-primary text-white font-body font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="size-4" aria-hidden="true" />
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Mark Paid Modal ───────────────────────────────────────────────────────────

function MarkPaidModal({
  invoice,
  onClose,
  onPaid,
}: {
  invoice:  InvoiceRow;
  onClose:  () => void;
  onPaid:   () => void;
}) {
  const [ref, setRef]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { success, error: toastError } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await markInvoicePaid(invoice.id, ref.trim() || undefined);
    if (result.success) {
      success('Invoice marked paid', invoice.invoice_number);
      onPaid();
      onClose();
    } else {
      toastError('Failed', result.error);
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-primary">Mark as Paid</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-surface rounded-xl p-4">
            <p className="text-sm font-body text-text-secondary">Invoice</p>
            <p className="font-heading font-bold text-primary">{invoice.invoice_number}</p>
            <p className="font-body font-semibold text-lg text-text-primary mt-1">{formatAED(invoice.total_amount)}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-body font-medium text-text-primary" htmlFor="pay-ref">
              Payment Reference <span className="text-text-disabled font-normal">(optional)</span>
            </label>
            <input
              id="pay-ref"
              type="text"
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="Transaction ID, cheque number, etc."
              className="w-full h-10 px-3 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors placeholder:text-text-disabled"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 bg-surface border border-border text-text-primary font-body font-semibold text-sm rounded-xl hover:bg-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 bg-accent text-white font-body font-semibold text-sm rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting
                ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                : <><CheckCircle2 className="size-4" aria-hidden="true" /> Mark Paid</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices]             = useState<InvoiceRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<InvoicePaymentStatus | ''>('');
  const [showGenerate, setShowGenerate]     = useState(false);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<InvoiceRow | null>(null);
  const [cancellingId, setCancellingId]     = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let q = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('is_cancelled', false);

    if (search.trim()) {
      const s = search.trim();
      q = q.or(`invoice_number.ilike.%${s}%,tracking_id.ilike.%${s}%,customer_name.ilike.%${s}%`);
    }
    if (statusFilter) q = q.eq('payment_status', statusFilter);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: qErr } = await q
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (qErr) setError(qErr.message);
    else { setInvoices((data ?? []) as InvoiceRow[]); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function handleCancel(invoiceId: string, invoiceNumber: string) {
    const reason = prompt(`Reason for cancelling ${invoiceNumber}:`);
    if (!reason?.trim()) return;
    setCancellingId(invoiceId);
    const result = await cancelInvoice(invoiceId, reason.trim());
    if (result.success) {
      success('Invoice cancelled', invoiceNumber);
      fetchInvoices();
    } else {
      toastError('Cancel failed', result.error);
    }
    setCancellingId(null);
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (row) => {
        const inv = row as unknown as InvoiceRow;
        return (
          <Link
            href={`/invoice/${inv.id}`}
            className="font-mono font-semibold text-primary text-xs hover:underline"
            target="_blank"
          >
            {inv.invoice_number}
          </Link>
        );
      },
    },
    {
      key: 'tracking_id',
      header: 'Tracking ID',
      render: (row) => (
        <span className="font-mono text-xs text-text-secondary">
          {(row as unknown as InvoiceRow).tracking_id}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (row) => {
        const inv = row as unknown as InvoiceRow;
        return (
          <div>
            <p className="font-body text-sm text-text-primary truncate max-w-[130px]">{inv.customer_name}</p>
            {inv.customer_email && (
              <p className="font-body text-xs text-text-disabled truncate max-w-[130px]">{inv.customer_email}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (row) => (
        <span className="font-body text-sm text-text-secondary tabular-nums">
          {formatAED((row as unknown as InvoiceRow).subtotal)}
        </span>
      ),
    },
    {
      key: 'vat_amount',
      header: 'VAT (5%)',
      render: (row) => (
        <span className="font-body text-sm text-text-secondary tabular-nums">
          {formatAED((row as unknown as InvoiceRow).vat_amount)}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (row) => (
        <span className="font-body font-semibold text-text-primary tabular-nums text-sm">
          {formatAED((row as unknown as InvoiceRow).total_amount)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (row) => {
        const inv = row as unknown as InvoiceRow;
        return <Badge variant={inv.payment_status} size="sm" dot />;
      },
    },
    {
      key: 'issue_date',
      header: 'Date',
      render: (row) => (
        <span className="text-xs font-body text-text-disabled whitespace-nowrap">
          {formatDate((row as unknown as InvoiceRow).issue_date)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const inv = row as unknown as InvoiceRow;
        return (
          <div className="flex items-center gap-1">
            <Link
              href={`/invoice/${inv.id}`}
              target="_blank"
              className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              title="View invoice"
            >
              <Eye className="size-3.5" aria-hidden="true" />
            </Link>
            <a
              href={`/api/invoice/pdf?id=${inv.id}`}
              target="_blank"
              className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              title="Download PDF"
            >
              <Download className="size-3.5" aria-hidden="true" />
            </a>
            {inv.payment_status !== 'paid' && (
              <button
                type="button"
                onClick={() => setMarkPaidInvoice(inv)}
                className="p-1.5 rounded-lg hover:bg-surface text-accent hover:text-accent/80 transition-colors"
                title="Mark as paid"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCancel(inv.id, inv.invoice_number)}
              disabled={cancellingId === inv.id}
              className="p-1.5 rounded-lg hover:bg-surface text-danger hover:text-danger/80 transition-colors disabled:opacity-40"
              title="Cancel invoice"
            >
              <Ban className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-screen-2xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-primary">Invoices</h1>
          <p className="text-sm font-body text-text-secondary mt-0.5">
            {total.toLocaleString()} invoice{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-3.5" aria-hidden="true" /> Generate Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-sm font-body text-danger">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            placeholder="Search invoice #, tracking ID, customer…"
            className="w-full h-9 pl-9 pr-4 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors placeholder:text-text-disabled"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as InvoicePaymentStatus | '')}
            className="h-9 pl-3 pr-8 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary transition-colors appearance-none text-text-primary min-w-[140px]"
          >
            <option value="">All statuses</option>
            {(Object.keys(PAYMENT_STATUS_LABELS) as InvoicePaymentStatus[]).map(s => (
              <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        emptyMessage="No invoices found. Generate one from a booking."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        caption="Invoices table"
      />

      {/* Modals */}
      {showGenerate && (
        <GenerateInvoiceModal
          onClose={() => setShowGenerate(false)}
          onCreated={() => { fetchInvoices(); }}
        />
      )}
      {markPaidInvoice && (
        <MarkPaidModal
          invoice={markPaidInvoice}
          onClose={() => setMarkPaidInvoice(null)}
          onPaid={fetchInvoices}
        />
      )}
    </div>
  );
}
