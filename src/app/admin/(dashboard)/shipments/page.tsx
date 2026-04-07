'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, ChevronDown, RefreshCw, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge, DataTable } from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { formatDate } from '@/lib/utils/format';
import { SHIPMENT_STATUSES } from '@/lib/utils/constants';
import type { BookingRow, BookingStatus, TrackingEventRow } from '@/lib/types/database';
import { StatusUpdatePanel } from './_components/StatusUpdatePanel';

const PAGE_SIZE = 20;

const TERMINAL_STATUSES: BookingStatus[] = ['delivered', 'returned', 'cancelled'];

function bookingBadge(status: BookingStatus) {
  if (status === 'pending') return <Badge variant="neutral" size="sm" dot label="Pending" />;
  return <Badge variant={status} size="sm" dot />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShipmentsPage() {
  const [bookings, setBookings]         = useState<BookingRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [selected, setSelected]         = useState<BookingRow | null>(null);
  const [events, setEvents]             = useState<TrackingEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter, showTerminal]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let q = supabase.from('bookings').select('*', { count: 'exact' });

    if (!showTerminal) {
      q = q.not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`);
    }
    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim();
      q = q.or(`booking_number.ilike.%${s}%,tracking_id.ilike.%${s}%,sender_name.ilike.%${s}%,receiver_name.ilike.%${s}%`);
    }
    if (statusFilter) q = q.eq('status', statusFilter as BookingStatus);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: qErr } = await q
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (qErr) setError(qErr.message);
    else { setBookings((data ?? []) as BookingRow[]); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, debouncedSearch, statusFilter, showTerminal]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const fetchEvents = useCallback(async (bookingId: string) => {
    setEventsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('booking_id', bookingId)
      .order('event_timestamp', { ascending: false });
    setEvents((data ?? []) as TrackingEventRow[]);
    setEventsLoading(false);
  }, []);

  function handleRowClick(b: BookingRow) {
    setSelected(b);
    fetchEvents(b.id);
  }

  // When a status update or detail edit completes, re-fetch the booking row
  // so the panel header badge reflects the new status.
  const handleUpdated = useCallback(async () => {
    fetchBookings();
    if (selected) {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', selected.id)
        .single();
      if (data) setSelected(data as BookingRow);
    }
  }, [fetchBookings, selected]);

  const handleRefreshEvents = useCallback(() => {
    if (selected) fetchEvents(selected.id);
  }, [fetchEvents, selected]);

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'tracking_id',
      header: 'Tracking ID',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleRowClick(row as unknown as BookingRow)}
          className="font-mono font-semibold text-primary text-xs hover:underline"
        >
          {(row as unknown as BookingRow).tracking_id}
        </button>
      ),
    },
    {
      key: 'booking_number',
      header: 'Booking #',
      render: (row) => <span className="font-mono text-xs text-text-secondary">{(row as unknown as BookingRow).booking_number}</span>,
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <div className="text-xs font-body">
            <span className="text-text-primary">{b.sender_city}</span>
            <span className="text-text-disabled mx-1">→</span>
            <span className="text-text-primary">{b.receiver_city}</span>
          </div>
        );
      },
    },
    {
      key: 'sender_name',
      header: 'Sender / Receiver',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <div className="text-xs font-body">
            <p className="text-text-primary truncate max-w-[120px]">{b.sender_name}</p>
            <p className="text-text-disabled truncate max-w-[120px]">{b.receiver_name}</p>
          </div>
        );
      },
    },
    {
      key: 'service_type',
      header: 'Service',
      render: (row) => {
        const s = (row as unknown as BookingRow).service_type;
        return <span className="text-xs font-body text-text-secondary capitalize">{s.replace(/_/g, ' ')}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => bookingBadge((row as unknown as BookingRow).status),
    },
    {
      key: 'updated_at',
      header: 'Last Update',
      render: (row) => (
        <span className="text-xs font-body text-text-disabled whitespace-nowrap">
          {formatDate((row as unknown as BookingRow).updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const b = row as unknown as BookingRow;
        return (
          <button
            type="button"
            onClick={() => handleRowClick(b)}
            className="flex items-center gap-1 text-xs font-body font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Truck className="size-3.5" aria-hidden="true" />
            Manage
          </button>
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
          <h1 className="font-heading font-bold text-2xl text-primary">Shipments</h1>
          <p className="text-sm font-body text-text-secondary mt-0.5">
            {total.toLocaleString()} shipment{total !== 1 ? 's' : ''}
            {!showTerminal && ' · active only'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tracking ID, booking #, sender/receiver…"
            className="w-full h-9 pl-9 pr-4 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors placeholder:text-text-disabled"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 pl-8 pr-8 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary transition-colors appearance-none text-text-primary min-w-[150px]"
          >
            <option value="">All statuses</option>
            {(Object.keys(SHIPMENT_STATUSES) as BookingStatus[]).map(s => (
              <option key={s} value={s}>{SHIPMENT_STATUSES[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-disabled pointer-events-none" aria-hidden="true" />
        </div>

        <label className="flex items-center gap-2 text-sm font-body text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showTerminal}
            onChange={e => setShowTerminal(e.target.checked)}
            className="rounded border-border text-secondary focus:ring-secondary/20"
          />
          Show delivered / returned / cancelled
        </label>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={bookings as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        emptyMessage={showTerminal ? 'No shipments found.' : 'No active shipments. All deliveries may be completed!'}
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        caption="Shipments table"
      />

      {/* Status update / management panel */}
      {selected && (
        <StatusUpdatePanel
          booking={selected}
          events={events}
          eventsLoading={eventsLoading}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onRefreshEvents={handleRefreshEvents}
        />
      )}
    </div>
  );
}
