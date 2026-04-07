'use client';

import React from 'react';
import {
  CheckCircle2, Circle, Clock, MapPin, Package, Truck,
  AlertCircle, XCircle, RotateCcw, PauseCircle, Warehouse,
  Globe, ShieldCheck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import { SHIPMENT_STATUSES } from '@/lib/utils/constants';
import { TRACKING_MILESTONES, getMilestoneIndex } from '@/lib/tracking/status-engine';
import type { BookingStatus, TrackingEventRow } from '@/lib/types/database';

type StatusInfo = { label: string; color: string; bg: string; dot: string; description: string };
const STATUS_INFO = SHIPMENT_STATUSES as Record<string, StatusInfo>;
function getStatusInfo(status: string): StatusInfo {
  return STATUS_INFO[status] ?? STATUS_INFO['pending']!;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

function getStatusIcon(status: BookingStatus, active: boolean) {
  const cls = active ? 'size-5' : 'size-4';

  switch (status) {
    case 'delivered':             return <CheckCircle2 className={`${cls} text-accent`}        />;
    case 'cancelled':             return <XCircle      className={`${cls} text-danger`}         />;
    case 'returned':              return <RotateCcw    className={`${cls} text-danger`}         />;
    case 'on_hold':               return <PauseCircle  className={`${cls} text-orange-500`}     />;
    case 'delivery_attempted':    return <AlertCircle  className={`${cls} text-orange-500`}     />;
    case 'out_for_delivery':      return <Truck        className={`${cls} text-accent`}         />;
    case 'in_transit':
    case 'at_hub':                return <Truck        className={`${cls} text-primary`}        />;
    case 'picked_up':
    case 'received_at_origin':    return <Package      className={`${cls} text-blue-500`}       />;
    case 'customs_clearance':     return <Globe        className={`${cls} text-orange-500`}     />;
    case 'cleared_customs':       return <ShieldCheck  className={`${cls} text-accent`}         />;
    case 'arrived_at_destination':return <MapPin       className={`${cls} text-accent`}         />;
    case 'confirmed':             return <CheckCircle2 className={`${cls} text-secondary`}      />;
    case 'booked':                return <Package      className={`${cls} text-text-secondary`} />;
    case 'pending':               return <Clock        className={`${cls} text-text-disabled`}  />;
    default:                      return active
      ? <Clock className={`${cls} text-secondary`}       />
      : <Circle className={`${cls} text-text-disabled`}  />;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  events:        TrackingEventRow[];
  currentStatus: BookingStatus;
}

// ── Milestone progress bar ────────────────────────────────────────────────────

function MilestoneBar({ currentStatus }: { currentStatus: BookingStatus }) {
  const idx     = getMilestoneIndex(currentStatus);
  const total   = TRACKING_MILESTONES.length - 1;
  const pct     = idx < 0 ? 0 : Math.round((idx / total) * 100);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {TRACKING_MILESTONES.map((ms, i) => {
          const isReached  = idx >= i;
          const isCurrent  = idx === i;
          const info       = getStatusInfo(ms);
          return (
            <div
              key={ms}
              className="flex flex-col items-center gap-1 flex-1 relative"
              aria-label={`${info.label}${isCurrent ? ' (current)' : ''}`}
            >
              {/* Connector line */}
              {i < TRACKING_MILESTONES.length - 1 && (
                <div
                  className={[
                    'absolute left-1/2 top-3 h-0.5 w-full -translate-y-1/2 transition-colors duration-500',
                    isReached && idx > i ? 'bg-accent' : 'bg-border',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}

              {/* Dot */}
              <div className={[
                'relative z-10 size-6 rounded-full flex items-center justify-center border-2 transition-all duration-500',
                isCurrent
                  ? 'border-accent bg-accent/10 ring-4 ring-accent/20'
                  : isReached
                    ? 'border-accent bg-accent'
                    : 'border-border bg-white',
              ].join(' ')}>
                {isReached && !isCurrent
                  ? <CheckCircle2 className="size-3.5 text-white" aria-hidden="true" />
                  : isCurrent
                    ? <span className="size-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                    : <span className="size-1.5 rounded-full bg-border" aria-hidden="true" />
                }
              </div>

              {/* Label — only on md+ */}
              <p className={[
                'hidden sm:block text-center text-[10px] font-body leading-tight max-w-[56px] truncate',
                isCurrent ? 'text-accent font-semibold' : isReached ? 'text-text-secondary' : 'text-text-disabled',
              ].join(' ')}>
                {info.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mobile: text progress */}
      <p className="sm:hidden text-xs font-body text-center text-text-secondary mt-1">
        {pct}% complete
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TrackingTimeline({ events, currentStatus }: Props) {
  if (!events.length) {
    return (
      <div className="text-center py-12 text-text-secondary font-body text-sm">
        No tracking events yet. Check back soon.
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime(),
  );

  return (
    <div>
      <MilestoneBar currentStatus={currentStatus} />

      <ol className="relative space-y-0" aria-label="Tracking timeline">
        {sorted.map((event, idx) => {
          const isLatest = idx === 0;
          const info     = getStatusInfo(event.status);

          return (
            <li key={event.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Icon + line */}
              <div className="flex flex-col items-center shrink-0">
                <div className={[
                  'flex items-center justify-center size-10 rounded-full border-2 z-10 transition-colors',
                  isLatest
                    ? `border-2 ${info.bg} ${info.dot.replace('bg-', 'border-')}`
                    : 'border-border bg-white',
                ].join(' ')}>
                  {isLatest && (
                    <span
                      className={['absolute size-10 rounded-full opacity-30 animate-ping', info.dot].join(' ')}
                      aria-hidden="true"
                    />
                  )}
                  {getStatusIcon(event.status, isLatest)}
                </div>
                {idx < sorted.length - 1 && (
                  <div className="w-[2px] flex-1 bg-border mt-1 min-h-[24px]" aria-hidden="true" />
                )}
              </div>

              {/* Content */}
              <div className={['pt-1.5 pb-1 flex-1 min-w-0', isLatest ? '' : 'opacity-65'].join(' ')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={[
                      'text-sm font-body font-semibold truncate',
                      isLatest ? info.color : 'text-text-primary',
                    ].join(' ')}>
                      {info.description || info.label}
                    </p>
                    {event.status_detail && (
                      <p className="text-sm font-body text-text-secondary mt-0.5 leading-snug">
                        {event.status_detail}
                      </p>
                    )}
                    {event.location && (
                      <p className="flex items-center gap-1 text-xs font-body text-text-disabled mt-1">
                        <MapPin className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {event.location}
                          {event.facility_code && ` · ${event.facility_code}`}
                        </span>
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-xs font-body text-text-secondary mt-1 italic leading-snug">
                        {event.notes}
                      </p>
                    )}
                  </div>

                  <time
                    dateTime={event.event_timestamp}
                    className="text-xs font-body text-text-disabled whitespace-nowrap shrink-0"
                  >
                    {formatDateTime(event.event_timestamp)}
                  </time>
                </div>

                {/* Proof of delivery thumbnails */}
                {(event.photo_url || event.signature_url) && (
                  <div className="flex gap-3 mt-2.5">
                    {event.photo_url && (
                      <a
                        href={event.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body text-primary font-medium underline underline-offset-2 hover:text-secondary transition-colors"
                      >
                        View Photo
                      </a>
                    )}
                    {event.signature_url && (
                      <a
                        href={event.signature_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-body text-primary font-medium underline underline-offset-2 hover:text-secondary transition-colors"
                      >
                        View Signature
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default TrackingTimeline;
