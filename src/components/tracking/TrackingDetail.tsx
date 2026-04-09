'use client';

import React from 'react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, User, Package, Wifi, WifiOff,
  RefreshCw, AlertCircle, ExternalLink, Shield, Pen,
} from 'lucide-react';
import { TrackingTimeline } from './TrackingTimeline';
import { DeliveryProof }    from './DeliveryProof';
import { TrackingMap }      from './TrackingMap';
import { StatusBadge }      from './StatusBadge';
import { ShareButton }      from './ShareButton';
import { Button }           from '@/components/ui';
import { useTracking, deriveCurrentStatus } from '@/hooks/useTracking';
import { getMilestoneIndex } from '@/lib/tracking/status-engine';
import { TRACKING_MILESTONES } from '@/lib/tracking/status-engine';
import { SHIPMENT_STATUSES } from '@/lib/utils/constants';
import { formatDate, formatAED } from '@/lib/utils/format';
import type { BookingStatus } from '@/lib/types/database';

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  trackingId:    string;
  /** Pre-fetched data from the server component (used as initial state) */
  initialData?: {
    booking: NonNullable<ReturnType<typeof useTracking>['data']>['booking'];
    events:  NonNullable<ReturnType<typeof useTracking>['data']>['events'];
  };
  showNewBanner?: boolean;
  bookingNumber?: string;
}

// ── Route progress estimate ───────────────────────────────────────────────────

