'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Copy, Check, ExternalLink, RotateCcw, Calendar,
  Download,
} from 'lucide-react';
import { Stepper, Card, Button, useToast } from '@/components/ui';
import { SenderDetails }   from './SenderDetails';
import { ReceiverDetails } from './ReceiverDetails';
import { PackageDetails }  from './PackageDetails';
import { ServiceSelection } from './ServiceSelection';
import { BookingSummary }  from './BookingSummary';
import type {
  SenderFormData,
  ReceiverFormData,
  PackageFormData,
  ServiceFormData,
  PaymentFormData,
} from '@/lib/validators/booking';
import { PRICING, UAE_VAT_RATE } from '@/lib/utils/constants';
import { formatAED, formatDate } from '@/lib/utils/format';

// ── Steps definition ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Sender',   description: 'Your details'     },
  { label: 'Receiver', description: 'Delivery address' },
  { label: 'Package',  description: 'Item details'     },
  { label: 'Service',  description: 'Choose speed'     },
  { label: 'Review',   description: 'Review & pay'     },
];

// ── Pricing calculator (client-side preview) ──────────────────────────────────
export interface PricingBreakdown {
  base_price:            number;
  weight_surcharge:      number;
  fuel_surcharge:        number;
  insurance_fee:         number;
  cod_fee:               number;
  remote_area_surcharge: number;
  subtotal:              number;
  vat_amount:            number;
  total_amount:          number;
}

