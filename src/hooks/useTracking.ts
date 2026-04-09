'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from './useRealtime';
import type { BookingStatus, BookingRow, TrackingEventRow } from '@/lib/types/database';

// ── Public API shape ─────────────────────────────────────────────────────────

export interface TrackingData {
  booking: Pick<
    BookingRow,
    | 'id'
    | 'booking_number'
    | 'tracking_id'
    | 'status'
    | 'sender_name'
    | 'sender_city'
    | 'sender_emirate'
    | 'receiver_name'
    | 'receiver_city'
    | 'receiver_emirate'
    | 'receiver_country'
    | 'service_type'
    | 'estimated_delivery'
    | 'total_amount'
    | 'weight_kg'
    | 'package_type'
    | 'is_fragile'
    | 'requires_signature'
    | 'payment_method'
    | 'created_at'
  >;
  events: TrackingEventRow[];
}

export interface UseTrackingResult {
  data:      TrackingData | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
  isLive:    boolean;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTracking(trackingId: string | null): UseTrackingResult {
  const [data,    setData]    = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!trackingId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tracking?id=${encodeURIComponent(trackingId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Failed to fetch tracking info (${res.status})`);
      }
      const json = await res.json();
      setData({ booking: json.booking, events: json.events ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tracking data.');
    } finally {
      setLoading(false);
    }
  }, [trackingId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime: watch the booking row for status changes ───────────────────
  useRealtime<BookingRow>({
    table:  'bookings',
    filter: trackingId ? `tracking_id=eq.${trackingId.toUpperCase()}` : undefined,
    enabled: !!trackingId,
    onRecord({ record }) {
      if (record.tracking_id?.toUpperCase() === trackingId?.toUpperCase()) {
        setData(prev => prev ? { ...prev, booking: { ...prev.booking, ...record } } : prev);
      }
    },
  });

  // ── Realtime: watch tracking_events for new events ───────────────────────
  useRealtime<TrackingEventRow>({
    table:  'tracking_events',
    filter: trackingId ? `tracking_id=eq.${trackingId.toUpperCase()}` : undefined,
    enabled: !!trackingId,
    onRecord({ eventType, record }) {
      if (eventType === 'INSERT') {
        setData(prev => {
          if (!prev) return prev;
          // Avoid duplicates
          const already = prev.events.some(e => e.id === record.id);
          if (already) return prev;
          return { ...prev, events: [record, ...prev.events] };
        });
      }
    },
  });

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isLive:  !!trackingId,
  };
}

export default useTracking;

// ── Convenience: derive current status from events or booking ────────────────

export function deriveCurrentStatus(data: TrackingData | null): BookingStatus {
  if (!data) return 'pending';
  // Skip admin-only audit entries (is_custom_event) — they must never drive
  // the displayed status since they have today's timestamp and a stale status.
  // Sort real events by timestamp descending, take the latest one.
  const realEvents = data.events
    .filter(e => !e.is_custom_event)
    .sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime());
  const latestReal = realEvents[0]?.status;
  return latestReal ?? data.booking.status;
}
