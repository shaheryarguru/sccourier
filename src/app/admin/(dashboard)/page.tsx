import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Package, Truck, CheckCircle2, Clock, DollarSign,
  TrendingUp, TrendingDown, Minus, ArrowRight, Plus, FileText,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui/Badge';
import { formatAED, formatDate } from '@/lib/utils/format';
import type { BookingStatus, BookingRow } from '@/lib/types/database';

export const metadata: Metadata = { title: 'Dashboard' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function yesterdayRange() {
  const start = new Date();
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function pctChange(today: number, yesterday: number): { val: number; dir: 'up' | 'down' | 'flat' } {
  if (yesterday === 0) return { val: today > 0 ? 100 : 0, dir: today > 0 ? 'up' : 'flat' };
  const v = Math.round(((today - yesterday) / yesterday) * 100);
  return { val: Math.abs(v), dir: v > 0 ? 'up' : v < 0 ? 'down' : 'flat' };
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, change, iconBg, currency,
}: {
  icon:      React.FC<{ className?: string }>;
  label:     string;
  value:     number;
  change:    ReturnType<typeof pctChange>;
  iconBg:    string;
  currency?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className={['size-10 rounded-xl flex items-center justify-center', iconBg].join(' ')}>
          <Icon className="size-5 text-white" aria-hidden="true" />
        </div>
        <span className={[
          'flex items-center gap-1 text-xs font-body font-semibold',
          change.dir === 'up'   ? 'text-accent'  :
          change.dir === 'down' ? 'text-danger'   : 'text-text-disabled',
        ].join(' ')}>
          {change.dir === 'up'   && <TrendingUp   className="size-3.5" aria-hidden="true" />}
          {change.dir === 'down' && <TrendingDown  className="size-3.5" aria-hidden="true" />}
          {change.dir === 'flat' && <Minus         className="size-3.5" aria-hidden="true" />}
          {change.val}%
        </span>
      </div>
      <div>
        <p className="text-xs font-body text-text-secondary uppercase tracking-wider mb-1">{label}</p>
        <p className="font-heading font-bold text-2xl text-primary">
          {currency ? formatAED(value) : value.toLocaleString()}
        </p>
      </div>
      <p className="text-[10px] font-body text-text-disabled">vs. yesterday</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const today     = todayRange();
  const yesterday = yesterdayRange();

  // Parallel queries
  const [
    { count: bookingsToday     },
    { count: bookingsYesterday },
    { count: pendingPickup     },
    { count: inTransit         },
    { count: deliveredToday    },
    { count: deliveredYest     },
    { data:  revenueToday      },
    { data:  revenueYesterday  },
    { data:  recent            },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('created_at', today.start).lte('created_at', today.end),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.start).lte('created_at', yesterday.end),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .in('status', ['booked', 'confirmed']),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .in('status', ['picked_up', 'in_transit', 'at_hub', 'received_at_origin', 'arrived_at_destination', 'out_for_delivery']),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('status', 'delivered').gte('updated_at', today.start),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('status', 'delivered').gte('updated_at', yesterday.start).lte('updated_at', yesterday.end),
    supabase.from('bookings').select('total_amount')
      .gte('created_at', today.start).lte('created_at', today.end),
    supabase.from('bookings').select('total_amount')
      .gte('created_at', yesterday.start).lte('created_at', yesterday.end),
    supabase.from('bookings').select('id,booking_number,tracking_id,status,sender_name,receiver_name,receiver_city,service_type,total_amount,created_at')
      .order('created_at', { ascending: false }).limit(10),
  ]);

  const revToday = (revenueToday ?? []).reduce((s, r) => s + (r.total_amount ?? 0), 0);
  const revYest  = (revenueYesterday ?? []).reduce((s, r) => s + (r.total_amount ?? 0), 0);

  const stats = [
    {
      label:    "Today's Bookings",
      value:    bookingsToday    ?? 0,
      change:   pctChange(bookingsToday   ?? 0, bookingsYesterday ?? 0),
      icon:     Package,
      iconBg:   'bg-primary',
    },
    {
      label:    'Pending Pickup',
      value:    pendingPickup ?? 0,
      change:   { val: 0, dir: 'flat' as const },
      icon:     Clock,
      iconBg:   'bg-secondary',
    },
    {
      label:    'In Transit',
      value:    inTransit ?? 0,
      change:   { val: 0, dir: 'flat' as const },
      icon:     Truck,
      iconBg:   'bg-blue-500',
    },
    {
      label:    'Delivered Today',
      value:    deliveredToday ?? 0,
      change:   pctChange(deliveredToday ?? 0, deliveredYest ?? 0),
      icon:     CheckCircle2,
      iconBg:   'bg-accent',
    },
    {
      label:    'Revenue Today',
      value:    revToday,
      change:   pctChange(revToday, revYest),
      icon:     DollarSign,
      iconBg:   'bg-purple-500',
      currency: true,
    },
  ];

  const bookingRows = (recent ?? []) as Pick<BookingRow, 'id'|'booking_number'|'tracking_id'|'status'|'sender_name'|'receiver_name'|'receiver_city'|'service_type'|'total_amount'|'created_at'>[];

  return (
    <div className="space-y-6 max-w-screen-xl">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-primary">Dashboard</h1>
          <p className="text-sm font-body text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Dubai' })}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <h2 className="font-heading font-semibold text-base text-primary">Recent Bookings</h2>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-body font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Booking #', 'Tracking', 'Sender', 'Receiver', 'Service', 'Status', 'Amount', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookingRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-secondary">
                    No bookings yet today.
                  </td>
                </tr>
              ) : bookingRows.map(b => (
                <tr key={b.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-primary text-xs">{b.booking_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{b.tracking_id}</td>
                  <td className="px-4 py-3 text-text-primary truncate max-w-[120px]">{b.sender_name}</td>
                  <td className="px-4 py-3 text-text-secondary truncate max-w-[120px]">{b.receiver_name}</td>
                  <td className="px-4 py-3 capitalize text-text-secondary text-xs">{b.service_type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    {b.status === 'pending'
                      ? <Badge variant="neutral" size="sm" dot label="Pending" />
                      : <Badge variant={b.status as unknown as BadgeVariant} size="sm" dot />}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary tabular-nums">{formatAED(b.total_amount)}</td>
                  <td className="px-4 py-3 text-text-disabled whitespace-nowrap">{formatDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Link
        href="/booking"
        className="flex items-center gap-1.5 text-xs font-body font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
      >
        <Plus className="size-3.5" aria-hidden="true" /> New Booking
      </Link>
      <Link
        href="/admin/invoices"
        className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors"
      >
        <FileText className="size-3.5" aria-hidden="true" /> Invoices
      </Link>
      <Link
        href="/admin/shipments"
        className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors"
      >
        <Truck className="size-3.5" aria-hidden="true" /> Update Status
      </Link>
    </div>
  );
}
