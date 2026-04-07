'use client';

import React, { useState, useCallback } from 'react';
import {
  X, ChevronDown, ChevronRight, MapPin, AlertTriangle,
  CheckCircle2, Clock, Edit2, Plus, Trash2, Package,
  DollarSign, Camera, Layers, CalendarClock,
} from 'lucide-react';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/utils/format';
import { SHIPMENT_STATUSES, FACILITY_CODES, PACKAGE_TYPES } from '@/lib/utils/constants';
import { getNextStatuses } from '@/lib/tracking/status-engine';
import type { BookingRow, BookingStatus, TrackingEventRow, PackageType } from '@/lib/types/database';
import {
  updateShipmentStatus,
  updateBookingDetails,
  addCustomEvent,
  addBulkEvents,
  updateEventTimestamp,
  type BulkEventItem,
} from '../actions';

// ── Tiny re-usable field label ────────────────────────────────────────────────

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-body font-semibold text-text-secondary mb-1">
      {children}
    </label>
  );
}

// ── Collapsible section wrapper ───────────────────────────────────────────────

function Section({
  icon,
  title,
  open,
  onToggle,
  children,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-surface hover:bg-white transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-body font-semibold text-text-primary">
          {icon}
          {title}
          {badge}
        </span>
        {open
          ? <ChevronDown className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
          : <ChevronRight className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 bg-white border-t border-border space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Shared input classes ──────────────────────────────────────────────────────

const INPUT = 'w-full h-9 px-3 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors placeholder:text-text-disabled';
const SELECT = 'w-full h-9 pl-3 pr-8 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors appearance-none';
const TEXTAREA = 'w-full px-3 py-2 text-sm font-body bg-white border-2 border-border rounded-xl focus:outline-none focus:border-secondary transition-colors placeholder:text-text-disabled resize-none';

// ── Today's date as YYYY-MM-DD for max= attributes ────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BulkEventsModal
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ROW = (): BulkEventItem & { _key: number } => ({
  _key: Date.now() + Math.random(),
  status: '',
  statusDetail: '',
  location: '',
  facilityCode: '',
  timestamp: new Date().toISOString().slice(0, 16),
});

function BulkEventsModal({
  isOpen,
  booking,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  booking: BookingRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<Array<BulkEventItem & { _key: number }>>([EMPTY_ROW()]);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setRows(r => [...r, EMPTY_ROW()]);
  }
  function removeRow(key: number) {
    setRows(r => r.filter(x => x._key !== key));
  }
  function updateRow(key: number, field: keyof BulkEventItem, value: string) {
    setRows(r => r.map(x => x._key === key ? { ...x, [field]: value } : x));
  }

  async function handleSubmit() {
    const valid = rows.every(r => r.status && r.statusDetail && r.timestamp);
    if (!valid) {
      toastError('Validation error', 'Each row needs a status, detail, and date/time.');
      return;
    }
    setSubmitting(true);
    const result = await addBulkEvents({
      bookingId:  booking.id,
      trackingId: booking.tracking_id,
      events:     rows.map(({ _key: _k, ...ev }) => ({
        ...ev,
        timestamp: new Date(ev.timestamp).toISOString(),
      })),
    });
    setSubmitting(false);
    if (result.success) {
      success('Events added', `${rows.length} tracking event${rows.length !== 1 ? 's' : ''} recorded.`);
      setRows([EMPTY_ROW()]);
      onSaved();
      onClose();
    } else {
      toastError('Failed', result.error);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Multiple Tracking Events"
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-9 px-4 text-sm font-body font-semibold text-text-secondary border border-border rounded-xl hover:bg-surface transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-9 px-5 bg-primary text-white text-sm font-body font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {submitting && <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />}
            Submit All ({rows.length})
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm font-body text-text-secondary">
          Add multiple tracking events at once. Timestamps must be in chronological order and cannot be in the future.
          The booking status will update to the last event&apos;s status.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <CalendarClock className="size-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs font-body text-amber-700">All events will be marked as backdated with an audit timestamp.</p>
        </div>

        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <thead>
              <tr className="border-b border-border text-text-disabled text-left">
                <th className="pb-1.5 pr-2 font-semibold w-[130px]">Status *</th>
                <th className="pb-1.5 pr-2 font-semibold w-[140px]">Detail *</th>
                <th className="pb-1.5 pr-2 font-semibold w-[120px]">Location</th>
                <th className="pb-1.5 pr-2 font-semibold w-[130px]">Date &amp; Time *</th>
                <th className="pb-1.5 font-semibold w-[32px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row._key} className="align-top">
                  <td className="py-2 pr-2">
                    <div className="relative">
                      <select
                        value={row.status}
                        onChange={e => updateRow(row._key, 'status', e.target.value)}
                        className="w-full h-8 pl-2 pr-6 text-xs font-body bg-white border border-border rounded-lg focus:outline-none focus:border-secondary appearance-none"
                      >
                        <option value="">Select…</option>
                        {(Object.keys(SHIPMENT_STATUSES) as BookingStatus[]).map(s => (
                          <option key={s} value={s}>{SHIPMENT_STATUSES[s].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-2 size-3 text-text-disabled pointer-events-none" aria-hidden="true" />
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={row.statusDetail}
                      onChange={e => updateRow(row._key, 'statusDetail', e.target.value)}
                      placeholder="e.g. Picked up"
                      className="w-full h-8 px-2 text-xs font-body bg-white border border-border rounded-lg focus:outline-none focus:border-secondary placeholder:text-text-disabled"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={row.location}
                      onChange={e => updateRow(row._key, 'location', e.target.value)}
                      placeholder="Dubai Hub"
                      className="w-full h-8 px-2 text-xs font-body bg-white border border-border rounded-lg focus:outline-none focus:border-secondary placeholder:text-text-disabled"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="datetime-local"
                      value={row.timestamp}
                      max={new Date().toISOString().slice(0, 16)}
                      onChange={e => updateRow(row._key, 'timestamp', e.target.value)}
                      className="w-full h-8 px-2 text-xs font-body bg-white border border-border rounded-lg focus:outline-none focus:border-secondary"
                    />
                  </td>
                  <td className="py-2">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row._key)}
                        className="p-1 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        aria-label="Remove row"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-body font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add Row
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StatusUpdatePanel
// ─────────────────────────────────────────────────────────────────────────────

interface EditTimestampState {
  eventId: string;
  date: string;
  time: string;
  reason: string;
}

export function StatusUpdatePanel({
  booking,
  events,
  eventsLoading,
  onClose,
  onUpdated,
  onRefreshEvents,
}: {
  booking:         BookingRow;
  events:          TrackingEventRow[];
  eventsLoading:   boolean;
  onClose:         () => void;
  onUpdated:       () => void;
  onRefreshEvents: () => void;
}) {
  const { success, error: toastError } = useToast();
  const nextStatuses = getNextStatuses(booking.status);

  const isTerminal = ['delivered', 'returned', 'cancelled'].includes(booking.status);
  const isDelivered = ['delivered', 'delivery_attempted'].includes(booking.status);

  // ── Section open/close ──────────────────────────────────────────────────────
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    status: true,
    details: false,
    pricing: false,
    proof: isDelivered,
    custom: false,
  });
  function toggleSection(key: string) {
    setOpenSections(s => ({ ...s, [key]: !s[key] }));
  }

  // ── Status Update form ──────────────────────────────────────────────────────
  const [statusForm, setStatusForm] = useState({
    newStatus:    nextStatuses[0] ?? '',
    statusDetail: '',
    location:     '',
    facilityCode: '',
    notes:        '',
    useCustomDate: false,
    customDate:   todayStr(),
    customTime:   nowTimeStr(),
    deliveredTo:  '',
    deliveryNotes: '',
    photoUrl:     '',
    signatureUrl: '',
  });
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!statusForm.newStatus) return;
    setStatusSubmitting(true);

    const customTimestamp = statusForm.useCustomDate
      ? new Date(`${statusForm.customDate}T${statusForm.customTime}:00`).toISOString()
      : undefined;

    const result = await updateShipmentStatus({
      bookingId:    booking.id,
      trackingId:   booking.tracking_id,
      newStatus:    statusForm.newStatus,
      statusDetail: statusForm.statusDetail || undefined,
      location:     statusForm.location     || undefined,
      facilityCode: statusForm.facilityCode || undefined,
      notes:        statusForm.notes        || undefined,
      customTimestamp,
      deliveredTo:  statusForm.deliveredTo  || undefined,
      deliveryNotes: statusForm.deliveryNotes || undefined,
      photoUrl:     statusForm.photoUrl     || undefined,
      signatureUrl: statusForm.signatureUrl || undefined,
    });

    setStatusSubmitting(false);
    if (result.success) {
      success(
        'Status updated',
        `Moved to "${SHIPMENT_STATUSES[statusForm.newStatus as BookingStatus]?.label ?? statusForm.newStatus}"`
          + (customTimestamp ? ' (backdated)' : ''),
      );
      onUpdated();
      onRefreshEvents();
      onClose();
    } else {
      toastError('Update failed', result.error);
    }
  }

  // ── Tracking ID / Booking Number overrides ──────────────────────────────────
  const [editTrackingId, setEditTrackingId]       = useState(false);
  const [trackingIdValue, setTrackingIdValue]     = useState(booking.tracking_id);
  const [editBookingNum, setEditBookingNum]        = useState(false);
  const [bookingNumValue, setBookingNumValue]      = useState(booking.booking_number);

  // ── Shipment details form ───────────────────────────────────────────────────
  const [detailsForm, setDetailsForm] = useState({
    receiverName:    booking.receiver_name,
    receiverPhone:   booking.receiver_phone,
    receiverAddress: booking.receiver_address,
    receiverCity:    booking.receiver_city,
    receiverCountry: booking.receiver_country,
    packageType:     booking.package_type as PackageType,
    weightKg:        String(booking.weight_kg),
    declaredValue:   String(booking.declared_value),
    numberOfPieces:  String(booking.number_of_pieces),
    specialInstructions: booking.special_instructions ?? '',
  });
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);

  async function handleDetailsSubmit() {
    setDetailsSubmitting(true);
    const result = await updateBookingDetails({
      bookingId:          booking.id,
      receiverName:       detailsForm.receiverName,
      receiverPhone:      detailsForm.receiverPhone,
      receiverAddress:    detailsForm.receiverAddress,
      receiverCity:       detailsForm.receiverCity,
      receiverCountry:    detailsForm.receiverCountry,
      packageType:        detailsForm.packageType,
      weightKg:           parseFloat(detailsForm.weightKg) || 0,
      declaredValue:      parseFloat(detailsForm.declaredValue) || 0,
      numberOfPieces:     parseInt(detailsForm.numberOfPieces, 10) || 1,
      specialInstructions: detailsForm.specialInstructions || undefined,
    });
    setDetailsSubmitting(false);
    if (result.success) {
      success('Details saved', 'Shipment details updated.');
      onUpdated();
    } else {
      toastError('Save failed', result.error);
    }
  }

  // ── Pricing form ────────────────────────────────────────────────────────────
  const [pricingForm, setPricingForm] = useState({
    basePrice:           String(booking.base_price),
    weightSurcharge:     String(booking.weight_surcharge),
    fuelSurcharge:       String(booking.fuel_surcharge),
    insuranceFee:        String(booking.insurance_fee),
    codFee:              String(booking.cod_fee),
    remoteAreaSurcharge: String(booking.remote_area_surcharge),
    discountAmount:      String((booking as BookingRow & { discount_amount?: number }).discount_amount ?? 0),
    discountReason:      (booking as BookingRow & { discount_reason?: string }).discount_reason ?? '',
  });
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  // Live calculated totals
  const calcTotals = useCallback(() => {
    const base    = parseFloat(pricingForm.basePrice)           || 0;
    const weight  = parseFloat(pricingForm.weightSurcharge)     || 0;
    const fuel    = parseFloat(pricingForm.fuelSurcharge)       || 0;
    const insure  = parseFloat(pricingForm.insuranceFee)        || 0;
    const cod     = parseFloat(pricingForm.codFee)              || 0;
    const remote  = parseFloat(pricingForm.remoteAreaSurcharge) || 0;
    const discount = parseFloat(pricingForm.discountAmount)     || 0;
    const subtotal  = Math.max(0, base + weight + fuel + insure + cod + remote - discount);
    const vat       = +(subtotal * 0.05).toFixed(2);
    const total     = +(subtotal + vat).toFixed(2);
    return { subtotal: +subtotal.toFixed(2), vat, total };
  }, [pricingForm]);

  async function handlePricingSubmit() {
    setPricingSubmitting(true);
    const result = await updateBookingDetails({
      bookingId:           booking.id,
      basePrice:           parseFloat(pricingForm.basePrice)           || 0,
      weightSurcharge:     parseFloat(pricingForm.weightSurcharge)     || 0,
      fuelSurcharge:       parseFloat(pricingForm.fuelSurcharge)       || 0,
      insuranceFee:        parseFloat(pricingForm.insuranceFee)        || 0,
      codFee:              parseFloat(pricingForm.codFee)              || 0,
      remoteAreaSurcharge: parseFloat(pricingForm.remoteAreaSurcharge) || 0,
      discountAmount:      parseFloat(pricingForm.discountAmount)      || 0,
      discountReason:      pricingForm.discountReason || undefined,
    });
    setPricingSubmitting(false);
    if (result.success) {
      success('Pricing saved', 'Booking pricing recalculated.');
      onUpdated();
    } else {
      toastError('Save failed', result.error);
    }
  }

  // ── Custom event form ───────────────────────────────────────────────────────
  const [customForm, setCustomForm] = useState({
    label:       '',
    description: '',
    location:    '',
    useCustomDate: false,
    customDate:  todayStr(),
    customTime:  nowTimeStr(),
  });
  const [customSubmitting, setCustomSubmitting] = useState(false);

  async function handleCustomEventSubmit() {
    if (!customForm.label.trim()) {
      toastError('Validation', 'Event label is required.');
      return;
    }
    setCustomSubmitting(true);
    const customTimestamp = customForm.useCustomDate
      ? new Date(`${customForm.customDate}T${customForm.customTime}:00`).toISOString()
      : undefined;
    const result = await addCustomEvent({
      bookingId:  booking.id,
      trackingId: booking.tracking_id,
      label:      customForm.label,
      description: customForm.description || undefined,
      location:   customForm.location     || undefined,
      customTimestamp,
    });
    setCustomSubmitting(false);
    if (result.success) {
      success('Event added', `"${customForm.label}" logged.`);
      setCustomForm({ label: '', description: '', location: '', useCustomDate: false, customDate: todayStr(), customTime: nowTimeStr() });
      onRefreshEvents();
    } else {
      toastError('Failed', result.error);
    }
  }

  // ── Edit event timestamp ────────────────────────────────────────────────────
  const [editTs, setEditTs] = useState<EditTimestampState | null>(null);
  const [tsSubmitting, setTsSubmitting] = useState(false);

  function startEditTs(ev: TrackingEventRow) {
    const d = new Date(ev.event_timestamp);
    setEditTs({
      eventId: ev.id,
      date: d.toISOString().slice(0, 10),
      time: d.toISOString().slice(11, 16),
      reason: '',
    });
  }

  async function handleTsSubmit(eventId: string) {
    if (!editTs) return;
    setTsSubmitting(true);
    const result = await updateEventTimestamp({
      eventId,
      newTimestamp: new Date(`${editTs.date}T${editTs.time}:00`).toISOString(),
      reason: editTs.reason || undefined,
    });
    setTsSubmitting(false);
    if (result.success) {
      success('Timestamp updated', 'Event time corrected.');
      setEditTs(null);
      onRefreshEvents();
    } else {
      toastError('Failed', result.error);
    }
  }

  // ── Bulk events modal ───────────────────────────────────────────────────────
  const [bulkOpen, setBulkOpen] = useState(false);

  const { subtotal, vat, total } = calcTotals();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-label="Update shipment">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

        {/* Panel */}
        <aside className="relative flex flex-col w-full max-w-[560px] bg-surface h-full shadow-xl overflow-hidden">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-border px-5 py-4 flex items-center justify-between bg-white z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-base text-primary">Manage Shipment</h2>
                <span className={`inline-flex items-center gap-1 text-[11px] font-body font-semibold px-2 py-0.5 rounded-full ${
                  SHIPMENT_STATUSES[booking.status]?.bg ?? 'bg-gray-100'
                } ${SHIPMENT_STATUSES[booking.status]?.color ?? 'text-gray-600'}`}>
                  <span className={`size-1.5 rounded-full ${SHIPMENT_STATUSES[booking.status]?.dot ?? 'bg-gray-400'}`} />
                  {SHIPMENT_STATUSES[booking.status]?.label ?? booking.status}
                </span>
              </div>
              <p className="font-mono text-xs text-text-secondary mt-0.5">
                {booking.tracking_id} · {booking.sender_name} → {booking.receiver_name}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary" aria-label="Close">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* ── Backdating banner ────────────────────────────────────────────── */}
          {(statusForm.useCustomDate || customForm.useCustomDate) && (
            <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
              <CalendarClock className="size-4 text-amber-600 shrink-0" aria-hidden="true" />
              <p className="text-xs font-body font-semibold text-amber-700">
                Backdating Mode — events will be recorded with a custom date/time
              </p>
            </div>
          )}

          {/* ── Scrollable body ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── 1. Status Update ──────────────────────────────────────────── */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-white border-b border-border">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-body font-semibold text-text-primary">Status Update</span>
                </div>
              </div>
              <div className="bg-white px-4 pb-4 pt-3">
                {isTerminal ? (
                  <div className="bg-surface rounded-xl p-4 text-center">
                    <CheckCircle2 className="size-8 mx-auto mb-2 text-text-disabled" aria-hidden="true" />
                    <p className="text-sm font-body text-text-secondary">
                      This shipment is in a terminal state ({SHIPMENT_STATUSES[booking.status]?.label}) and cannot advance further.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleStatusSubmit} className="space-y-3">

                    {/* New Status */}
                    <div>
                      <FieldLabel htmlFor="new-status">New Status <span className="text-danger">*</span></FieldLabel>
                      {nextStatuses.length === 0 ? (
                        <p className="text-sm font-body text-text-secondary italic">No valid transitions.</p>
                      ) : (
                        <div className="relative">
                          <select
                            id="new-status"
                            required
                            value={statusForm.newStatus}
                            onChange={e => setStatusForm(f => ({ ...f, newStatus: e.target.value as BookingStatus }))}
                            className={SELECT}
                          >
                            <option value="" disabled>Select status…</option>
                            {nextStatuses.map(s => (
                              <option key={s} value={s}>{SHIPMENT_STATUSES[s]?.label ?? s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Status detail + Location in a 2-col grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel htmlFor="status-detail">Status Detail</FieldLabel>
                        <input
                          id="status-detail"
                          type="text"
                          value={statusForm.statusDetail}
                          onChange={e => setStatusForm(f => ({ ...f, statusDetail: e.target.value }))}
                          placeholder="e.g. Arrived at Dubai Hub"
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="location">Location</FieldLabel>
                        <input
                          id="location"
                          type="text"
                          value={statusForm.location}
                          onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. Business Bay"
                          className={INPUT}
                        />
                      </div>
                    </div>

                    {/* Facility code */}
                    <div>
                      <FieldLabel htmlFor="facility">Facility Code</FieldLabel>
                      <div className="relative">
                        <select
                          id="facility"
                          value={statusForm.facilityCode}
                          onChange={e => setStatusForm(f => ({ ...f, facilityCode: e.target.value }))}
                          className={SELECT}
                        >
                          <option value="">None / Not applicable</option>
                          {Object.entries(FACILITY_CODES).map(([code, name]) => (
                            <option key={code} value={code}>{code} — {name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                      </div>
                    </div>

                    {/* Custom date/time toggle */}
                    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm font-body font-semibold text-text-primary cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={statusForm.useCustomDate}
                          onChange={e => setStatusForm(f => ({ ...f, useCustomDate: e.target.checked }))}
                          className="rounded border-border text-secondary focus:ring-secondary/20"
                        />
                        <Clock className="size-3.5 text-text-secondary" aria-hidden="true" />
                        Use custom date &amp; time (backdate)
                      </label>
                      {statusForm.useCustomDate && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <FieldLabel>Date <span className="text-text-disabled font-normal">(GST UTC+4)</span></FieldLabel>
                            <input
                              type="date"
                              value={statusForm.customDate}
                              max={todayStr()}
                              onChange={e => setStatusForm(f => ({ ...f, customDate: e.target.value }))}
                              className={INPUT}
                            />
                          </div>
                          <div>
                            <FieldLabel>Time</FieldLabel>
                            <input
                              type="time"
                              value={statusForm.customTime}
                              onChange={e => setStatusForm(f => ({ ...f, customTime: e.target.value }))}
                              className={INPUT}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery proof fields (shown when delivered/attempted) */}
                    {(statusForm.newStatus === 'delivered' || statusForm.newStatus === 'delivery_attempted') && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-body font-semibold text-emerald-700 flex items-center gap-1.5">
                          <Camera className="size-3.5" aria-hidden="true" /> Delivery Proof
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <FieldLabel htmlFor="delivered-to">Delivered To</FieldLabel>
                            <input id="delivered-to" type="text" value={statusForm.deliveredTo}
                              onChange={e => setStatusForm(f => ({ ...f, deliveredTo: e.target.value }))}
                              placeholder="Recipient name" className={INPUT} />
                          </div>
                          <div>
                            <FieldLabel htmlFor="photo-url">Photo URL</FieldLabel>
                            <input id="photo-url" type="url" value={statusForm.photoUrl}
                              onChange={e => setStatusForm(f => ({ ...f, photoUrl: e.target.value }))}
                              placeholder="https://…" className={INPUT} />
                          </div>
                        </div>
                        <div>
                          <FieldLabel htmlFor="delivery-notes">Delivery Notes</FieldLabel>
                          <textarea id="delivery-notes" rows={2} value={statusForm.deliveryNotes}
                            onChange={e => setStatusForm(f => ({ ...f, deliveryNotes: e.target.value }))}
                            placeholder="e.g. Left with security guard" className={TEXTAREA} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="sig-url">Signature URL</FieldLabel>
                          <input id="sig-url" type="url" value={statusForm.signatureUrl}
                            onChange={e => setStatusForm(f => ({ ...f, signatureUrl: e.target.value }))}
                            placeholder="https://…" className={INPUT} />
                        </div>
                      </div>
                    )}

                    {/* Internal notes */}
                    <div>
                      <FieldLabel htmlFor="notes">Internal Notes</FieldLabel>
                      <textarea
                        id="notes"
                        rows={2}
                        value={statusForm.notes}
                        onChange={e => setStatusForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Internal notes (not visible to customer)"
                        className={TEXTAREA}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={statusSubmitting || !statusForm.newStatus || nextStatuses.length === 0}
                      className="w-full h-10 bg-primary text-white font-body font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {statusSubmitting ? (
                        <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" /> Updating…</>
                      ) : statusForm.useCustomDate ? 'Update Status (Backdated)' : 'Update Status'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── 2. Tracking ID & Booking Number overrides ─────────────────── */}
            <Section
              icon={<Edit2 className="size-4 text-text-secondary" aria-hidden="true" />}
              title="ID Overrides"
              open={openSections.ids ?? false}
              onToggle={() => toggleSection('ids')}
            >
              {/* Tracking ID */}
              <div>
                <FieldLabel>Tracking ID</FieldLabel>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-primary">
                    {booking.tracking_id}
                  </code>
                  {!editTrackingId && (
                    <button type="button" onClick={() => setEditTrackingId(true)}
                      className="text-xs font-body font-semibold text-secondary hover:underline whitespace-nowrap">
                      Change
                    </button>
                  )}
                </div>
                {editTrackingId && (
                  <div className="mt-2 space-y-1.5">
                    <input
                      type="text"
                      value={trackingIdValue}
                      onChange={e => setTrackingIdValue(e.target.value.toUpperCase())}
                      placeholder="SCDDMM####"
                      pattern="^SC\d{8}$"
                      className={INPUT}
                    />
                    <p className="text-[11px] font-body text-danger flex items-start gap-1">
                      <AlertTriangle className="size-3 mt-0.5 shrink-0" aria-hidden="true" />
                      Changing the tracking ID updates all references. Use with extreme caution. (Not yet saved — contact dev to apply via DB migration.)
                    </p>
                    <button type="button" onClick={() => setEditTrackingId(false)}
                      className="text-xs font-body text-text-secondary hover:underline">Cancel</button>
                  </div>
                )}
              </div>

              {/* Booking Number */}
              <div>
                <FieldLabel>Booking Number</FieldLabel>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-primary">
                    {booking.booking_number}
                  </code>
                  {!editBookingNum && (
                    <button type="button" onClick={() => setEditBookingNum(true)}
                      className="text-xs font-body font-semibold text-secondary hover:underline whitespace-nowrap">
                      Change
                    </button>
                  )}
                </div>
                {editBookingNum && (
                  <div className="mt-2 space-y-1.5">
                    <input
                      type="text"
                      value={bookingNumValue}
                      onChange={e => setBookingNumValue(e.target.value.toUpperCase())}
                      placeholder="SC-YYYYMMDD-XXXX"
                      pattern="^SC-\d{8}-\d{4}$"
                      className={INPUT}
                    />
                    <p className="text-[11px] font-body text-danger flex items-start gap-1">
                      <AlertTriangle className="size-3 mt-0.5 shrink-0" aria-hidden="true" />
                      Booking number changes affect invoices. Use with extreme caution. (Not yet saved — contact dev to apply via DB migration.)
                    </p>
                    <button type="button" onClick={() => setEditBookingNum(false)}
                      className="text-xs font-body text-text-secondary hover:underline">Cancel</button>
                  </div>
                )}
              </div>
            </Section>

            {/* ── 3. Edit Shipment Details ───────────────────────────────────── */}
            <Section
              icon={<Package className="size-4 text-text-secondary" aria-hidden="true" />}
              title="Edit Shipment Details"
              open={openSections.details}
              onToggle={() => toggleSection('details')}
            >
              {/* Receiver info */}
              <p className="text-[11px] font-body font-semibold text-text-disabled uppercase tracking-wider">Receiver</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <input type="text" value={detailsForm.receiverName}
                    onChange={e => setDetailsForm(f => ({ ...f, receiverName: e.target.value }))}
                    className={INPUT} />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input type="text" value={detailsForm.receiverPhone}
                    onChange={e => setDetailsForm(f => ({ ...f, receiverPhone: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Address</FieldLabel>
                  <input type="text" value={detailsForm.receiverAddress}
                    onChange={e => setDetailsForm(f => ({ ...f, receiverAddress: e.target.value }))}
                    className={INPUT} />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input type="text" value={detailsForm.receiverCity}
                    onChange={e => setDetailsForm(f => ({ ...f, receiverCity: e.target.value }))}
                    className={INPUT} />
                </div>
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <input type="text" value={detailsForm.receiverCountry}
                    onChange={e => setDetailsForm(f => ({ ...f, receiverCountry: e.target.value }))}
                    className={INPUT} />
                </div>
              </div>

              {/* Package info */}
              <p className="text-[11px] font-body font-semibold text-text-disabled uppercase tracking-wider mt-2">Package</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <div className="relative">
                    <select value={detailsForm.packageType}
                      onChange={e => setDetailsForm(f => ({ ...f, packageType: e.target.value as PackageType }))}
                      className={SELECT}>
                      {PACKAGE_TYPES.map(pt => (
                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Weight (kg)</FieldLabel>
                  <input type="number" min="0.001" step="0.001" value={detailsForm.weightKg}
                    onChange={e => setDetailsForm(f => ({ ...f, weightKg: e.target.value }))}
                    className={INPUT} />
                </div>
                <div>
                  <FieldLabel>Declared Value (AED)</FieldLabel>
                  <input type="number" min="0" step="0.01" value={detailsForm.declaredValue}
                    onChange={e => setDetailsForm(f => ({ ...f, declaredValue: e.target.value }))}
                    className={INPUT} />
                </div>
                <div>
                  <FieldLabel>Pieces</FieldLabel>
                  <input type="number" min="1" step="1" value={detailsForm.numberOfPieces}
                    onChange={e => setDetailsForm(f => ({ ...f, numberOfPieces: e.target.value }))}
                    className={INPUT} />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Special Instructions</FieldLabel>
                  <textarea rows={2} value={detailsForm.specialInstructions}
                    onChange={e => setDetailsForm(f => ({ ...f, specialInstructions: e.target.value }))}
                    placeholder="Fragile, handle with care…" className={TEXTAREA} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetailsSubmit}
                disabled={detailsSubmitting}
                className="mt-1 w-full h-9 bg-secondary text-primary font-body font-semibold text-sm rounded-xl hover:bg-secondary/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {detailsSubmitting ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />Saving…</>
                ) : 'Save Changes'}
              </button>
            </Section>

            {/* ── 4. Edit Pricing ────────────────────────────────────────────── */}
            <Section
              icon={<DollarSign className="size-4 text-text-secondary" aria-hidden="true" />}
              title="Edit Pricing"
              open={openSections.pricing}
              onToggle={() => toggleSection('pricing')}
            >
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['basePrice',           'Base Price (AED)'],
                    ['weightSurcharge',     'Weight Surcharge (AED)'],
                    ['fuelSurcharge',       'Fuel Surcharge (AED)'],
                    ['insuranceFee',        'Insurance Fee (AED)'],
                    ['codFee',              'COD Fee (AED)'],
                    ['remoteAreaSurcharge', 'Remote Area Surcharge (AED)'],
                    ['discountAmount',      'Discount (AED)'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <FieldLabel>{label}</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingForm[field as keyof typeof pricingForm]}
                      onChange={e => setPricingForm(f => ({ ...f, [field]: e.target.value }))}
                      className={INPUT}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <FieldLabel>Discount Reason</FieldLabel>
                  <input
                    type="text"
                    value={pricingForm.discountReason}
                    onChange={e => setPricingForm(f => ({ ...f, discountReason: e.target.value }))}
                    placeholder="e.g. Loyalty discount"
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Calculated totals */}
              <div className="bg-surface rounded-xl border border-border p-3 space-y-1.5 text-sm font-body">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span className="font-semibold text-text-primary">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>VAT (5%)</span>
                  <span className="font-semibold text-text-primary">AED {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-bold text-primary">
                  <span>Total</span>
                  <span>AED {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-[11px] font-body text-amber-700 flex items-start gap-1.5">
                  <AlertTriangle className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  Changing pricing after invoice generation will NOT update existing invoices. Generate a new invoice to reflect these changes.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePricingSubmit}
                disabled={pricingSubmitting}
                className="w-full h-9 bg-secondary text-primary font-body font-semibold text-sm rounded-xl hover:bg-secondary/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {pricingSubmitting ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />Saving…</>
                ) : 'Save Pricing'}
              </button>
            </Section>

            {/* ── 5. Add Custom Event ────────────────────────────────────────── */}
            <Section
              icon={<Plus className="size-4 text-text-secondary" aria-hidden="true" />}
              title="Add Custom Event"
              open={openSections.custom}
              onToggle={() => toggleSection('custom')}
            >
              <p className="text-xs font-body text-text-secondary">
                Log a free-form event without changing the shipment status (e.g., "Customs document submitted", "Customer contacted").
              </p>
              <div>
                <FieldLabel>Event Label <span className="text-danger">*</span></FieldLabel>
                <input type="text" value={customForm.label}
                  onChange={e => setCustomForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Package Inspected" className={INPUT} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea rows={2} value={customForm.description}
                  onChange={e => setCustomForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional details…" className={TEXTAREA} />
              </div>
              <div>
                <FieldLabel>Location</FieldLabel>
                <input type="text" value={customForm.location}
                  onChange={e => setCustomForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Dubai Customs" className={INPUT} />
              </div>

              {/* Backdate toggle */}
              <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-body font-semibold text-text-primary cursor-pointer select-none">
                  <input type="checkbox" checked={customForm.useCustomDate}
                    onChange={e => setCustomForm(f => ({ ...f, useCustomDate: e.target.checked }))}
                    className="rounded border-border text-secondary focus:ring-secondary/20" />
                  <Clock className="size-3.5 text-text-secondary" aria-hidden="true" />
                  Use custom date &amp; time
                </label>
                {customForm.useCustomDate && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <FieldLabel>Date</FieldLabel>
                      <input type="date" value={customForm.customDate} max={todayStr()}
                        onChange={e => setCustomForm(f => ({ ...f, customDate: e.target.value }))}
                        className={INPUT} />
                    </div>
                    <div>
                      <FieldLabel>Time</FieldLabel>
                      <input type="time" value={customForm.customTime}
                        onChange={e => setCustomForm(f => ({ ...f, customTime: e.target.value }))}
                        className={INPUT} />
                    </div>
                  </div>
                )}
              </div>

              <button type="button" onClick={handleCustomEventSubmit} disabled={customSubmitting}
                className="w-full h-9 bg-primary/10 text-primary border border-primary/20 font-body font-semibold text-sm rounded-xl hover:bg-primary/15 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {customSubmitting ? (
                  <><span className="size-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />Adding…</>
                ) : <>
                  <Plus className="size-4" aria-hidden="true" /> Add Custom Event
                </>}
              </button>
            </Section>

            {/* ── 6. Bulk Events button ──────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="w-full h-10 flex items-center justify-center gap-2 text-sm font-body font-semibold text-text-secondary border-2 border-dashed border-border rounded-xl hover:border-secondary hover:text-secondary transition-colors"
            >
              <Layers className="size-4" aria-hidden="true" />
              Add Multiple Events (Bulk Backdate)
            </button>

            {/* ── 7. Tracking History ────────────────────────────────────────── */}
            <div className="pb-2">
              <h3 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-3 px-1">
                Tracking History
              </h3>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="size-6 rounded-full bg-border shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-border rounded w-1/2" />
                        <div className="h-3 bg-border rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm font-body text-text-disabled text-center py-4">No tracking events yet.</p>
              ) : (
                <ol className="relative border-l border-border ml-2.5 space-y-4">
                  {events.map((ev, i) => (
                    <li key={ev.id} className="pl-5 relative">
                      <span className={`absolute -left-[9px] top-0.5 size-4 rounded-full border-2 border-white flex items-center justify-center ${i === 0 ? 'bg-secondary' : 'bg-border'}`} aria-hidden="true">
                        <span className={`size-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-text-disabled'}`} />
                      </span>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-semibold text-text-primary">
                            {ev.is_custom_event
                              ? <span className="text-text-secondary italic">[Custom] {ev.custom_event_label}</span>
                              : (SHIPMENT_STATUSES[ev.status]?.label ?? ev.status)
                            }
                            {ev.is_backdated && (
                              <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">backdated</span>
                            )}
                          </p>
                          {ev.status_detail && (
                            <p className="text-xs font-body text-text-secondary mt-0.5">{ev.status_detail}</p>
                          )}
                          {ev.location && (
                            <p className="text-xs font-body text-text-disabled mt-0.5 flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden="true" /> {ev.location}
                            </p>
                          )}
                          {ev.delivered_to && (
                            <p className="text-xs font-body text-emerald-700 mt-0.5">Delivered to: {ev.delivered_to}</p>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {/* Timestamp display / edit */}
                          {editTs?.eventId === ev.id ? (
                            <div className="space-y-1.5 text-right">
                              <div className="flex gap-1">
                                <input type="date" value={editTs.date} max={todayStr()}
                                  onChange={e => setEditTs(t => t ? { ...t, date: e.target.value } : t)}
                                  className="h-7 px-2 text-[11px] font-body border border-border rounded-lg focus:outline-none focus:border-secondary w-[110px]" />
                                <input type="time" value={editTs.time}
                                  onChange={e => setEditTs(t => t ? { ...t, time: e.target.value } : t)}
                                  className="h-7 px-2 text-[11px] font-body border border-border rounded-lg focus:outline-none focus:border-secondary w-[80px]" />
                              </div>
                              <input type="text" value={editTs.reason} placeholder="Reason (optional)"
                                onChange={e => setEditTs(t => t ? { ...t, reason: e.target.value } : t)}
                                className="h-7 px-2 text-[11px] font-body border border-border rounded-lg focus:outline-none focus:border-secondary w-full" />
                              <div className="flex gap-1 justify-end">
                                <button type="button" onClick={() => setEditTs(null)}
                                  className="h-6 px-2 text-[11px] font-body text-text-secondary border border-border rounded-lg hover:bg-surface transition-colors">
                                  Cancel
                                </button>
                                <button type="button" onClick={() => handleTsSubmit(ev.id)} disabled={tsSubmitting}
                                  className="h-6 px-2 text-[11px] font-body font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1">
                                  {tsSubmitting && <span className="size-2.5 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin" aria-hidden="true" />}
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <time className="text-[10px] font-body text-text-disabled" dateTime={ev.event_timestamp}>
                                {formatDateTime(ev.event_timestamp)}
                              </time>
                              <button
                                type="button"
                                onClick={() => startEditTs(ev)}
                                className="p-0.5 rounded text-text-disabled hover:text-secondary hover:bg-surface transition-colors"
                                aria-label="Edit timestamp"
                              >
                                <Edit2 className="size-3" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

          </div>
        </aside>
      </div>

      {/* Bulk events modal */}
      <BulkEventsModal
        isOpen={bulkOpen}
        booking={booking}
        onClose={() => setBulkOpen(false)}
        onSaved={() => { onUpdated(); onRefreshEvents(); }}
      />
    </>
  );
}

export default StatusUpdatePanel;
