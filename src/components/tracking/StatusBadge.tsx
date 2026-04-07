'use client';

import React from 'react';
import {
  CheckCircle2, Clock, Package, Truck, Warehouse, Globe,
  ShieldCheck, MapPin, RotateCcw, PauseCircle, AlertCircle,
  XCircle, AlertTriangle, Circle,
} from 'lucide-react';
import { SHIPMENT_STATUSES } from '@/lib/utils/constants';
import type { BookingStatus } from '@/lib/types/database';

// ── Icon map ──────────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<BookingStatus, React.FC<{ className?: string }>> = {
  pending:                Circle,
  booked:                 Package,
  confirmed:              CheckCircle2,
  picked_up:              Package,
  received_at_origin:     Warehouse,
  in_transit:             Truck,
  at_hub:                 Warehouse,
  customs_clearance:      Globe,
  cleared_customs:        ShieldCheck,
  arrived_at_destination: MapPin,
  out_for_delivery:       Truck,
  delivery_attempted:     AlertCircle,
  delivered:              CheckCircle2,
  returned:               RotateCcw,
  on_hold:                PauseCircle,
  cancelled:              XCircle,
};

// ── Size configs ──────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm:  { badge: 'px-2 py-0.5 text-xs gap-1',     icon: 'size-3',   dot: 'size-1.5' },
  md:  { badge: 'px-3 py-1   text-sm gap-1.5',   icon: 'size-3.5', dot: 'size-2'   },
  lg:  { badge: 'px-4 py-1.5 text-base gap-2',   icon: 'size-4',   dot: 'size-2.5' },
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status:    BookingStatus;
  size?:     keyof typeof SIZE_MAP;
  /** Show dot instead of icon */
  dot?:      boolean;
  /** Show icon before label */
  icon?:     boolean;
  /** Use pill/chip appearance */
  pill?:     boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBadge({
  status,
  size    = 'md',
  dot     = false,
  icon    = true,
  pill    = false,
  className = '',
}: StatusBadgeProps) {
  const info = SHIPMENT_STATUSES[status] ?? SHIPMENT_STATUSES.pending;
  const sz   = SIZE_MAP[size];
  const Icon = STATUS_ICONS[status] ?? AlertTriangle;

  return (
    <span
      className={[
        'inline-flex items-center font-body font-semibold',
        sz.badge,
        info.color,
        info.bg,
        pill ? 'rounded-full' : 'rounded-lg',
        className,
      ].join(' ')}
      aria-label={`Status: ${info.label}`}
    >
      {dot && (
        <span className={['rounded-full shrink-0', sz.dot, info.dot].join(' ')} aria-hidden="true" />
      )}
      {!dot && icon && (
        <Icon className={sz.icon} aria-hidden="true" />
      )}
      {info.label}
    </span>
  );
}

export default StatusBadge;
