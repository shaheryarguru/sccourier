'use client';

import React from 'react';

// ── Tracking status + semantic variants ──────────────────────────────────────
export type BadgeVariant =
  // Semantic
  | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  // Tracking statuses
  | 'booked' | 'confirmed' | 'picked_up' | 'received_at_origin'
  | 'in_transit' | 'at_hub' | 'customs_clearance' | 'cleared_customs'
  | 'arrived_at_destination' | 'out_for_delivery' | 'delivery_attempted'
  | 'delivered' | 'returned' | 'on_hold' | 'cancelled'
  // Payment
  | 'paid' | 'unpaid' | 'partial' | 'overdue' | 'refunded';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?:    BadgeVariant;
  size?:       BadgeSize;
  dot?:        boolean;
  children?:   React.ReactNode;
  label?:      string;         // alt to children
  className?:  string;
}

// ── Color map ─────────────────────────────────────────────────────────────────
// Each entry: [bg, text, dotColor]
const COLORS: Record<BadgeVariant, [string, string, string]> = {
  // Semantic
  success:             ['bg-accent-50  border-accent-100',  'text-accent-dark',  'bg-accent'],
  warning:             ['bg-secondary-50 border-secondary-100','text-secondary-dark','bg-secondary'],
  danger:              ['bg-danger-50  border-danger-100',   'text-danger-dark',  'bg-danger'],
  info:                ['bg-blue-50    border-blue-100',     'text-blue-700',     'bg-blue-500'],
  neutral:             ['bg-surface    border-border',       'text-text-secondary','bg-text-disabled'],

  // Tracking
  booked:              ['bg-surface    border-border',       'text-text-secondary','bg-text-secondary'],
  confirmed:           ['bg-primary-50 border-primary-100',  'text-primary',      'bg-primary'],
  picked_up:           ['bg-blue-50    border-blue-100',     'text-blue-700',     'bg-blue-500'],
  received_at_origin:  ['bg-blue-50    border-blue-100',     'text-blue-700',     'bg-blue-500'],
  in_transit:          ['bg-blue-50    border-blue-100',     'text-blue-700',     'bg-blue-500'],
  at_hub:              ['bg-purple-50  border-purple-100',   'text-purple-700',   'bg-purple-500'],
  customs_clearance:   ['bg-warning-50 border-warning-100',  'text-warning',      'bg-warning'],
  cleared_customs:     ['bg-accent-50  border-accent-100',   'text-accent-dark',  'bg-accent'],
  arrived_at_destination:['bg-blue-50  border-blue-100',     'text-blue-700',     'bg-blue-500'],
  out_for_delivery:    ['bg-secondary-50 border-secondary-100','text-secondary-dark','bg-secondary'],
  delivery_attempted:  ['bg-warning-50 border-warning-100',  'text-warning',      'bg-warning'],
  delivered:           ['bg-accent-50  border-accent-100',   'text-accent-dark',  'bg-accent'],
  returned:            ['bg-danger-50  border-danger-100',   'text-danger-dark',  'bg-danger'],
  on_hold:             ['bg-warning-50 border-warning-100',  'text-warning',      'bg-warning'],
  cancelled:           ['bg-danger-50  border-danger-100',   'text-danger-dark',  'bg-danger'],

  // Payment
  paid:                ['bg-accent-50  border-accent-100',   'text-accent-dark',  'bg-accent'],
  unpaid:              ['bg-danger-50  border-danger-100',   'text-danger-dark',  'bg-danger'],
  partial:             ['bg-warning-50 border-warning-100',  'text-warning',      'bg-warning'],
  overdue:             ['bg-danger-50  border-danger-100',   'text-danger-dark',  'bg-danger'],
  refunded:            ['bg-surface    border-border',       'text-text-secondary','bg-text-disabled'],
};

// Human-readable fallback labels
export const BADGE_LABELS: Partial<Record<BadgeVariant, string>> = {
  booked:               'Booked',
  confirmed:            'Confirmed',
  picked_up:            'Picked Up',
  received_at_origin:   'At Origin',
  in_transit:           'In Transit',
  at_hub:               'At Hub',
  customs_clearance:    'In Customs',
  cleared_customs:      'Customs Cleared',
  arrived_at_destination:'At Destination',
  out_for_delivery:     'Out for Delivery',
  delivery_attempted:   'Attempted',
  delivered:            'Delivered',
  returned:             'Returned',
  on_hold:              'On Hold',
  cancelled:            'Cancelled',
  paid:                 'Paid',
  unpaid:               'Unpaid',
  partial:              'Partial',
  overdue:              'Overdue',
  refunded:             'Refunded',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2    py-0.5 text-[10px] gap-1',
  md: 'px-2.5  py-1   text-xs     gap-1.5',
};

// ── Component ─────────────────────────────────────────────────────────────────
export function Badge({
  variant   = 'neutral',
  size      = 'md',
  dot       = false,
  children,
  label,
  className = '',
}: BadgeProps) {
  const [bg, text, dotCls] = COLORS[variant] ?? COLORS.neutral;
  const displayText = children ?? label ?? BADGE_LABELS[variant] ?? variant;

  return (
    <span
      className={[
        'inline-flex items-center font-body font-semibold',
        'rounded-full border',
        'whitespace-nowrap leading-none',
        bg,
        text,
        SIZES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={`shrink-0 rounded-full ${dotCls} ${size === 'sm' ? 'size-1.5' : 'size-2'}`}
          aria-hidden="true"
        />
      )}
      {displayText}
    </span>
  );
}

export default Badge;
