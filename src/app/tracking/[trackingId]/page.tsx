import type { Metadata } from 'next';
import { TrackingDetail } from '@/components/tracking/TrackingDetail';
import { createClient }   from '@/lib/supabase/server';

interface Props {
  params:       Promise<{ trackingId: string }>;
  searchParams: Promise<{ new?: string; bn?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trackingId } = await params;
  const id = trackingId.toUpperCase();
  return {
    title:       `Track ${id} — SC Courier`,
    description: `Real-time tracking for shipment ${id}. View status, location updates, estimated delivery, and proof of delivery.`,
  };
}

export default async function TrackingDetailPage({ params, searchParams }: Props) {
  const { trackingId }             = await params;
  const { new: isNew, bn: bn }     = await searchParams;

  const id       = trackingId.toUpperCase();
  const supabase = await createClient();

  // Server-side pre-fetch so the first paint is instant (no loading spinner)
  const [{ data: booking }, { data: events }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, tracking_id, booking_number, status,
        sender_name, sender_city, sender_emirate,
        receiver_name, receiver_city, receiver_country,
        service_type, estimated_delivery,
        total_amount, weight_kg, package_type,
        is_fragile, requires_signature, payment_method,
        created_at
      `)
      .eq('tracking_id', id)
      .single(),
    supabase
      .from('tracking_events')
      .select('*')
      .eq('tracking_id', id)
      .order('event_timestamp', { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-surface pt-20 pb-24 lg:pb-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {booking ? (
          <TrackingDetail
            trackingId={id}
            initialData={{ booking, events: events ?? [] }}
            showNewBanner={isNew === '1' || isNew === 'true'}
            bookingNumber={bn}
          />
        ) : (
          /* Not found — still render the client component so it can show the
             error state with a retry button */
          <TrackingDetail
            trackingId={id}
            showNewBanner={false}
          />
        )}
      </div>
    </div>
  );
}
