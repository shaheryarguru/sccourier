'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Package, ArrowRight, Phone, Sparkles } from 'lucide-react';

// ── Component ─────────────────────────────────────────────────────────────────
export function CTA() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="relative py-24 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Amber-to-navy gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#d97706] to-[#0F2B46]" />

      {/* Layered decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Dot mesh */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Primary glow orb — bottom right */}
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #0F2B46, transparent 65%)' }}
        />
        {/* White glow — top left */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent 65%)' }}
        />
        {/* Sparkle accents */}
        {[
          { top: '15%', left: '12%', size: 6  },
          { top: '72%', left: '8%',  size: 4  },
          { top: '20%', right: '10%', size: 5 },
          { top: '65%', right: '15%', size: 7 },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/30"
            style={{ top: s.top, left: (s as any).left, right: (s as any).right, width: s.size, height: s.size }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' as const }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-white" aria-hidden="true" />
            <span className="text-xs font-body font-semibold text-white uppercase tracking-wider">
              Start Shipping Today
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h2
              id="cta-heading"
              className="font-heading font-bold text-4xl sm:text-5xl lg:text-[3.25rem] text-white leading-[1.1] tracking-[-0.02em]"
            >
              Ready to Ship?
              <br />
              <span className="text-primary/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                Book in Under 2 Minutes.
              </span>
            </h2>
            <p className="text-lg font-body text-white/80 max-w-xl mx-auto leading-relaxed">
              Join thousands of UAE businesses who trust SC Courier for fast, reliable, and fully tracked deliveries across all seven emirates.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2.5 h-14 px-8 rounded-xl
                         bg-primary text-white font-body font-bold text-base
                         hover:bg-primary/90 active:scale-[0.98]
                         shadow-[0_4px_24px_rgba(15,43,70,0.4)]
                         transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
            >
              <Package className="size-5" aria-hidden="true" />
              Book a Shipment
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="tel:+97140000000"
              className="inline-flex items-center gap-2.5 h-14 px-8 rounded-xl
                         border-2 border-white/30 text-white font-body font-semibold text-base
                         hover:bg-white/10 hover:border-white/50 active:scale-[0.98]
                         backdrop-blur-sm transition-all
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Phone className="size-5" aria-hidden="true" />
              +971 4 000 0000
            </a>
          </div>

          {/* Micro-copy */}
          <p className="text-xs font-body text-white/50">
            No account required · Instant booking confirmation · Real-time tracking included
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
