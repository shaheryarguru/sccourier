'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Search, RefreshCw, User, Phone, Mail, MapPin,
  Building2, Package, Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DataTable, Badge, useToast } from '@/components/ui';
import type { TableColumn } from '@/components/ui';
import { formatDate, formatDateTime, formatAED, slugToLabel } from '@/lib/utils/format';
import type { CustomerRow, BookingRow, BookingStatus } from '@/lib/types/database';

const PAGE_SIZE = 20;

// ── Customer Detail Panel ─────────────────────────────────────────────────────

interface CustomerStats {
  totalBookings: number;
  totalSpend:    number;
  lastBooking:   string | null;
}

function bookingBadge(status: BookingStatus) {
  if (status === 'pending') return <Badge variant="neutral" size="sm" dot label="Pending" />;
  return <Badge variant={status} size="sm" dot />;
}

function CustomerDetail({
  customer,
  onClose,
}: {
  customer: CustomerRow;
  onClose:  () => void;
}) {
  const [bookings, setBookings]   = useState<BookingRow[]>([]);
  const [stats, setStats]         = useState<CustomerStats | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('sender_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const rows = (data ?? []) as BookingRow[];
      setBookings(rows);
      setStats({
        totalBookings: rows.length,
        totalSpend:    rows.reduce((s, b) => s + b.total_amount, 0),
        lastBooking:   rows[0]?.created_at ?? null,
      });
      setLoading(false);
    }
    load();
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-label="Customer detail">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside className="relative flex flex-col w-full max-w-[520px] bg-white h-full shadow-xl overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-border px-5 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-primary">{customer.full_name}</h2>
              <p className="font-body text-xs text-text-secondary">{customer.email ?? customer.phone}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="font-heading font-bold text-lg text-primary">{stats.totalBookings}</p>
                <p className="font-body text-xs text-text-secondary mt-0.5">Bookings</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="font-heading font-bold text-lg text-primary">{formatAED(stats.totalSpend)}</p>
                <p className="font-body text-xs text-text-secondary mt-0.5">Total Spend</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="font-heading font-bold text-sm text-primary">
                  {stats.lastBooking ? formatDate(stats.lastBooking) : '—'}
                </p>
                <p className="font-body text-xs text-text-secondary mt-0.5">Last Booking</p>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div>
            <h3 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-3">
              Contact
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
                <span className="font-body text-text-primary">{customer.phone_country_code} {customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
                  <a href={`mailto:${customer.email}`} className="font-body text-primary hover:underline">{customer.email}</a>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="size-4 text-text-disabled shrink-0 mt-0.5" aria-hidden="true" />
                <span className="font-body text-text-primary">
                  {[customer.address_line_1, customer.address_line_2, customer.city, customer.emirate, customer.country]
                    .filter(Boolean).join(', ')}
                </span>
              </div>
              {customer.company_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
                  <span className="font-body text-text-primary">{customer.company_name}</span>
                </div>
              )}
              {customer.emirates_id && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
                  <span className="font-body text-text-secondary">Emirates ID: {customer.emirates_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent bookings */}
          <div>
            <h3 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-3">
              Recent Bookings
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="size-8 mx-auto text-border mb-2" aria-hidden="true" />
                <p className="text-sm font-body text-text-secondary">No bookings found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="bg-surface rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-primary">{b.booking_number}</span>
                        {bookingBadge(b.status)}
                      </div>
                      <p className="text-xs font-body text-text-secondary">
                        {slugToLabel(b.service_type)} · {b.receiver_city}, {b.receiver_country}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-body font-semibold text-sm text-text-primary">{formatAED(b.total_amount)}</p>
                      <p className="text-[10px] font-body text-text-disabled mt-0.5">{formatDate(b.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div>
            <h3 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-2">
              Account
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-body">
                <Calendar className="size-3.5 text-text-disabled" aria-hidden="true" />
                <span className="text-text-secondary">Customer since {formatDate(customer.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers]   = useState<CustomerRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected]     = useState<CustomerRow | null>(null);
  const searchTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    let q = supabase.from('customers').select('*', { count: 'exact' });

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim();
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,company_name.ilike.%${s}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error: qErr } = await q
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (qErr) setError(qErr.message);
    else { setCustomers((data ?? []) as CustomerRow[]); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: TableColumn<Record<string, unknown>>[] = [
    {
      key: 'full_name',
      header: 'Customer',
      render: (row) => {
        const c = row as unknown as CustomerRow;
        return (
          <button
            type="button"
            onClick={() => setSelected(c)}
            className="text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-heading font-bold text-primary">
                  {c.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-body font-medium text-sm text-primary group-hover:underline">
                  {c.full_name}
                </p>
                {c.company_name && (
                  <p className="font-body text-xs text-text-disabled">{c.company_name}</p>
                )}
              </div>
            </div>
          </button>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => {
        const c = row as unknown as CustomerRow;
        return (
          <span className="font-body text-sm text-text-secondary">
            {c.phone_country_code} {c.phone}
          </span>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => {
        const c = row as unknown as CustomerRow;
        return c.email
          ? <span className="font-body text-sm text-text-secondary truncate max-w-[180px] block">{c.email}</span>
          : <span className="text-text-disabled">—</span>;
      },
    },
    {
      key: 'city',
      header: 'Location',
      render: (row) => {
        const c = row as unknown as CustomerRow;
        return (
          <span className="font-body text-sm text-text-secondary">
            {c.city}{c.emirate ? `, ${c.emirate.replace(/_/g, ' ')}` : ''}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Since',
      render: (row) => (
        <span className="text-xs font-body text-text-disabled whitespace-nowrap">
          {formatDate((row as unknown as CustomerRow).created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const c = row as unknown as CustomerRow;
        return (
          <button
            type="button"
            onClick={() => setSelected(c)}
            className="text-xs font-body font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View
          </button>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-primary">Customers</h1>
          <p className="text-sm font-body text-text-secondary mt-0.5">
            {total.toLocaleString()} customer{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCustomers}
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

      {/* Search */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, company…"
            className="w-full h-9 pl-9 pr-4 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors placeholder:text-text-disabled"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={customers as unknown as Record<string, unknown>[]}
        keyField="id"
        loading={loading}
        emptyMessage="No customers found. They appear here when a booking is submitted."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        onPageChange={setPage}
        caption="Customers table"
      />

      {/* Detail panel */}
      {selected && (
        <CustomerDetail customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
