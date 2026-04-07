'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, FileText, Search, Filter, ChevronDown, RefreshCw,
  Eye, Pencil, Trash2, Copy, MoreVertical, RotateCcw,
  X, Download,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge, DataTable, useToast } from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { formatAED, formatDate, slugToLabel } from '@/lib/utils/format';
import { SHIPMENT_STATUSES, SERVICE_TYPES } from '@/lib/utils/constants';
import type { BookingRow, BookingStatus, ServiceType } from '@/lib/types/database';
import { ViewPanel }   from './_components/ViewPanel';
import { EditPanel }   from './_components/EditPanel';
import { DeleteModal } from './_components/DeleteModal';

const PAGE_SIZE = 20;

// ── Badge helper ──────────────────────────────────────────────────────────────

function bookingBadge(status: BookingStatus) {
  if (status === 'pending') return <Badge variant="neutral" size="sm" dot label="Pending" />;
  return <Badge variant={status} size="sm" dot />;
}

// ── Row action menu (three-dot dropdown for mobile, icons for desktop) ────────

function RowActions({
  booking,
  actionLoading,
  onView,
  onEdit,
  onDelete,
  onInvoice,
  onDuplicate,
}: {
  booking: BookingRow;
  actionLoading: string | null;
  onView:      (b: BookingRow) => void;
  onEdit:      (b: BookingRow) => void;
  onDelete:    (b: BookingRow) => void;
  onInvoice:   (id: string)   => void;
  onDuplicate: (id: string)   => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const busy = actionLoading === booking.id;
  const btnCls = 'p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40';

  return (
    <div className="flex items-center gap-0.5">
      {/* Desktop: show icons inline */}
      <div className="hidden sm:flex items-center gap-0.5">
        <button type="button" title="View" className={btnCls} onClick={() => onView(booking)}>
          <Eye className="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" title="Edit" className={btnCls} onClick={() => onEdit(booking)}>
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" title="Delete" className={`${btnCls} hover:text-danger`} onClick={() => onDelete(booking)}>
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" title="Invoice" disabled={busy} className={btnCls} onClick={() => onInvoice(booking.id)}>
          <FileText className="size-3.5" aria-hidden="true" />
        </button>
        <button type="button" title="Duplicate" disabled={busy} className={btnCls} onClick={() => onDuplicate(booking.id)}>
          <Copy className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile: three-dot menu */}
      <div className="relative sm:hidden" ref={ref}>
        <button
          type="button"
          title="Actions"
          className={btnCls}
          onClick={() => setOpen(o => !o)}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <MoreVertical className="size-3.5" aria-hidden="true" />
        </button>
        {open && (
          <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-border rounded-xl shadow-lg py-1 text-sm font-body">
            {[
              { label: 'View details', icon: Eye,       action: () => { onView(booking); setOpen(false); } },
              { label: 'Edit',         icon: Pencil,    action: () => { onEdit(booking); setOpen(false); } },
              { label: 'Delete',       icon: Trash2,    action: () => { onDelete(booking); setOpen(false); } },
              { label: 'Invoice',      icon: FileText,  action: () => { onInvoice(booking.id); setOpen(false); } },
              { label: 'Duplicate',    icon: Copy,      action: () => { onDuplicate(booking.id); setOpen(false); } },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface text-text-primary transition-colors"
              >
                <Icon className="size-3.5 text-text-secondary" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick backdate popover ─────────────────────────────────────────────────────

function BackdatePopover({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingRow;
  onClose: () => void;
  onDone:  (updated: BookingRow) => void;
}) {
  const currentDate = booking.created_at.split('T')[0];
  const [date, setDate]             = useState(currentDate);
  const [regenId, setRegenId]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const { success, error: toastError } = useToast();

  async function handleUpdate() {
    if (!date || date === currentDate) { onClose(); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/booking/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_date: date, regenerate_tracking_id: regenId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toastError('Backdate failed', json.message ?? 'Could not update date');
        return;
      }
      success('Date updated', `Booking backdated to ${date}`);
      onDone(json.booking as BookingRow);
    } catch {
      toastError('Backdate failed', 'Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-5 w-80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-primary">Change Booking Date</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-text-secondary transition-colors">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="font-mono text-xs text-text-secondary">{booking.booking_number}</p>
        <div>
          <label className="block text-xs font-body font-medium text-text-secondary mb-1">New Date</label>
          <input
            type="date"
            className="w-full h-9 px-3 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={regenId} onChange={e => setRegenId(e.target.checked)} className="rounded border-border accent-primary" />
          <span className="text-xs font-body text-text-primary">Update Tracking ID &amp; Booking # to new date</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving || !date}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-body font-semibold bg-primary text-white py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />}
            Update Date
          </button>
          <button type="button" onClick={onClose} className="px-3 text-sm font-body font-medium bg-surface border border-border text-text-primary rounded-xl hover:bg-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings]             = useState<BookingRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [serviceFilter, setServiceFilter]   = useState('');
  const [showDeleted, setShowDeleted]       = useState(false);
  const [checkedIds, setCheckedIds]         = useState<Set<string>>(new Set());

  // Panel state
  const [viewBooking, setViewBooking]       = useState<BookingRow | null>(null);
  const [editBooking, setEditBooking]       = useState<BookingRow | null>(null);
  const [deleteBooking, setDeleteBooking]   = useState<BookingRow | null>(null);
  const [backdateBooking, setBackdateBooking] = useState<BookingRow | null>(null);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { success, error: toastError, info } = useToast();

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter, serviceFilter, showDeleted]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let q = supabase.from('bookings').select('*', { count: 'exact' });

    // Soft delete filter
    q = q.eq('is_deleted', showDeleted);

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim();
      q = q.or(`booking_number.ilike.%${s}%,tracking_id.ilike.%${s}%,sender_name.ilike.%${s}%,receiver_name.ilike.%${s}%,sender_phone.ilike.%${s}%,receiver_phone.ilike.%${s}%`);
    }
    if (statusFilter)  q = q.eq('status',       statusFilter as BookingStatus);
    if (serviceFilter) q = q.eq('service_type',  serviceFilter as ServiceType);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: qErr } = await q
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (qErr) { setError(qErr.message); }
    else { setBookings((data ?? []) as BookingRow[]); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, serviceFilter, showDeleted]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Action handlers ───────────────────────────────────────────────────────

  async function handleGenerateInvoice(bookingId: string) {
    setActionLoading(bookingId);
    try {
      const res  = await fetch('/api/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId }) });
      const json = await res.json();
      if (res.status === 409) {
        const existingId: string | null = json.existingInvoiceId ?? null;
        if (existingId) { window.open(`/invoice/${existingId}`, '_blank'); success('Invoice exists', 'Opening existing invoice…'); }
        else { toastError('Invoice exists', 'An invoice already exists for this booking.'); }
      } else if (!res.ok) {
        const details: Array<{ message: string }> | undefined = json.details;
        toastError('Invoice failed', details?.length ? `Validation: ${details.map((d: {message:string}) => d.message).join('; ')}` : (json.message ?? 'Could not generate invoice'));
      } else {
        success('Invoice created', `Invoice ${json.invoiceNumber} generated`);
        fetchBookings();
      }
    } catch { toastError('Invoice failed', 'Network error'); }
    finally { setActionLoading(null); }
  }

  async function handleDuplicate(bookingId: string) {
    setActionLoading(bookingId);
    try {
      const res  = await fetch(`/api/booking/${bookingId}/duplicate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toastError('Duplicate failed', json.message ?? 'Could not duplicate'); return; }
      success('Booking duplicated', `New booking: ${json.bookingNumber}`);
      fetchBookings();
    } catch { toastError('Duplicate failed', 'Network error'); }
    finally { setActionLoading(null); }
  }

  async function handleRestore(bookingId: string) {
    setActionLoading(bookingId);
    try {
      const res  = await fetch(`/api/booking/${bookingId}/restore`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) { toastError('Restore failed', json.message ?? 'Could not restore'); return; }
      success('Booking restored', `${json.booking.booking_number} is active again`);
      fetchBookings();
    } catch { toastError('Restore failed', 'Network error'); }
    finally { setActionLoading(null); }
  }

  function handleDeleted(id: string) {
    setDeleteBooking(null);
    setViewBooking(null);
    fetchBookings();
    setCheckedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function handleSaved(updated: BookingRow) {
    setEditBooking(null);
    setViewBooking(null);
    fetchBookings();
  }

  function handleBackdateDone(updated: BookingRow) {
    setBackdateBooking(null);
    fetchBookings();
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  function toggleCheck(id: string) {
    setCheckedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (checkedIds.size === bookings.length) { setCheckedIds(new Set()); }
    else { setCheckedIds(new Set(bookings.map(b => b.id))); }
  }

  async function handleBulkDelete() {
    if (!checkedIds.size) return;
    if (!confirm(`Soft-delete ${checkedIds.size} selected booking(s)?`)) return;
    const ids = Array.from(checkedIds);
    let done = 0;
    for (const id of ids) {
      const res = await fetch(`/api/booking/${id}`, { method: 'DELETE' });
      if (res.ok) done++;
    }
    success('Deleted', `${done} booking(s) deleted`);
    setCheckedIds(new Set());
    fetchBookings();
  }

  async function handleBulkStatus(newStatus: string) {
    if (!checkedIds.size || !newStatus) return;
    const ids = Array.from(checkedIds);
    let done = 0;
    for (const id of ids) {
      const res = await fetch(`/api/booking/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) done++;
    }
    success('Status updated', `${done} booking(s) set to ${newStatus}`);
    setCheckedIds(new Set());
    fetchBookings();
  }

  function handleExportCSV() {
    const selected = bookings.filter(b => checkedIds.has(b.id));
    const rows = [
      ['Booking #', 'Tracking ID', 'Status', 'Sender', 'Receiver', 'Service', 'Amount', 'Date'],
      ...selected.map(b => [
        b.booking_number, b.tracking_id, b.status,
        `${b.sender_name} (${b.sender_city})`,
        `${b.receiver_name} (${b.receiver_city}, ${b.receiver_country})`,
        b.service_type,
        b.total_amount.toFixed(2),
        b.created_at.split('T')[0],
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'bookings-export.csv'; a.click();
    URL.revokeObjectURL(url);
    info('Exported', `${selected.length} booking(s) exported`);
  }

  // ── Table columns ─────────────────────────────────────────────────────────

  const allChecked = bookings.length > 0 && checkedIds.size === bookings.length;
  const someChecked = checkedIds.size > 0 && !allChecked;

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: '_check',
      header: (
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = someChecked; }}
          onChange={toggleAll}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          aria-label="Select all"
        />
      ) as unknown as string,
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <input
            type="checkbox"
            checked={checkedIds.has(b.id)}
            onChange={() => toggleCheck(b.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            aria-label={`Select ${b.booking_number}`}
          />
        );
      },
    },
    {
      key: 'booking_number',
      header: 'Booking #',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <button type="button" onClick={() => setViewBooking(b)} className="font-mono font-medium text-primary text-xs hover:underline text-left">
            {b.booking_number}
          </button>
        );
      },
    },
    {
      key: 'tracking_id',
      header: 'Tracking ID',
      render: (row) => (
        <span className="font-mono text-xs text-text-secondary">{(row as unknown as BookingRow).tracking_id}</span>
      ),
    },
    {
      key: 'sender_name',
      header: 'Sender',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <div>
            <p className="font-body text-sm text-text-primary truncate max-w-[130px]">{b.sender_name}</p>
            <p className="font-body text-xs text-text-disabled">{b.sender_city}</p>
          </div>
        );
      },
    },
    {
      key: 'receiver_name',
      header: 'Receiver',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <div>
            <p className="font-body text-sm text-text-primary truncate max-w-[130px]">{b.receiver_name}</p>
            <p className="font-body text-xs text-text-disabled">{b.receiver_city}, {b.receiver_country}</p>
          </div>
        );
      },
    },
    {
      key: 'service_type',
      header: 'Service',
      render: (row) => <span className="text-xs font-body text-text-secondary capitalize">{slugToLabel((row as unknown as BookingRow).service_type)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <div className="flex items-center gap-1.5">
            {bookingBadge(b.status)}
            {b.is_deleted && <span className="text-[10px] font-body text-danger font-medium bg-danger/10 px-1.5 py-0.5 rounded">deleted</span>}
          </div>
        );
      },
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-body font-semibold text-text-primary tabular-nums text-sm">
          {formatAED((row as unknown as BookingRow).total_amount)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row) => (
        <span className="text-xs font-body text-text-disabled whitespace-nowrap">
          {formatDate((row as unknown as BookingRow).created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const b = row as unknown as BookingRow;
        if (b.is_deleted) {
          return (
            <button
              type="button"
              disabled={actionLoading === b.id}
              onClick={() => handleRestore(b.id)}
              title="Restore"
              className="p-1.5 rounded-lg hover:bg-surface text-accent hover:text-accent/80 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </button>
          );
        }
        return (
          <RowActions
            booking={b}
            actionLoading={actionLoading}
            onView={setViewBooking}
            onEdit={setEditBooking}
            onDelete={setDeleteBooking}
            onInvoice={handleGenerateInvoice}
            onDuplicate={handleDuplicate}
          />
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-screen-2xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-primary">Bookings</h1>
          <p className="text-sm font-body text-text-secondary mt-0.5">
            {total.toLocaleString()} {showDeleted ? 'deleted' : 'active'} booking{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDeleted(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-2 rounded-xl border transition-colors ${showDeleted ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-surface border-border text-text-primary hover:bg-white'}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </button>
          <button type="button" onClick={fetchBookings} disabled={loading} className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <Link href="/booking" className="flex items-center gap-1.5 text-xs font-body font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            <Plus className="size-3.5" aria-hidden="true" /> New Booking
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-sm font-body text-danger">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search booking #, tracking ID, name, phone…"
            className="w-full h-9 pl-9 pr-4 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors placeholder:text-text-disabled"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 pl-8 pr-8 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors appearance-none text-text-primary min-w-[150px]"
          >
            <option value="">All statuses</option>
            {(Object.keys(SHIPMENT_STATUSES) as BookingStatus[]).map(s => (
              <option key={s} value={s}>{SHIPMENT_STATUSES[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors appearance-none text-text-primary min-w-[140px]"
          >
            <option value="">All services</option>
            {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
        </div>
        {(statusFilter || serviceFilter || debouncedSearch) && (
          <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); setServiceFilter(''); }} className="h-9 px-3 text-xs font-body font-medium text-danger hover:bg-danger/5 rounded-xl transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={bookings as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        emptyMessage={showDeleted ? 'No deleted bookings.' : 'No bookings found. Try adjusting your filters.'}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        caption="Bookings table"
      />

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-primary text-white rounded-2xl shadow-xl px-4 py-3 text-sm font-body">
          <span className="font-semibold">{checkedIds.size} selected</span>
          <div className="w-px h-4 bg-white/30 mx-1" />

          {/* Bulk status change */}
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { handleBulkStatus(e.target.value); e.target.value = ''; } }}
            className="h-8 px-2 text-xs bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none"
          >
            <option value="" disabled className="text-text-primary bg-white">Change status…</option>
            {Object.entries(SHIPMENT_STATUSES).map(([val, cfg]) => (
              <option key={val} value={val} className="text-text-primary bg-white">{cfg.label}</option>
            ))}
          </select>

          <button type="button" onClick={handleExportCSV} className="flex items-center gap-1 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
            <Download className="size-3.5" aria-hidden="true" /> Export CSV
          </button>
          <button type="button" onClick={handleBulkDelete} className="flex items-center gap-1 text-xs font-semibold bg-danger/80 hover:bg-danger px-3 py-1.5 rounded-lg transition-colors">
            <Trash2 className="size-3.5" aria-hidden="true" /> Delete
          </button>
          <button type="button" onClick={() => setCheckedIds(new Set())} className="ml-1 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Clear selection">
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Panels & modals */}
      {viewBooking && (
        <ViewPanel
          booking={viewBooking}
          onClose={() => setViewBooking(null)}
          onEdit={b => { setViewBooking(null); setEditBooking(b); }}
          onDelete={b => { setViewBooking(null); setDeleteBooking(b); }}
          onGenerateInvoice={handleGenerateInvoice}
        />
      )}

      {editBooking && (
        <EditPanel
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={handleSaved}
        />
      )}

      <DeleteModal
        booking={deleteBooking}
        onClose={() => setDeleteBooking(null)}
        onDeleted={handleDeleted}
      />

      {backdateBooking && (
        <BackdatePopover
          booking={backdateBooking}
          onClose={() => setBackdateBooking(null)}
          onDone={handleBackdateDone}
        />
      )}
    </div>
  );
}
