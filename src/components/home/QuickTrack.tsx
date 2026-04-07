'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Search, ArrowRight, ScanLine } from 'lucide-react';

// ── Component ─────────────────────────────────────────────────────────────────
export function QuickTrack() {
  const router   = useRouter();
  const ref      = useRef<HTMLElement>(null);
  const inView   = useInView(ref, { once: true, amount: 0.4 });
  const [trackingId, setTrackingId] = useState('');
  const [focused, setFocused] = useState(false);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const id = trackingId.trim();
    if (!id) return;
    router.push(`/tracking/${encodeURIComponent(id)}`);
  }

  return (
    <section
      ref={ref}
      className="relative py-20 bg-white overflow-hidden"
      aria-labelledby="quicktrack-heading"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(245,158,11,0.04),transparent)]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-secondary/10 border border-secondary/20 mb-2">
              <ScanLine className="size-6 text-secondary" aria-hidden="true" />
            </div>
            <h2
              id="quicktrack-heading"
              className="font-heading font-bold text-2xl sm:text-3xl text-primary"
            >
              Track Your Shipment
            </h2>
            <p className="text-sm font-body text-text-secondary">
              Enter your tracking ID to get real-time status updates
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleTrack}>
            <div
              className={[
                'relative flex items-stretch rounded-2xl border-2 transition-all duration-200',
                'shadow-[0_4px_24px_rgba(15,43,70,0.08)]',
                focused
                  ? 'border-secondary shadow-[0_4px_24px_rgba(245,158,11,0.15)]'
                  : 'border-border hover:border-primary/20',
              ].join(' ')}
            >
              <div className="flex items-center pl-5 shrink-0">
                <Search
                  className={['size-5 transition-colors', focused ? 'text-secondary' : 'text-text-disabled'].join(' ')}
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. SC29030001"
                aria-label="Enter tracking ID"
                className="flex-1 h-16 px-4 bg-transparent font-mono text-base text-primary
                           placeholder:text-text-disabled focus:outline-none"
              />
              <div className="flex items-center pr-2">
                <button
                  type="submit"
                  disabled={!trackingId.trim()}
                  className="h-12 px-6 rounded-xl bg-primary text-white font-body font-semibold text-sm
                             hover:bg-primary/90 active:scale-[0.97] transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed
                             flex items-center gap-2
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Track
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Hint */}
            <p className="mt-3 text-center text-xs font-body text-text-disabled">
              Format: <span className="font-mono text-text-secondary">SCDDMM####</span>
              &nbsp;·&nbsp; e.g.&nbsp;
              <button
                type="button"
                className="font-mono text-secondary hover:underline focus-visible:outline-none"
                onClick={() => setTrackingId('SC29030001')}
              >
                SC29030001
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default QuickTrack;
