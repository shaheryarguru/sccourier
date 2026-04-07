'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui';
import { EMIRATES, PACKAGE_TYPES, SERVICE_TYPES, PAYMENT_METHODS, SHIPMENT_STATUSES, UAE_VAT_RATE } from '@/lib/utils/constants';
import { formatAED } from '@/lib/utils/format';
import type { BookingRow, BookingStatus, PackageType, ServiceType, PaymentMethod, PaymentStatus } from '@/lib/types/database';

// ── Form state ────────────────────────────────────────────────────────────────

type FormState = {
  // Meta
  booking_number: string;
  tracking_id: string;
  status: BookingStatus;
  booking_date: string; // YYYY-MM-DD
  regenerate_tracking_id: boolean;
  // Sender
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  sender_address: string;
  sender_city: string;
  sender_emirate: string;
  sender_country: string;
  sender_postal_code: string;
  // Receiver
  receiver_name: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address: string;
  receiver_city: string;
  receiver_emirate: string;
  receiver_country: string;
  receiver_postal_code: string;
  // Package
  package_type: PackageType;
  package_description: string;
  declared_value: number;
  weight_kg: number;
  dimensions_length_cm: string;
  dimensions_width_cm: string;
  dimensions_height_cm: string;
  number_of_pieces: number;
  is_fragile: boolean;
  requires_signature: boolean;
  // Service
  service_type: ServiceType;
  pickup_requested: boolean;
  pickup_date: string;
  pickup_time_slot: string;
  estimated_delivery: string;
  special_instructions: string;
  // Pricing
  base_price: number;
  weight_surcharge: number;
  fuel_surcharge: number;
  insurance_fee: number;
  cod_fee: number;
  remote_area_surcharge: number;
  discount_amount: number;
  discount_reason: string;
  // Payment
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
};

function bookingToForm(b: BookingRow): FormState {
  const dateStr = b.created_at.split('T')[0];
  return {
    booking_number: b.booking_number,
    tracking_id:    b.tracking_id,
    status:         b.status,
    booking_date:   dateStr,
    regenerate_tracking_id: false,
    sender_name:         b.sender_name,
    sender_phone:        b.sender_phone,
    sender_email:        b.sender_email ?? '',
    sender_address:      b.sender_address,
    sender_city:         b.sender_city,
    sender_emirate:      b.sender_emirate,
    sender_country:      b.sender_country,
    sender_postal_code:  b.sender_postal_code ?? '',
    receiver_name:       b.receiver_name,
    receiver_phone:      b.receiver_phone,
    receiver_email:      b.receiver_email ?? '',
    receiver_address:    b.receiver_address,
    receiver_city:       b.receiver_city,
    receiver_emirate:    b.receiver_emirate ?? '',
    receiver_country:    b.receiver_country,
    receiver_postal_code: b.receiver_postal_code ?? '',
    package_type:        b.package_type,
    package_description: b.package_description,
    declared_value:      b.declared_value,
    weight_kg:           b.weight_kg,
    dimensions_length_cm: b.dimensions_length_cm?.toString() ?? '',
    dimensions_width_cm:  b.dimensions_width_cm?.toString() ?? '',
    dimensions_height_cm: b.dimensions_height_cm?.toString() ?? '',
    number_of_pieces:    b.number_of_pieces,
    is_fragile:          b.is_fragile,
    requires_signature:  b.requires_signature,
    service_type:        b.service_type,
    pickup_requested:    b.pickup_requested,
    pickup_date:         b.pickup_date ?? '',
    pickup_time_slot:    b.pickup_time_slot ?? '',
    estimated_delivery:  b.estimated_delivery ?? '',
    special_instructions: b.special_instructions ?? '',
    base_price:          b.base_price,
    weight_surcharge:    b.weight_surcharge,
    fuel_surcharge:      b.fuel_surcharge,
    insurance_fee:       b.insurance_fee,
    cod_fee:             b.cod_fee,
    remote_area_surcharge: b.remote_area_surcharge,
    discount_amount:     b.discount_amount ?? 0,
    discount_reason:     b.discount_reason ?? '',
    payment_method:      b.payment_method,
    payment_status:      b.payment_status,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-3 pb-1.5 border-b border-border">
        {label}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-body font-medium text-text-secondary mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-9 px-3 text-sm font-body bg-surface border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors text-text-primary placeholder:text-text-disabled';
const selectCls = `${inputCls} appearance-none`;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked); } }}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </div>
      <span className="text-sm font-body text-text-primary">{label}</span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EditPanelProps {
  booking:  BookingRow;
  onClose:  () => void;
  onSaved:  (updated: BookingRow) => void;
}

