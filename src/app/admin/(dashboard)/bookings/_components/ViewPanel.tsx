'use client';

import React from 'react';
import Link from 'next/link';
import {
  X, ExternalLink, Package, FileText, Pencil, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatAED, formatDate, formatDateTime, slugToLabel } from '@/lib/utils/format';
import type { BookingRow, BookingStatus } from '@/lib/types/database';

// ── Helpers ───────────────────────────────────────────────────────────────────

function bookingBadge(status: BookingStatus) {
  if (status === 'pending') return <Badge variant="neutral" size="sm" dot label="Pending" />;
  return <Badge variant={status} size="sm" dot />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="font-body text-text-secondary shrink-0 w-36">{label}</span>
      <span className="font-body text-text-primary text-right break-words">{value ?? '—'}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ViewPanelProps {
  booking:           BookingRow;
  onClose:           () => void;
  onEdit:            (b: BookingRow) => void;
  onDelete:          (b: BookingRow) => void;
  onGenerateInvoice: (id: string) => void;
}

export function ViewPanel({ booking, onClose, onEdit, onDelete, onGenerateInvoice }: ViewPanelProps) {
  const isTerminal = ['delivered', 'returned', 'cancelled'].includes(booking.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-label="Booking detail">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <aside className="relative flex flex-col w-full max-w-[560px] bg-white h-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-primary">{booking.booking_number}</h2>
              {bookingBadge(booking.status)}
            </div>
            <Link
              href={`/tracking/${booking.tracking_id}`}
              target="_blank"
              className="flex items-center gap-1 font-mono text-xs text-text-secondary hover:text-primary mt-0.5 transition-colors"
            >
              {booking.tracking_id}
              <ExternalLink className="size-2.5" aria-hidden="true" />
            </Link>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary transition-colors" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Summary card */}
          <div className="bg-surface rounded-xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-text-primary text-sm">
                {slugToLabel(booking.service_type)} · {slugToLabel(booking.package_type)}
              </p>
              <p className="text-xs font-body text-text-secondary">
                {booking.sender_city} → {booking.receiver_city}, {booking.receiver_country}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-heading font-bold text-lg text-primary">{formatAED(booking.total_amount)}</p>
              <p className="text-[10px] font-body text-text-disabled">incl. VAT</p>
            </div>
          </div>

          <Section title="Sender">
            <Row label="Name"       value={booking.sender_name} />
            <Row label="Phone"      value={booking.sender_phone} />
            <Row label="Email"      value={booking.sender_email} />
            <Row label="Address"    value={[booking.sender_address, booking.sender_city, booking.sender_emirate ? slugToLabel(booking.sender_emirate) : null, booking.sender_country].filter(Boolean).join(', ')} />
            {booking.sender_postal_code && <Row label="Postal code" value={booking.sender_postal_code} />}
          </Section>

          <Section title="Receiver">
            <Row label="Name"       value={booking.receiver_name} />
            <Row label="Phone"      value={booking.receiver_phone} />
            <Row label="Email"      value={booking.receiver_email} />
            <Row label="Address"    value={[booking.receiver_address, booking.receiver_city, booking.receiver_emirate ? slugToLabel(booking.receiver_emirate) : null, booking.receiver_country].filter(Boolean).join(', ')} />
            {booking.receiver_postal_code && <Row label="Postal code" value={booking.receiver_postal_code} />}
          </Section>

          <Section title="Package">
            <Row label="Type"           value={slugToLabel(booking.package_type)} />
            <Row label="Description"    value={booking.package_description} />
            <Row label="Weight"         value={`${booking.weight_kg} kg`} />
            <Row label="Dimensions"     value={booking.dimensions_length_cm ? `${booking.dimensions_length_cm} × ${booking.dimensions_width_cm} × ${booking.dimensions_height_cm} cm` : '—'} />
            <Row label="Pieces"         value={booking.number_of_pieces} />
            <Row label="Declared value" value={formatAED(booking.declared_value)} />
            <Row label="Fragile"        value={booking.is_fragile ? 'Yes' : 'No'} />
            <Row label="Signature"      value={booking.requires_signature ? 'Required' : 'Not required'} />
          </Section>

          <Section title="Service">
            <Row label="Type"          value={slugToLabel(booking.service_type)} />
            <Row label="Pickup"        value={booking.pickup_requested ? `${formatDate(booking.pickup_date!)} · ${slugToLabel(booking.pickup_time_slot ?? '')}` : 'Drop-off'} />
            <Row label="Est. delivery" value={booking.estimated_delivery ? formatDate(booking.estimated_delivery) : '—'} />
            {booking.special_instructions && <Row label="Instructions" value={booking.special_instructions} />}
          </Section>

          <Section title="Pricing (AED)">
            <Row label="Base price"     value={formatAED(booking.base_price)} />
            {booking.weight_surcharge > 0    && <Row label="Weight surcharge" value={formatAED(booking.weight_surcharge)} />}
            {booking.fuel_surcharge > 0      && <Row label="Fuel surcharge"   value={formatAED(booking.fuel_surcharge)} />}
            {booking.insurance_fee > 0       && <Row label="Insurance"        value={formatAED(booking.insurance_fee)} />}
            {booking.cod_fee > 0             && <Row label="COD fee"          value={formatAED(booking.cod_fee)} />}
            {booking.remote_area_surcharge > 0 && <Row label="Remote area"   value={formatAED(booking.remote_area_surcharge)} />}
            {(booking.discount_amount ?? 0) > 0 && <Row label="Discount"     value={`-${formatAED(booking.discount_amount ?? 0)}`} />}
            <div className="border-t border-border pt-2 mt-1 space-y-2">
              <Row label="Subtotal"               value={formatAED(booking.subtotal)} />
              <Row label={`VAT (${booking.vat_rate}%)`} value={formatAED(booking.vat_amount)} />
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span className="font-body text-text-primary">Total</span>
                <span className="font-heading text-primary">{formatAED(booking.total_amount)}</span>
              </div>
            </div>
          </Section>

          <Section title="Payment">
            <Row label="Method" value={slugToLabel(booking.payment_method)} />
            <Row label="Status" value={
              <Badge
                variant={booking.payment_status === 'pending' ? 'neutral' : booking.payment_status}
                size="sm" dot
              />
            } />
          </Section>

          <Section title="Record">
            <Row label="Created"      value={formatDateTime(booking.created_at)} />
            <Row label="Last updated" value={formatDateTime(booking.updated_at)} />
          </Section>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-border p-4 flex flex-wrap gap-2 bg-white">
          <button
            type="button"
            onClick={() => onEdit(booking)}
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-primary text-white px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit Booking
          </button>
          {!isTerminal && (
            <button
              type="button"
              onClick={() => onGenerateInvoice(booking.id)}
              className="flex items-center gap-1.5 text-xs font-body font-semibold bg-secondary/10 text-secondary px-3 py-2 rounded-xl hover:bg-secondary/20 transition-colors"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              Generate Invoice
            </button>
          )}
          <Link
            href={`/tracking/${booking.tracking_id}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-surface border border-border text-text-primary px-3 py-2 rounded-xl hover:bg-white transition-colors"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Tracking page
          </Link>
          <button
            type="button"
            onClick={() => onDelete(booking)}
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-danger/10 text-danger px-3 py-2 rounded-xl hover:bg-danger/20 transition-colors ml-auto"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
