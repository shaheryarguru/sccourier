'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Banknote, CreditCard, Building2, Globe, PackageCheck,
  ArrowLeft, Check, Edit3, Shield, Truck, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { PaymentSchema, type PaymentForm } from '@/lib/validators/booking';
import type { PricingBreakdown, BookingState } from './BookingForm';
import { formatAED, slugToLabel } from '@/lib/utils/format';
import { DEFAULT_TERMS, PAYMENT_METHODS as PM_LIST } from '@/lib/utils/constants';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cash:          Banknote,
  card:          CreditCard,
  bank_transfer: Building2,
  cod:           PackageCheck,
  online:        Globe,
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultValues?: Partial<PaymentForm>;
  pricing:        PricingBreakdown;
  bookingData:    BookingState;
  loading:        boolean;
  onSubmit:       (data: PaymentForm) => void;
  onBack:         () => void;
  onJumpToStep:   (step: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingSummary({
  defaultValues, pricing, bookingData, loading, onSubmit, onBack, onJumpToStep,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver:      zodResolver(PaymentSchema),
    defaultValues: { payment_method: 'card', ...defaultValues },
  });

  const [termsExpanded, setTermsExpanded] = useState(false);

  const paymentMethod = watch('payment_method');
  const termsAccepted = watch('terms_accepted');

  const { sender, receiver, package: pkg, service } = bookingData;

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Review & Payment</CardTitle>
        <p className="text-sm font-body text-text-secondary mt-1">
          Double-check your details before confirming the booking.
        </p>
      </CardHeader>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5 mt-2" noValidate>

        {/* ── Order summary ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">

          {/* From */}
          <SummaryRow title="From" onEdit={() => onJumpToStep(0)}>
            <p className="font-medium text-text-primary">{sender?.full_name}</p>
            {sender?.company_name && (
              <p className="text-text-secondary">{sender.company_name}</p>
            )}
            <p className="text-text-secondary">{sender?.phone}</p>
            <p className="text-text-secondary truncate">
              {[sender?.address_line_1, sender?.city, sender?.emirate?.toUpperCase()]
                .filter(Boolean).join(', ')}
            </p>
          </SummaryRow>

          {/* To */}
          <SummaryRow title="To" onEdit={() => onJumpToStep(1)}>
            <p className="font-medium text-text-primary">{receiver?.full_name}</p>
            <p className="text-text-secondary">
              {receiver?.phone_country_code} {receiver?.phone}
            </p>
            <p className="text-text-secondary truncate">
              {[receiver?.address_line_1, receiver?.city, receiver?.country]
                .filter(Boolean).join(', ')}
            </p>
            {receiver?.delivery_instructions && (
              <p className="text-text-secondary italic text-xs mt-0.5">
                &ldquo;{receiver.delivery_instructions}&rdquo;
              </p>
            )}
          </SummaryRow>

          {/* Package */}
          <SummaryRow title="Package" onEdit={() => onJumpToStep(2)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-text-primary">{pkg?.item_name}</span>
              <Badge variant="info" size="sm">{slugToLabel(pkg?.package_type ?? '')}</Badge>
              {pkg?.is_fragile && <Badge variant="warning" size="sm">Fragile</Badge>}
              {pkg?.requires_signature && <Badge variant="neutral" size="sm">Signature Req.</Badge>}
            </div>
            <p className="text-text-secondary">{pkg?.description}</p>
            <p className="text-text-secondary">
              {pkg?.weight_kg} kg &middot; {pkg?.number_of_pieces}{' '}
              {(pkg?.number_of_pieces ?? 1) === 1 ? 'piece' : 'pieces'} &middot; AED {pkg?.declared_value} declared
            </p>
          </SummaryRow>

          {/* Service */}
          <SummaryRow title="Service" onEdit={() => onJumpToStep(3)}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-primary capitalize">
                {service?.service_type?.replace(/_/g, ' ')}
              </p>
              {service?.insurance && <Badge variant="success" size="sm"><Shield className="size-2.5 mr-0.5" aria-hidden="true" />Insured</Badge>}
              {service?.cod && <Badge variant="warning" size="sm">COD</Badge>}
            </div>
            {service?.pickup_requested && service.pickup_date ? (
              <p className="text-text-secondary flex items-center gap-1.5">
                <Truck className="size-3.5" aria-hidden="true" />
                Pickup {service.pickup_date}
                {service.pickup_time_slot && ` · ${slugToLabel(service.pickup_time_slot)}`}
              </p>
            ) : (
              <p className="text-text-secondary text-xs">Drop-off at nearest SC hub</p>
            )}
            {service?.special_instructions && (
              <p className="text-text-secondary italic text-xs">
                &ldquo;{service.special_instructions}&rdquo;
              </p>
            )}
          </SummaryRow>

          {/* Price breakdown */}
          <div className="px-4 py-4 space-y-2 text-sm font-body bg-surface/50">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Price Breakdown
            </p>
            <PriceLine label="Base price"    amount={pricing.base_price} />
            {pricing.weight_surcharge > 0 && (
              <PriceLine label="Weight surcharge" amount={pricing.weight_surcharge} />
            )}
            <PriceLine label="Fuel surcharge" amount={pricing.fuel_surcharge} />
            {pricing.insurance_fee > 0 && (
              <PriceLine label="Package insurance" amount={pricing.insurance_fee} />
            )}
            {pricing.cod_fee > 0 && (
              <PriceLine label="COD fee" amount={pricing.cod_fee} />
            )}
            {pricing.remote_area_surcharge > 0 && (
              <PriceLine label="Remote area surcharge" amount={pricing.remote_area_surcharge} />
            )}
            <div className="border-t border-border pt-2 space-y-1.5">
              <PriceLine label="Subtotal" amount={pricing.subtotal} />
              <PriceLine label="VAT (5%)"  amount={pricing.vat_amount} />
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-bold text-primary text-lg">
                <span>Total Due</span>
                <span>{formatAED(pricing.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment method ────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Payment Method *
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PM_LIST.map(({ value, label, description }) => {
              const Icon   = PAYMENT_ICONS[value] ?? Banknote;
              const active = paymentMethod === value;
              return (
                <label
                  key={value}
                  className={[
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150',
                    active
                      ? 'border-primary bg-primary/[0.04] shadow-sm'
                      : 'border-border bg-white hover:border-primary/40 hover:bg-primary/[0.02]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    value={value}
                    className="sr-only"
                    {...register('payment_method')}
                  />
                  <div className={[
                    'size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-primary' : 'bg-surface',
                  ].join(' ')}>
                    <Icon className={['size-4', active ? 'text-white' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={['text-sm font-body font-semibold', active ? 'text-primary' : 'text-text-primary'].join(' ')}>
                      {label}
                    </p>
                    <p className="text-xs font-body text-text-secondary truncate">{description}</p>
                  </div>
                  {active && <Check className="size-4 text-primary shrink-0" aria-hidden="true" />}
                </label>
              );
            })}
          </div>
          {errors.payment_method && (
            <p className="text-xs text-danger mt-2 flex items-center gap-1">
              {errors.payment_method.message}
            </p>
          )}
        </fieldset>

        {/* ── Terms & Conditions ────────────────────────────────────────── */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setTermsExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface/80 transition-colors text-left"
            aria-expanded={termsExpanded}
          >
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
              Terms & Conditions
            </p>
            {termsExpanded
              ? <ChevronUp className="size-4 text-text-secondary" aria-hidden="true" />
              : <ChevronDown className="size-4 text-text-secondary" aria-hidden="true" />
            }
          </button>

          {termsExpanded && (
            <div className="px-4 py-3 max-h-48 overflow-y-auto border-t border-border bg-white">
              <pre className="text-xs font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
                {DEFAULT_TERMS}
              </pre>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border bg-white">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="size-4 mt-0.5 rounded border-border accent-primary shrink-0"
                {...register('terms_accepted')}
              />
              <span className="text-sm font-body text-text-secondary leading-relaxed">
                I have read and agree to SC Courier&apos;s{' '}
                <button
                  type="button"
                  onClick={() => setTermsExpanded(true)}
                  className="text-primary font-medium underline underline-offset-2"
                >
                  Terms & Conditions
                </button>
                {' '}and Privacy Policy
              </span>
            </label>
            {errors.terms_accepted && (
              <p className="text-xs text-danger mt-1.5">{errors.terms_accepted.message}</p>
            )}
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft className="size-4" />}
            onClick={onBack}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!termsAccepted || loading}
          >
            {loading ? 'Creating booking…' : `Confirm & Book — ${formatAED(pricing.total_amount)}`}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────
function SummaryRow({
  title,
  onEdit,
  children,
}: {
  title:    string;
  onEdit:   () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3.5 bg-white">
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider">
          {title}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors font-body font-medium"
        >
          <Edit3 className="size-3" aria-hidden="true" />
          Edit
        </button>
      </div>
      <div className="text-sm font-body space-y-0.5">{children}</div>
    </div>
  );
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between text-text-secondary">
      <span>{label}</span>
      <span className="tabular-nums">{formatAED(amount)}</span>
    </div>
  );
}

export default BookingSummary;