function statusToProgress(status: BookingStatus): number {
  const idx   = getMilestoneIndex(status);
  const total = TRACKING_MILESTONES.length - 1;
  if (idx < 0) return 0;
  return Math.round((idx / total) * 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TrackingDetail({ trackingId, initialData, showNewBanner, bookingNumber }: Props) {
  const { data, loading, error, refetch, isLive } = useTracking(trackingId);

  // Use server-fetched data as initial value until client fetch completes
  const displayData = data ?? initialData ?? null;
  const booking     = displayData?.booking;
  const events      = displayData?.events ?? [];

  const currentStatus = deriveCurrentStatus(displayData);
  const progress      = statusToProgress(currentStatus);

  const isDelivered   = currentStatus === 'delivered';
  const deliveryEvent = events.find(e => e.status === 'delivered') ?? null;

  // Use only real (non-audit) events for map location so audit entries
  // with null location don't shadow a real current location.
  const publicEvents     = events.filter(e => !e.is_custom_event);
  const latestLocation   = publicEvents
    .slice()
    .sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime())[0]
    ?.location ?? null;

  // Live pulse dot
  const pulseRef = useRef<HTMLSpanElement>(null);

  // Scroll to top of this component on new status
  const prevStatusRef = useRef<string>(currentStatus);
  useEffect(() => {
    if (prevStatusRef.current !== currentStatus) {
      prevStatusRef.current = currentStatus;
    }
  }, [currentStatus]);

  if (error && !displayData) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="size-12 text-danger mx-auto" aria-hidden="true" />
        <p className="text-text-primary font-body font-semibold">Could not load tracking data</p>
        <p className="text-text-secondary font-body text-sm">{error}</p>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="size-4" />} onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New booking confirmation banner */}
      {showNewBanner && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="size-4 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-accent">Booking Confirmed!</p>
            <p className="text-sm font-body text-text-secondary mt-0.5">
              Booking number:{' '}
              <strong className="text-primary">{bookingNumber ?? booking?.booking_number}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Back nav */}
      <Link
        href="/tracking"
        className="inline-flex items-center gap-2 text-sm font-body text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to tracking
      </Link>

      {/* ── Status header card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Top bar with progress */}
        <div className="h-1.5 bg-border relative overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Tracking ID + status */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-body text-text-disabled uppercase tracking-wider mb-1">Tracking ID</p>
              <code className="font-mono font-bold text-2xl sm:text-3xl text-primary tracking-wide">
                {trackingId}
              </code>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={currentStatus} size="md" />

              {/* Live indicator */}
              <span
                className="flex items-center gap-1.5 text-xs font-body text-text-secondary"
                title={isLive ? 'Live updates enabled' : 'Offline'}
              >
                {isLive
                  ? <><span ref={pulseRef} className="size-2 rounded-full bg-accent animate-pulse" /><Wifi className="size-3 text-accent" /></>
                  : <WifiOff className="size-3 text-text-disabled" />
                }
              </span>

              <ShareButton trackingId={trackingId} />
            </div>
          </div>

          {/* From → To */}
          {booking && (
            <div className="flex items-center gap-2 sm:gap-4 text-sm font-body">
              <div className="flex-1 bg-surface rounded-xl px-3 py-2.5 border border-border min-w-0">
                <p className="text-xs text-text-disabled mb-0.5">From</p>
                <p className="font-semibold text-text-primary truncate">
                  {booking.sender_city}
                  {booking.sender_emirate && `, ${booking.sender_emirate.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
                </p>
              </div>
              <div className="text-text-disabled text-lg">→</div>
              <div className="flex-1 bg-surface rounded-xl px-3 py-2.5 border border-border min-w-0">
                <p className="text-xs text-text-disabled mb-0.5">To</p>
                <p className="font-semibold text-text-primary truncate">
                  {booking.receiver_city}, {booking.receiver_country}
                </p>
              </div>
            </div>
          )}

          {/* Details grid */}
          {booking && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-body border-t border-border pt-4">
              <InfoCell icon={<User className="size-3" />} label="Sender"   value={booking.sender_name}   />
              <InfoCell icon={<User className="size-3" />} label="Receiver" value={booking.receiver_name} />
              <InfoCell
                icon={<Calendar className="size-3" />}
                label="Booked"
                value={formatDate(booking.created_at)}
              />
              <InfoCell label="Amount" value={formatAED(booking.total_amount)} bold />
            </div>
          )}

          {/* Extra badges */}
          {booking && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <span className="inline-flex items-center gap-1 text-xs font-body bg-surface border border-border rounded-lg px-2 py-1 text-text-secondary capitalize">
                <Package className="size-3" aria-hidden="true" />
                {booking.service_type?.replace(/_/g, ' ')}
              </span>
              {booking.is_fragile && (
                <span className="inline-flex items-center gap-1 text-xs font-body bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-amber-700">
                  <AlertCircle className="size-3" aria-hidden="true" />
                  Fragile
                </span>
              )}
              {booking.requires_signature && (
                <span className="inline-flex items-center gap-1 text-xs font-body bg-surface border border-border rounded-lg px-2 py-1 text-text-secondary">
                  <Pen className="size-3" aria-hidden="true" />
                  Signature required
                </span>
              )}
              {booking.estimated_delivery && (
                <span className="inline-flex items-center gap-1 text-xs font-body bg-primary/5 border border-primary/10 rounded-lg px-2 py-1 text-primary font-semibold">
                  <Calendar className="size-3" aria-hidden="true" />
                  ETA: {formatDate(booking.estimated_delivery)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────────────────────── */}
      {booking && (
        <TrackingMap
          originEmirate={booking.sender_emirate ?? 'dubai'}
          destinationEmirate={booking.receiver_emirate ?? undefined}
          destinationCity={booking.receiver_city}
          destinationCountry={booking.receiver_country}
          currentLocation={latestLocation}
          routeProgress={progress}
          className="shadow-sm"
        />
      )}

      {/* ── Delivery proof (delivered only) ───────────────────────────────────── */}
      {isDelivered && booking && (
        <DeliveryProof
          deliveryEvent={deliveryEvent}
          receiverName={booking.receiver_name}
        />
      )}

      {/* ── Timeline ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-lg text-primary">Tracking History</h2>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-40"
            aria-label="Refresh tracking"
            title="Refresh"
          >
            <RefreshCw className={['size-3.5 text-text-secondary', loading ? 'animate-spin' : ''].join(' ')} aria-hidden="true" />
          </button>
        </div>

        <TrackingTimeline events={events} currentStatus={currentStatus} />

        {error && (
          <p className="text-xs font-body text-danger mt-4 flex items-center gap-1">
            <AlertCircle className="size-3" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/booking`} className="block">
          <Button variant="outline" size="md" fullWidth leftIcon={<Package className="size-4" />}>
            Book Another
          </Button>
        </Link>
        <ShareButton trackingId={trackingId} asButton />
        {booking && (
          <Link href={`/invoice/verify?trackingId=${trackingId}`} className="block">
            <Button variant="ghost" size="md" fullWidth leftIcon={<Shield className="size-4" />} rightIcon={<ExternalLink className="size-3" />}>
              View Invoice
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Info cell ─────────────────────────────────────────────────────────────────

function InfoCell({ icon, label, value, bold }: {
  icon?:  React.ReactNode;
  label:  string;
  value:  string;
  bold?:  boolean;
}) {
  return (
    <div>
      <p className="text-xs text-text-disabled mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={['truncate', bold ? 'text-primary font-bold' : 'text-text-primary font-medium'].join(' ')}>
        {value}
      </p>
    </div>
  );
}

export default TrackingDetail;
