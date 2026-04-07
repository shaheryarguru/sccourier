import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackingSearch } from '@/components/tracking';
import { Skeleton } from '@/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Track Your Shipment — SC Courier',
  description:
    'Track your SC Courier shipment in real time. Enter your tracking ID for live status updates, delivery proof, and ETA.',
};

const FAQ = [
  {
    q: 'How long until my tracking shows updates?',
    a: 'Tracking events update in real time as your shipment moves through our network. New events typically appear within minutes of a status change.',
  },
  {
    q: 'Can I track multiple shipments at once?',
    a: 'Yes — paste up to 10 tracking IDs (separated by commas or spaces) into the search box and click "Track All".',
  },
  {
    q: 'What does the tracking ID look like?',
    a: 'SC Courier tracking IDs follow the format SC + Day + Month + 4-digit sequence. For example: SC29030001 is the 1st shipment booked on March 29th.',
  },
  {
    q: 'My shipment says "On Hold" — what should I do?',
    a: 'Contact our support team at +971 4 000 0000 or info@sccourier.com with your tracking ID. Common reasons include an address issue, failed payment, or customs hold.',
  },
];

// Client-rendered accordion so the page stays a Server Component
import FaqSection from './_components/FaqSection';

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-primary">
            Track Your Shipment
          </h1>
          <p className="text-sm font-body text-text-secondary">
            Enter up to 10 tracking IDs — e.g.{' '}
            <code className="font-mono text-primary">SC29030001</code>
          </p>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <Suspense fallback={<Skeleton variant="text" count={2} />}>
            <TrackingSearch />
          </Suspense>
        </div>

        {/* Tracking ID explainer */}
        <div className="space-y-3">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider text-center">
            How to read your tracking ID
          </p>
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-center gap-2 font-mono text-sm">
              <span className="bg-primary text-white px-2 py-1 rounded-lg font-bold">SC</span>
              <span className="bg-secondary/20 text-primary px-2 py-1 rounded-lg">29</span>
              <span className="bg-secondary/20 text-primary px-2 py-1 rounded-lg">03</span>
              <span className="bg-surface text-text-secondary px-2 py-1 rounded-lg border border-border">0001</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-body text-center text-text-disabled mt-2">
              <span>Prefix</span>
              <span>Day</span>
              <span>Month</span>
              <span>Sequence</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <FaqSection items={FAQ} />
      </div>
    </div>
  );
}