export function calcPrice(
  pkg: Partial<PackageFormData>,
  svc: Partial<ServiceFormData>,
): PricingBreakdown {
  const serviceType     = svc.service_type ?? 'standard';
  const base            = PRICING.BASE[serviceType as keyof typeof PRICING.BASE] ?? PRICING.BASE.standard;
  const weightKg        = pkg.weight_kg ?? 0;
  const weightSurcharge = weightKg > PRICING.WEIGHT.FREE_KG
    ? +(((weightKg - PRICING.WEIGHT.FREE_KG) * PRICING.WEIGHT.RATE_PER_KG).toFixed(2))
    : 0;
  const fuelSurcharge  = PRICING.FUEL_SURCHARGE;
  const insuranceFee   = svc.insurance ? +((pkg.declared_value ?? 0) * PRICING.INSURANCE_RATE).toFixed(2) : 0;
  const codFee         = svc.cod ? PRICING.COD_FEE : 0;
  const remoteArea     = 0;

  const subtotal  = +(base + weightSurcharge + fuelSurcharge + insuranceFee + codFee + remoteArea).toFixed(2);
  const vatAmount = +((subtotal * UAE_VAT_RATE) / 100).toFixed(2);
  const total     = +(subtotal + vatAmount).toFixed(2);

  return {
    base_price:            +base.toFixed(2),
    weight_surcharge:      weightSurcharge,
    fuel_surcharge:        fuelSurcharge,
    insurance_fee:         insuranceFee,
    cod_fee:               codFee,
    remote_area_surcharge: remoteArea,
    subtotal,
    vat_amount:            vatAmount,
    total_amount:          total,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BookingState {
  sender?:   SenderFormData;
  receiver?: ReceiverFormData;
  package?:  PackageFormData;
  service?:  ServiceFormData;
  payment?:  PaymentFormData;
}

interface BookingConfirmation {
  trackingId:        string;
  bookingNumber:     string;
  bookingId:         string;
  estimatedDelivery: string;
  totalAmount:       number;
}

// ── Framer Motion variants ────────────────────────────────────────────────────
function makeVariants(dir: 'forward' | 'back') {
  const x = dir === 'forward' ? 32 : -32;
  return {
    initial:  { opacity: 0,   x },
    animate:  { opacity: 1,   x: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
    exit:     { opacity: 0,   x: -x, transition: { duration: 0.18, ease: 'easeIn' as const } },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BookingForm() {
  const { error: toastError } = useToast();

  const [step,         setStep]         = useState(0);
  const [direction,    setDirection]    = useState<'forward' | 'back'>('forward');
  const [data,         setData]         = useState<BookingState>({});
  const [loading,      setLoading]      = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [copied,       setCopied]       = useState(false);

  const pricing = calcPrice(data.package ?? {}, data.service ?? {});

  const goNext = useCallback(() => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const jumpToStep = useCallback((target: number) => {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  }, [step]);

  function saveStep<K extends keyof BookingState>(key: K, value: BookingState[K]) {
    setData(prev => ({ ...prev, [key]: value }));
    goNext();
  }

  async function submitBooking(payment: PaymentFormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/booking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, payment, pricing }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Booking failed. Please try again.');
      }
      const result = await res.json();
      setConfirmation({
        trackingId:        result.trackingId,
        bookingNumber:     result.bookingNumber,
        bookingId:         result.bookingId,
        estimatedDelivery: result.estimatedDelivery ?? '',
        totalAmount:       pricing.total_amount,
      });
    } catch (err) {
      toastError('Booking Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyTrackingId() {
    if (!confirmation) return;
    navigator.clipboard.writeText(confirmation.trackingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Confirmation screen ─────────────────────────────────────────────────
  if (confirmation) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Card padding="lg" className="text-center">
          {/* Animated check */}
          <div className="flex justify-center mb-6">
            <div className="size-20 rounded-full bg-accent/10 flex items-center justify-center animate-bounce-in">
              <svg
                viewBox="0 0 52 52"
                className="size-12"
                fill="none"
                stroke="#10B981"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="26" cy="26" r="23" strokeWidth="2" stroke="#10B981" opacity="0.25" />
                <path
                  d="M13 27l9 9 17-17"
                  strokeWidth="3"
                  className="animate-checkmark"
                  style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
                />
              </svg>
            </div>
          </div>

          <h2 className="font-heading font-bold text-2xl text-primary">Booking Confirmed!</h2>
          <p className="text-sm font-body text-text-secondary mt-1.5 mb-6">
            Your shipment is registered and ready. Track it in real-time using the ID below.
          </p>

          {/* Details card */}
          <div className="bg-surface rounded-2xl border border-border p-5 text-left space-y-4 mb-6">
            {/* Tracking ID */}
            <div>
              <p className="text-xs font-body text-text-disabled uppercase tracking-wider mb-1">
                Tracking ID
              </p>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-2xl text-primary tracking-wide">
                  {confirmation.trackingId}
                </code>
                <button
                  type="button"
                  onClick={copyTrackingId}
                  className="size-7 flex items-center justify-center rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                  aria-label="Copy tracking ID"
                  title="Copy to clipboard"
                >
                  {copied
                    ? <Check className="size-3.5 text-accent" aria-hidden="true" />
                    : <Copy className="size-3.5 text-text-secondary" aria-hidden="true" />
                  }
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm font-body">
              <div>
                <p className="text-xs text-text-disabled mb-0.5">Booking Number</p>
                <p className="text-text-primary font-medium text-xs">{confirmation.bookingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-text-disabled mb-0.5">Amount</p>
                <p className="text-primary font-bold">{formatAED(confirmation.totalAmount)}</p>
              </div>
              {confirmation.estimatedDelivery && (
                <div className="col-span-2">
                  <p className="text-xs text-text-disabled mb-0.5 flex items-center gap-1">
                    <Calendar className="size-3" aria-hidden="true" />
                    Estimated Delivery
                  </p>
                  <p className="text-text-primary font-semibold">
                    {formatDate(confirmation.estimatedDelivery)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Link href={`/tracking/${confirmation.trackingId}`}>
              <Button variant="primary" size="lg" fullWidth rightIcon={<ExternalLink className="size-4" />}>
                Track Your Shipment
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                leftIcon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                onClick={copyTrackingId}
              >
                {copied ? 'Copied!' : 'Copy ID'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                leftIcon={<RotateCcw className="size-4" />}
                onClick={() => {
                  setConfirmation(null);
                  setData({});
                  setStep(0);
                  setDirection('forward');
                  setCopied(false);
                }}
              >
                Book Another
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Multi-step form ─────────────────────────────────────────────────────
  const variants = makeVariants(direction);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Stepper */}
      <Card padding="none" className="px-6 py-5">
        <Stepper
          steps={STEPS}
          currentStep={step}
          onStepClick={jumpToStep}
          allowBack
        />
      </Card>

      {/* Step content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
        >
          {step === 0 && (
            <SenderDetails
              defaultValues={data.sender}
              onNext={v => saveStep('sender', v)}
            />
          )}
          {step === 1 && (
            <ReceiverDetails
              defaultValues={data.receiver}
              senderData={data.sender}
              onNext={v => saveStep('receiver', v)}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <PackageDetails
              defaultValues={data.package}
              onNext={v => saveStep('package', v)}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <ServiceSelection
              defaultValues={data.service}
              pricing={pricing}
              packageData={data.package}
              onNext={v => saveStep('service', v)}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <BookingSummary
              defaultValues={data.payment}
              pricing={pricing}
              bookingData={data}
              loading={loading}
              onSubmit={submitBooking}
              onBack={goBack}
              onJumpToStep={jumpToStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default BookingForm;
