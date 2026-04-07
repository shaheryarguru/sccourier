import type { ShipmentStatus } from '../utils/constants';

// ── Valid status transitions ───────────────────────────────────────────────────
// Each key: current status → array of statuses it can transition INTO
const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  booked:  ['confirmed', 'cancelled'],
  confirmed: [
    'picked_up',
    'cancelled',
  ],
  picked_up: [
    'received_at_origin',
    'in_transit',      // direct inject (no hub scan)
    'on_hold',
    'returned',
  ],
  received_at_origin: [
    'in_transit',
    'on_hold',
  ],
  in_transit: [
    'at_hub',
    'customs_clearance',       // international
    'arrived_at_destination',
    'on_hold',
  ],
  at_hub: [
    'in_transit',
    'out_for_delivery',
    'arrived_at_destination',
    'on_hold',
  ],
  customs_clearance: [
    'cleared_customs',
    'on_hold',
    'returned',
  ],
  cleared_customs: [
    'in_transit',
    'arrived_at_destination',
  ],
  arrived_at_destination: [
    'out_for_delivery',
    'on_hold',
  ],
  out_for_delivery: [
    'delivered',
    'delivery_attempted',
    'on_hold',
    'returned',
  ],
  delivery_attempted: [
    'out_for_delivery',   // re-attempt
    'returned',
    'on_hold',
  ],
  delivered:  [],           // terminal — no outbound transitions
  returned:   [],           // terminal
  on_hold: [
    'in_transit',
    'out_for_delivery',
    'returned',
    'cancelled',
  ],
  cancelled:  [],           // terminal
};

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Returns the list of statuses that `currentStatus` can transition to.
 * Returns an empty array if the status is terminal or unknown.
 */
export function getNextStatuses(currentStatus: string): ShipmentStatus[] {
  return TRANSITIONS[currentStatus as ShipmentStatus] ?? [];
}

/**
 * Returns `true` if moving from `from` to `to` is a valid transition.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = getNextStatuses(from);
  return allowed.includes(to as ShipmentStatus);
}

/**
 * Returns `true` if the status is terminal (no further transitions possible).
 */
export function isTerminalStatus(status: string): boolean {
  return getNextStatuses(status).length === 0;
}

/**
 * Returns the ordered "milestone" statuses shown on the public tracking timeline.
 * These are the high-level checkpoints regardless of intermediate hub scans.
 */
export const TRACKING_MILESTONES: ShipmentStatus[] = [
  'booked',
  'confirmed',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

/**
 * Given the current status, returns which milestone index is active (0-based).
 * Used to render the progress stepper on the tracking page.
 */
export function getMilestoneIndex(currentStatus: string): number {
  // Special cases: map intermediate statuses to nearest milestone
  const MAP: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
    received_at_origin:     'picked_up',
    at_hub:                 'in_transit',
    customs_clearance:      'in_transit',
    cleared_customs:        'in_transit',
    arrived_at_destination: 'in_transit',
    delivery_attempted:     'out_for_delivery',
    on_hold:                'in_transit',
  };
  const effective = MAP[currentStatus as ShipmentStatus] ?? (currentStatus as ShipmentStatus);
  const idx = TRACKING_MILESTONES.indexOf(effective);
  return idx === -1 ? 0 : idx;
}

/**
 * Returns whether the shipment is in a "problem" state that needs attention.
 */
export function isProblemStatus(status: string): boolean {
  return ['on_hold', 'delivery_attempted', 'returned', 'cancelled'].includes(status);
}

/**
 * Returns whether the shipment has been successfully completed.
 */
export function isDelivered(status: string): boolean {
  return status === 'delivered';
}
