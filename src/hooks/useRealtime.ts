'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions<T> {
  /** Supabase table to subscribe to */
  table: string;
  /** Filter: column=value (e.g. "tracking_id=eq.SC29030001") */
  filter?: string;
  /** Called for any INSERT/UPDATE/DELETE on the matching rows */
  onRecord: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; record: T; old: Partial<T> }) => void;
  /** Whether the subscription is active */
  enabled?: boolean;
}

/**
 * Generic hook that subscribes to Supabase Realtime changes on a table.
 * Cleans up the channel when the component unmounts or `enabled` becomes false.
 */
export function useRealtime<T extends object>({
  table,
  filter,
  onRecord,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Keep a stable ref to the callback so we don't re-subscribe on every render
  const onRecordRef = useRef(onRecord);
  useEffect(() => {
    onRecordRef.current = onRecord;
  });

  const subscribe = useCallback(() => {
    const supabase = createClient();
    const channelName = `${table}${filter ? `_${filter}` : ''}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event:  '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          onRecordRef.current({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            record:    payload.new  as T,
            old:       payload.old as Partial<T>,
          });
        },
      )
      .subscribe();

    channelRef.current = channel;
    return channel;
  }, [table, filter]);

  useEffect(() => {
    if (!enabled) return;

    subscribe();

    return () => {
      const supabase = createClient();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, subscribe]);
}

export default useRealtime;