export function EditPanel({ booking, onClose, onSaved }: EditPanelProps) {
  const [form, setForm] = useState<FormState>(() => bookingToForm(booking));
  const [saving, setSaving] = useState(false);
  const [dateChanged, setDateChanged] = useState(false);
  const { success, error: toastError } = useToast();

  // Reset form when booking changes
  useEffect(() => {
    setForm(bookingToForm(booking));
    setDateChanged(false);
  }, [booking]);

  // Auto-calc derived pricing
  const { subtotal, vatAmount, total } = useMemo(() => {
    const s = +(
      form.base_price +
      form.weight_surcharge +
      form.fuel_surcharge +
      form.insurance_fee +
      form.cod_fee +
      form.remote_area_surcharge -
      form.discount_amount
    ).toFixed(2);
    const vat  = +((s * UAE_VAT_RATE) / 100).toFixed(2);
    const tot  = +(s + vat).toFixed(2);
    return { subtotal: s, vatAmount: vat, total: tot };
  }, [form.base_price, form.weight_surcharge, form.fuel_surcharge, form.insurance_fee, form.cod_fee, form.remote_area_surcharge, form.discount_amount]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setNum(key: keyof FormState, raw: string) {
    const n = parseFloat(raw);
    setForm(prev => ({ ...prev, [key]: isNaN(n) ? 0 : n }));
  }

  function handleDateChange(val: string) {
    set('booking_date', val);
    setDateChanged(val !== booking.created_at.split('T')[0]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        booking_number:        form.booking_number,
        tracking_id:           form.tracking_id,
        status:                form.status,
        sender_name:           form.sender_name,
        sender_phone:          form.sender_phone,
        sender_email:          form.sender_email || null,
        sender_address:        form.sender_address,
        sender_city:           form.sender_city,
        sender_emirate:        form.sender_emirate,
        sender_country:        form.sender_country,
        sender_postal_code:    form.sender_postal_code || null,
        receiver_name:         form.receiver_name,
        receiver_phone:        form.receiver_phone,
        receiver_email:        form.receiver_email || null,
        receiver_address:      form.receiver_address,
        receiver_city:         form.receiver_city,
        receiver_emirate:      form.receiver_emirate || null,
        receiver_country:      form.receiver_country,
        receiver_postal_code:  form.receiver_postal_code || null,
        package_type:          form.package_type,
        package_description:   form.package_description,
        declared_value:        form.declared_value,
        weight_kg:             form.weight_kg,
        dimensions_length_cm:  form.dimensions_length_cm ? parseFloat(form.dimensions_length_cm) : null,
        dimensions_width_cm:   form.dimensions_width_cm  ? parseFloat(form.dimensions_width_cm)  : null,
        dimensions_height_cm:  form.dimensions_height_cm ? parseFloat(form.dimensions_height_cm) : null,
        number_of_pieces:      form.number_of_pieces,
        is_fragile:            form.is_fragile,
        requires_signature:    form.requires_signature,
        service_type:          form.service_type,
        pickup_requested:      form.pickup_requested,
        pickup_date:           form.pickup_date || null,
        pickup_time_slot:      form.pickup_time_slot || null,
        estimated_delivery:    form.estimated_delivery || null,
        special_instructions:  form.special_instructions || null,
        base_price:            form.base_price,
        weight_surcharge:      form.weight_surcharge,
        fuel_surcharge:        form.fuel_surcharge,
        insurance_fee:         form.insurance_fee,
        cod_fee:               form.cod_fee,
        remote_area_surcharge: form.remote_area_surcharge,
        discount_amount:       form.discount_amount,
        discount_reason:       form.discount_reason || null,
        payment_method:        form.payment_method,
        payment_status:        form.payment_status,
      };

      if (dateChanged) {
        body.booking_date            = form.booking_date;
        body.regenerate_tracking_id  = form.regenerate_tracking_id;
      }

      const res  = await fetch(`/api/booking/${booking.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = json.details?.formErrors?.join('; ') ?? json.message ?? 'Save failed';
        toastError('Save failed', msg);
        return;
      }

      success('Booking saved', `${json.booking.booking_number} updated`);
      onSaved(json.booking as BookingRow);
    } catch {
      toastError('Save failed', 'Network error — please try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-label="Edit booking">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <aside className="relative flex flex-col w-full max-w-[640px] bg-white h-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-heading font-bold text-base text-primary">Edit Booking</h2>
            <p className="font-mono text-xs text-text-secondary mt-0.5">{booking.booking_number}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-secondary transition-colors" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">

          {/* ── META ── */}
          <FieldGroup label="Booking Meta">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Booking #">
                <input className={inputCls} value={form.booking_number} onChange={e => set('booking_number', e.target.value)} />
              </Field>
              <Field label="Tracking ID">
                <input className={inputCls} value={form.tracking_id} onChange={e => set('tracking_id', e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value as BookingStatus)}>
                  {Object.entries(SHIPMENT_STATUSES).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Booking Date">
                <input type="date" className={inputCls} value={form.booking_date} onChange={e => handleDateChange(e.target.value)} />
              </Field>
            </div>

            {dateChanged && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-body text-amber-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                  Changing the booking date will update the creation timestamp.
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.regenerate_tracking_id}
                    onChange={e => set('regenerate_tracking_id', e.target.checked)}
                    className="rounded border-border"
                  />
                  Regenerate Tracking ID &amp; Booking # to match new date
                </label>
              </div>
            )}
          </FieldGroup>

          {/* ── SENDER ── */}
          <FieldGroup label="Sender Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input className={inputCls} value={form.sender_name} onChange={e => set('sender_name', e.target.value)} />
              </Field>
              <Field label="Phone" required>
                <input className={inputCls} value={form.sender_phone} onChange={e => set('sender_phone', e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputCls} value={form.sender_email} onChange={e => set('sender_email', e.target.value)} />
            </Field>
            <Field label="Address" required>
              <input className={inputCls} value={form.sender_address} onChange={e => set('sender_address', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required>
                <input className={inputCls} value={form.sender_city} onChange={e => set('sender_city', e.target.value)} />
              </Field>
              <Field label="Emirate" required>
                <select className={selectCls} value={form.sender_emirate} onChange={e => set('sender_emirate', e.target.value)}>
                  <option value="">— Select —</option>
                  {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <input className={inputCls} value={form.sender_country} onChange={e => set('sender_country', e.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input className={inputCls} value={form.sender_postal_code} onChange={e => set('sender_postal_code', e.target.value)} />
              </Field>
            </div>
          </FieldGroup>

          {/* ── RECEIVER ── */}
          <FieldGroup label="Receiver Details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input className={inputCls} value={form.receiver_name} onChange={e => set('receiver_name', e.target.value)} />
              </Field>
              <Field label="Phone" required>
                <input className={inputCls} value={form.receiver_phone} onChange={e => set('receiver_phone', e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" className={inputCls} value={form.receiver_email} onChange={e => set('receiver_email', e.target.value)} />
            </Field>
            <Field label="Address" required>
              <input className={inputCls} value={form.receiver_address} onChange={e => set('receiver_address', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required>
                <input className={inputCls} value={form.receiver_city} onChange={e => set('receiver_city', e.target.value)} />
              </Field>
              <Field label="Emirate (if UAE)">
                <select className={selectCls} value={form.receiver_emirate} onChange={e => set('receiver_emirate', e.target.value)}>
                  <option value="">— Select —</option>
                  {EMIRATES.map(em => <option key={em.value} value={em.value}>{em.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country" required>
                <input className={inputCls} value={form.receiver_country} onChange={e => set('receiver_country', e.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input className={inputCls} value={form.receiver_postal_code} onChange={e => set('receiver_postal_code', e.target.value)} />
              </Field>
            </div>
          </FieldGroup>

          {/* ── PACKAGE ── */}
          <FieldGroup label="Package Details">
            <Field label="Package Type" required>
              <select className={selectCls} value={form.package_type} onChange={e => set('package_type', e.target.value as PackageType)}>
                {PACKAGE_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
            </Field>
            <Field label="Description" required>
              <textarea
                className={`${inputCls} h-auto py-2`}
                rows={2}
                value={form.package_description}
                onChange={e => set('package_description', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Declared Value (AED)" required>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.declared_value} onChange={e => setNum('declared_value', e.target.value)} />
              </Field>
              <Field label="Weight (kg)" required>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.weight_kg} onChange={e => setNum('weight_kg', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Length (cm)">
                <input type="number" min="0" step="0.1" className={inputCls} placeholder="—" value={form.dimensions_length_cm} onChange={e => set('dimensions_length_cm', e.target.value)} />
              </Field>
              <Field label="Width (cm)">
                <input type="number" min="0" step="0.1" className={inputCls} placeholder="—" value={form.dimensions_width_cm} onChange={e => set('dimensions_width_cm', e.target.value)} />
              </Field>
              <Field label="Height (cm)">
                <input type="number" min="0" step="0.1" className={inputCls} placeholder="—" value={form.dimensions_height_cm} onChange={e => set('dimensions_height_cm', e.target.value)} />
              </Field>
            </div>
            <Field label="Pieces">
              <input type="number" min="1" step="1" className={inputCls} value={form.number_of_pieces} onChange={e => setNum('number_of_pieces', e.target.value)} />
            </Field>
            <div className="flex gap-6">
              <Toggle checked={form.is_fragile} onChange={v => set('is_fragile', v)} label="Fragile" />
              <Toggle checked={form.requires_signature} onChange={v => set('requires_signature', v)} label="Requires Signature" />
            </div>
          </FieldGroup>

          {/* ── SERVICE ── */}
          <FieldGroup label="Service Details">
            <Field label="Service Type" required>
              <select className={selectCls} value={form.service_type} onChange={e => set('service_type', e.target.value as ServiceType)}>
                {SERVICE_TYPES.map(st => <option key={st.value} value={st.value}>{st.label} — {st.description}</option>)}
              </select>
            </Field>
            <Toggle checked={form.pickup_requested} onChange={v => set('pickup_requested', v)} label="Pickup Requested" />
            {form.pickup_requested && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pickup Date">
                  <input type="date" className={inputCls} value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} />
                </Field>
                <Field label="Time Slot">
                  <select className={selectCls} value={form.pickup_time_slot} onChange={e => set('pickup_time_slot', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="morning">Morning (9 AM – 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                    <option value="evening">Evening (5 PM – 9 PM)</option>
                  </select>
                </Field>
              </div>
            )}
            <Field label="Estimated Delivery">
              <input type="date" className={inputCls} value={form.estimated_delivery} onChange={e => set('estimated_delivery', e.target.value)} />
            </Field>
            <Field label="Special Instructions">
              <textarea className={`${inputCls} h-auto py-2`} rows={2} value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} />
            </Field>
          </FieldGroup>

          {/* ── PRICING ── */}
          <FieldGroup label="Pricing (AED)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base Price">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.base_price} onChange={e => setNum('base_price', e.target.value)} />
              </Field>
              <Field label="Weight Surcharge">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.weight_surcharge} onChange={e => setNum('weight_surcharge', e.target.value)} />
              </Field>
              <Field label="Fuel Surcharge">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.fuel_surcharge} onChange={e => setNum('fuel_surcharge', e.target.value)} />
              </Field>
              <Field label="Insurance Fee">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.insurance_fee} onChange={e => setNum('insurance_fee', e.target.value)} />
              </Field>
              <Field label="COD Fee">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.cod_fee} onChange={e => setNum('cod_fee', e.target.value)} />
              </Field>
              <Field label="Remote Area Surcharge">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.remote_area_surcharge} onChange={e => setNum('remote_area_surcharge', e.target.value)} />
              </Field>
              <Field label="Discount (AED)">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.discount_amount} onChange={e => setNum('discount_amount', e.target.value)} />
              </Field>
              <Field label="Discount Reason">
                <input className={inputCls} value={form.discount_reason} onChange={e => set('discount_reason', e.target.value)} placeholder="Optional" />
              </Field>
            </div>

            {/* Live preview */}
            <div className="bg-surface rounded-xl p-3 text-sm space-y-1.5 border border-border">
              <div className="flex justify-between font-body text-text-secondary text-xs">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-text-primary">{formatAED(subtotal)}</span>
              </div>
              <div className="flex justify-between font-body text-text-secondary text-xs">
                <span>VAT (5%)</span>
                <span className="tabular-nums font-medium text-text-primary">{formatAED(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-body font-semibold text-text-primary pt-1.5 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums text-primary">{formatAED(total)}</span>
              </div>
            </div>
          </FieldGroup>

          {/* ── PAYMENT ── */}
          <FieldGroup label="Payment">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment Method">
                <select className={selectCls} value={form.payment_method} onChange={e => set('payment_method', e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                </select>
              </Field>
              <Field label="Payment Status">
                <select className={selectCls} value={form.payment_status} onChange={e => set('payment_status', e.target.value as PaymentStatus)}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="refunded">Refunded</option>
                </select>
              </Field>
            </div>
          </FieldGroup>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm font-body font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-body font-medium bg-surface border border-border text-text-primary px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
}
