import type { Metadata } from 'next';
import { BookingForm } from '@/components/booking';

export const metadata: Metadata = {
  title: 'Book a Shipment — SC Courier',
  description:
    'Book a courier shipment with SC Courier. Same-day, express, and international delivery across the UAE. Get an instant tracking ID.',
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10">
      {/* Page header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-0">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-primary">
          Book a Shipment
        </h1>
        <p className="text-sm font-body text-text-secondary mt-1">
          Complete all steps to generate your tracking ID. Prices include 5% VAT.
        </p>
      </div>

      {/* Multi-step form */}
      <BookingForm />
    </div>
  );
}
