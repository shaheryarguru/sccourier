'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, Building, Smartphone, ArrowLeft, Check } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { PaymentSchema, type PaymentForm } from '@/lib/validators/booking';
import type { PricingBreakdown, BookingState } from './BookingForm';
import { formatAED } from '@/lib/utils/format';
import { DEFAULT_TERMS } from '@/lib/utils/constants';

const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash',           description: 'Pay on pickup',            icon: Banknote   },
  { value: 'card',          label: 'Credit / Debit', description: 'Visa, Mastercard, AMEX',   icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer',  description: 'UAE local transfer',       icon: Building   },
  { value: 'online',        label: 'Online Payment', description: 'PayTabs / secure gateway', icon: Smartphone },
  { value: 'cod',           label: 'Cash on Delivery',description: 'Collected on delivery',   icon: Banknote   },
] as const;

interface Props {
  defaultValues?: Partial<PaymentForm>;
  pricing:        PricingBreakdown;
  bookingData:    BookingState;
  loading:        boolean;
  onSubmit:  (data: PaymentForm) => void;
  onBack:    () => void;
}

export function PaymentSection({ defaultValues, pricing, bookingData, loading, onSubmit, onBack }: Props) {
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

  const paymentMethod = watch('payment_method');
  const termsAccepted = watch('terms_accepted');

  const { sender, receiver, package: pkg, service } = bookingData;

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Review & Payment</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2" noValidate>

        {/* Order summary */}
        <div className="bg-surface rounded-xl border border-border divide-y divide-border">
          {/* Sender */}
          <div className="px-4 py-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-1">From</p>
            <p className="text-sm font-body font-medium text-text-primary">{sender?.full_name}</p>
            <p className="text-xs font-body text-text-secondary">{sender?.address_line_1}, {sender?.city}, {sender?.emirate?.toUpperCase()}</p>
          </div>

          {/* Receiver */}
          <div className="px-4 py-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-1">To</p>
            <p className="text-sm font-body font-medium text-text-primary">{receiver?.full_name}</p>
            <p className="text-xs font-body text-text-secondary">{receiver?.address_line_1}, {receiver?.city}, {receiver?.country}</p>
          </div>

          {/* Package */}
          <div className="px-4 py-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-1">Package</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-body text-text-primary">{pkg?.item_name}</p>
              <Badge variant="info" size="sm">{pkg?.package_type}</Badge>
            </div>
            <p className="text-xs font-body text-text-secondary">{pkg?.weight_kg} kg · {pkg?.number_of_pieces} piece(s) · AED {pkg?.declared_value} declared</p>
          </div>

          {/* Service */}
          <div className="px-4 py-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-1">Service</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-body font-semibold text-primary capitalize">{service?.service_type?.replace('_', ' ')}</p>
              {service?.insurance && <Badge variant="success" size="sm">Insured</Badge>}
              {service?.cod && <Badge variant="warning" size="sm">COD</Badge>}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="px-4 py-3 space-y-1.5 text-sm font-body">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>{formatAED(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>VAT (5%)</span>
              <span>{formatAED(pricing.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary text-base pt-1 border-t border-border">
              <span>Total Due</span>
              <span>{formatAED(pricing.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <fieldset>
          <legend className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Payment Method *
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(({ value, label, description, icon: Icon }) => {
              const active = paymentMethod === value;
              return (
                <label
                  key={value}
                  className={[
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
                  ].join(' ')}
                >
                  <input type="radio" value={value} className="sr-only" {...register('payment_method')} />
                  <div className={['size-9 rounded-lg flex items-center justify-center shrink-0', active ? 'bg-primary' : 'bg-surface'].join(' ')}>
                    <Icon className={['size-4', active ? 'text-white' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className={['text-sm font-body font-semibold', active ? 'text-primary' : 'text-text-primary'].join(' ')}>{label}</p>
                    <p className="text-xs font-body text-text-secondary">{description}</p>
                  </div>
                  {active && <Check className="size-4 text-primary shrink-0" aria-hidden="true" />}
                </label>
              );
            })}
          </div>
          {errors.payment_method && (
            <p className="text-xs text-danger mt-2">{errors.payment_method.message}</p>
          )}
        </fieldset>

        {/* Terms */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-surface px-4 py-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
              Terms & Conditions
            </p>
          </div>
          <div className="px-4 py-3 max-h-40 overflow-y-auto">
            <pre className="text-xs font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
              {DEFAULT_TERMS}
            </pre>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="size-4 mt-0.5 rounded border-border accent-primary shrink-0"
                {...register('terms_accepted')}
              />
              <span className="text-sm font-body text-text-secondary">
                I have read and agree to the{' '}
                <span className="text-primary font-medium underline cursor-pointer">Terms & Conditions</span>
                {' '}and{' '}
                <span className="text-primary font-medium underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {errors.terms_accepted && (
              <p className="text-xs text-danger mt-1.5">{errors.terms_accepted.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" size="md" leftIcon={<ArrowLeft />} onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!termsAccepted}
          >
            Confirm & Book — {formatAED(pricing.total_amount)}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default PaymentSection;
