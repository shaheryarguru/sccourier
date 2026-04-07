'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Zap, Clock, Globe, Package, Truck, Check,
  ArrowRight, ArrowLeft, Shield, Banknote, Calendar,
  Info,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Select, Tooltip } from '@/components/ui';
import { ServiceSchema, type ServiceForm, type PackageForm } from '@/lib/validators/booking';
import type { PricingBreakdown } from './BookingForm';
import { PICKUP_SLOTS, PRICING } from '@/lib/utils/constants';
import { formatAED } from '@/lib/utils/format';

// ── Service type config ───────────────────────────────────────────────────────
const SERVICE_CARDS = [
  {
    value:       'standard',
    label:       'Standard',
    eta:         '2–3 business days',
    from:        PRICING.BASE.standard,
    description: 'Reliable delivery across the UAE',
    badge:       null,
    icon:        Truck,
    accentColor: 'border-border',
  },
  {
    value:       'express',
    label:       'Express',
    eta:         'Next business day',
    from:        PRICING.BASE.express,
    description: 'Priority handling, guaranteed next day',
    badge:       'Popular',
    icon:        Zap,
    accentColor: 'border-secondary',
  },
  {
    value:       'same_day',
    label:       'Same Day',
    eta:         'Within 6 hours',
    from:        PRICING.BASE.same_day,
    description: 'Book before 12 PM for same-day delivery',
    badge:       'Fastest',
    icon:        Clock,
    accentColor: 'border-accent',
  },
  {
    value:       'international',
    label:       'International',
    eta:         '5–10 business days',
    from:        PRICING.BASE.international,
    description: 'Door-to-door worldwide delivery',
    badge:       null,
    icon:        Globe,
    accentColor: 'border-blue-400',
  },
  {
    value:       'cargo',
    label:       'Cargo / Freight',
    eta:         'Custom schedule',
    from:        null,
    description: 'Heavy & bulk shipments, custom quote',
    badge:       'Quote',
    icon:        Package,
    accentColor: 'border-purple-400',
  },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultValues?: Partial<ServiceForm>;
  pricing:        PricingBreakdown;
  packageData?:   Partial<PackageForm>;
  onNext:         (data: ServiceForm) => void;
  onBack:         () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ServiceSelection({ defaultValues, pricing, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver:      zodResolver(ServiceSchema),
    defaultValues: {
      service_type:      'express',
      pickup_requested:  false,
      insurance:         false,
      cod:               false,
      ...defaultValues,
    },
  });

  const serviceType     = watch('service_type');
  const pickupRequested = watch('pickup_requested');
  const insurance       = watch('insurance');
  const cod             = watch('cod');
  const timeSlot        = watch('pickup_time_slot');

  // Tomorrow as min date for pickup
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Service Selection</CardTitle>
          <p className="text-sm font-body text-text-secondary mt-1">
            Choose a delivery speed and add-on services.
          </p>
        </CardHeader>

        <form id="service-form" onSubmit={handleSubmit(onNext)} className="space-y-6 mt-2" noValidate>

          {/* ── Service type cards ─────────────────────────────────────── */}
          <fieldset>
            <legend className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Delivery Speed *
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SERVICE_CARDS.map(card => {
                const Icon   = card.icon;
                const active = serviceType === card.value;
                return (
                  <label
                    key={card.value}
                    className={[
                      'relative flex flex-col gap-2.5 p-4 rounded-xl border-2 cursor-pointer',
                      'transition-all duration-150 group',
                      active
                        ? 'border-primary bg-primary/[0.04] shadow-sm'
                        : 'border-border bg-white hover:border-primary/40 hover:bg-primary/[0.02]',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      value={card.value}
                      className="sr-only"
                      {...register('service_type')}
                    />

                    {card.badge && (
                      <span className={[
                        'absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-body font-bold',
                        card.badge === 'Popular' ? 'bg-secondary text-primary' :
                        card.badge === 'Fastest' ? 'bg-accent text-white' :
                        'bg-surface text-text-secondary border border-border',
                      ].join(' ')}>
                        {card.badge}
                      </span>
                    )}

                    <div className={[
                      'size-10 rounded-xl flex items-center justify-center transition-colors',
                      active ? 'bg-primary' : 'bg-surface group-hover:bg-primary/5',
                    ].join(' ')}>
                      <Icon className={['size-5', active ? 'text-white' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <p className={['text-sm font-body font-bold', active ? 'text-primary' : 'text-text-primary'].join(' ')}>
                          {card.label}
                        </p>
                      </div>
                      <p className={['text-xs font-body font-medium', active ? 'text-secondary' : 'text-text-secondary'].join(' ')}>
                        {card.eta}
                      </p>
                      <p className="text-xs font-body text-text-disabled mt-1 leading-snug">
                        {card.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className={['text-sm font-body font-bold', active ? 'text-primary' : 'text-text-secondary'].join(' ')}>
                        {card.from !== null ? `from ${formatAED(card.from)}` : 'Custom quote'}
                      </p>
                      {active && (
                        <span className="size-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="size-3 text-white" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.service_type && (
              <p className="text-xs text-danger mt-2">{errors.service_type.message}</p>
            )}
          </fieldset>

          {/* ── Pickup request ─────────────────────────────────────────── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <label className={[
              'flex items-center justify-between p-4 cursor-pointer transition-colors',
              pickupRequested ? 'bg-primary/[0.03]' : 'bg-white hover:bg-surface/60',
            ].join(' ')}>
              <div className="flex items-center gap-3">
                <div className={['size-9 rounded-lg flex items-center justify-center', pickupRequested ? 'bg-primary' : 'bg-surface'].join(' ')}>
                  <Truck className={['size-4', pickupRequested ? 'text-white' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-text-primary">Request Pickup</p>
                  <p className="text-xs font-body text-text-secondary">
                    We&apos;ll collect from your address at the selected time
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="sr-only"
                {...register('pickup_requested')}
              />
              <ToggleSwitch
                checked={pickupRequested}
                onChange={v => setValue('pickup_requested', v, { shouldValidate: true })}
              />
            </label>

            {pickupRequested && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-t border-border bg-primary/[0.02] animate-slide-down">
                <div>
                  <label className="text-xs font-body font-medium text-text-secondary block mb-1.5">
                    Pickup Date <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                    <input
                      type="date"
                      min={tomorrowStr}
                      className={[
                        'w-full h-11 pl-10 pr-4 text-sm font-body bg-white border rounded-xl',
                        'focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors',
                        errors.pickup_date ? 'border-danger' : 'border-border hover:border-border-strong',
                      ].join(' ')}
                      {...register('pickup_date')}
                    />
                  </div>
                  {errors.pickup_date && (
                    <p className="text-xs text-danger mt-1">{errors.pickup_date.message}</p>
                  )}
                </div>
                <Select
                  options={PICKUP_SLOTS}
                  label="Time Slot"
                  required
                  value={timeSlot ?? ''}
                  onChange={v => setValue('pickup_time_slot', v as ServiceForm['pickup_time_slot'], { shouldValidate: true })}
                  error={errors.pickup_time_slot?.message}
                />
              </div>
            )}
          </div>

          {/* ── Add-ons ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
              Add-ons
            </p>

            {/* Insurance */}
            <label className={[
              'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150',
              insurance
                ? 'border-accent/40 bg-emerald-50/60'
                : 'border-border bg-white hover:border-accent/30',
            ].join(' ')}>
              <div className="flex items-center gap-3">
                <div className={['size-9 rounded-lg flex items-center justify-center', insurance ? 'bg-accent/10' : 'bg-surface'].join(' ')}>
                  <Shield className={['size-4', insurance ? 'text-accent' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-text-primary">Package Insurance</p>
                  <p className="text-xs font-body text-text-secondary">
                    2% of declared value — full coverage up to declared amount
                  </p>
                </div>
              </div>
              <input type="checkbox" className="sr-only" {...register('insurance')} />
              <ToggleSwitch
                checked={insurance}
                onChange={v => setValue('insurance', v, { shouldValidate: true })}
              />
            </label>

            {/* COD */}
            <label className={[
              'flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150',
              cod
                ? 'border-secondary/40 bg-amber-50/60'
                : 'border-border bg-white hover:border-secondary/30',
              serviceType === 'international' ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}>
              <div className="flex items-center gap-3">
                <div className={['size-9 rounded-lg flex items-center justify-center', cod ? 'bg-secondary/10' : 'bg-surface'].join(' ')}>
                  <Banknote className={['size-4', cod ? 'text-secondary' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-body font-semibold text-text-primary">Cash on Delivery</p>
                    {serviceType === 'international' && (
                      <Tooltip content="COD is not available for international shipments">
                        <Info className="size-3.5 text-text-disabled" aria-hidden="true" />
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-xs font-body text-text-secondary">
                    AED 15 fee · Remitted to you within 3–5 business days
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="sr-only"
                disabled={serviceType === 'international'}
                {...register('cod')}
              />
              <ToggleSwitch
                checked={cod}
                onChange={v => setValue('cod', v, { shouldValidate: true })}
                disabled={serviceType === 'international'}
              />
            </label>
            {errors.cod && (
              <p className="text-xs text-danger -mt-1">{errors.cod.message}</p>
            )}
          </div>

          {/* ── Special instructions ────────────────────────────────────── */}
          <div>
            <label className="text-xs font-body font-medium text-text-secondary block mb-1.5">
              Special Instructions (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Access codes, handling notes, or driver instructions…"
              className="w-full px-4 py-3 text-sm font-body bg-white border border-border rounded-xl
                         focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         hover:border-border-strong transition-colors placeholder:text-text-disabled resize-none"
              {...register('special_instructions')}
            />
          </div>

        </form>
      </Card>

      {/* ── Live pricing card ───────────────────────────────────────────── */}
      <Card padding="md" className="bg-primary text-white border-0 shadow-[0_8px_24px_rgb(15_43_70/0.25)]">
        <p className="text-xs font-body font-semibold text-white/60 uppercase tracking-wider mb-3">
          Estimated Price
        </p>
        <div className="space-y-2 text-sm font-body">
          <PriceLine label="Base price"    amount={pricing.base_price}    />
          {pricing.weight_surcharge > 0 && (
            <PriceLine label="Weight surcharge" amount={pricing.weight_surcharge} />
          )}
          <PriceLine label="Fuel surcharge" amount={pricing.fuel_surcharge} />
          {pricing.insurance_fee > 0 && (
            <PriceLine label="Insurance (2%)" amount={pricing.insurance_fee} />
          )}
          {pricing.cod_fee > 0 && (
            <PriceLine label="COD fee"      amount={pricing.cod_fee}       />
          )}
          <div className="border-t border-white/20 pt-2 mt-2 space-y-2">
            <PriceLine label="Subtotal"     amount={pricing.subtotal}      />
            <PriceLine label="VAT (5%)"     amount={pricing.vat_amount}    />
          </div>
          <div className="border-t border-white/20 pt-2 flex justify-between items-center">
            <span className="text-white font-body font-semibold text-base">Total</span>
            <span className="text-secondary font-heading font-bold text-2xl tabular-nums">
              {formatAED(pricing.total_amount)}
            </span>
          </div>
        </div>
        <p className="text-white/40 text-[10px] font-body mt-3">
          * Final amount may vary based on actual weight &amp; remote area checks.
        </p>
      </Card>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="md" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
          Back
        </Button>
        <Button
          form="service-form"
          type="submit"
          variant="primary"
          size="md"
          rightIcon={<ArrowRight className="size-4" />}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={e => { e.preventDefault(); !disabled && onChange(!checked); }}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-border',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className={[
        'inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
        checked ? 'translate-x-6' : 'translate-x-1',
      ].join(' ')} />
    </button>
  );
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span>
      <span className="text-white tabular-nums">{formatAED(amount)}</span>
    </div>
  );
}

export default ServiceSelection;
