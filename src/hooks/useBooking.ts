'use client';

import { useState, useCallback } from 'react';
import type {
  SenderFormData,
  ReceiverFormData,
  PackageFormData,
  ServiceFormData,
  PaymentFormData,
} from '@/lib/validators/booking';
import type { PricingBreakdown } from '@/components/booking/BookingForm';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BookingFormState {
  sender?:   SenderFormData;
  receiver?: ReceiverFormData;
  package?:  PackageFormData;
  service?:  ServiceFormData;
}

export interface BookingConfirmation {
  trackingId:        string;
  bookingNumber:     string;
  bookingId:         string;
  estimatedDelivery: string;
  totalAmount:       number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useBooking() {
  const [step,         setStep]         = useState(0);
  const [direction,    setDirection]    = useState<'forward' | 'back'>('forward');
  const [formData,     setFormData]     = useState<BookingFormState>({});
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const TOTAL_STEPS = 5;

  const goNext = useCallback(() => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const jumpToStep = useCallback((target: number) => {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  }, [step]);

  const saveStep = useCallback(
    <K extends keyof BookingFormState>(key: K, values: BookingFormState[K]) => {
      setFormData(prev => ({ ...prev, [key]: values }));
      goNext();
    },
    [goNext],
  );

  const submitBooking = useCallback(
    async (payment: PaymentFormData, pricing: PricingBreakdown, data: BookingFormState) => {
      setLoading(true);
      setError(null);
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
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const resetBooking = useCallback(() => {
    setStep(0);
    setDirection('forward');
    setFormData({});
    setConfirmation(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    step,
    direction,
    formData,
    confirmation,
    loading,
    error,
    goNext,
    goBack,
    jumpToStep,
    saveStep,
    submitBooking,
    resetBooking,
    setFormData,
  };
}
