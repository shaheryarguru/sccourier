'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Package, ArrowRight, Search, ChevronDown, MapPin, CheckCircle2 } from 'lucide-react';

// ── Animated background mesh blobs ────────────────────────────────────────────
function MeshBackground() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,#1a3a56,#0F2B46)]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Amber orb — top right */}
      <motion.div
        className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)' }}
        animate={reduce ? {} : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Teal orb — bottom left */}
      <motion.div
        className="absolute -bottom-64 -left-32 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)' }}
        animate={reduce ? {} : { scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Speed lines */}
      {[
        { top: '18%', left: '8%',  w: 120, delay: 0    },
        { top: '35%', left: '3%',  w:  80, delay: 0.4  },
        { top: '52%', left: '6%',  w: 100, delay: 0.8  },
        { top: '70%', left: '4%',  w:  60, delay: 1.2  },
      ].map((l, i) => (
        <motion.div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ top: l.top, left: l.left, width: l.w }}
          animate={reduce ? {} : { scaleX: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: l.delay, ease: 'easeInOut' }}
        />
      ))}

      {/* Geometric accent rings */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full border border-white/[0.04]"
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-[200px] h-[200px] rounded-full border border-white/[0.06]"
        style={{ margin: '50px' }}
        animate={reduce ? {} : { rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-surface/80 to-transparent" />
    </div>
  );
}

// ── Floating shipment card ─────────────────────────────────────────────────────
function ShipmentCard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' as const }}
      aria-hidden="true"
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Glow behind card */}
        <div className="absolute inset-0 rounded-3xl blur-2xl bg-secondary/10 scale-110" />

        <div className="relative bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl p-7 w-[320px] shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-body text-white/40 uppercase tracking-widest mb-1">Live Tracking</p>
              <p className="font-mono font-bold text-secondary text-base tracking-wider">SC29030001</p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-xs font-body font-semibold">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Delivered
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-white/[0.05] rounded-xl">
            <MapPin className="size-3.5 text-secondary shrink-0" />
            <span className="text-xs font-body text-white/60">Dubai, Business Bay</span>
            <ArrowRight className="size-3 text-white/25 mx-0.5 shrink-0" />
            <span className="text-xs font-body text-white/60">Abu Dhabi, Al Reem</span>
          </div>

          {/* Timeline steps */}
          <div className="space-y-2.5">
            {[
              { label: 'Picked Up',        time: '9:30 AM',  done: true  },
              { label: 'In Transit',        time: '11:45 AM', done: true  },
              { label: 'Out for Delivery',  time: '2:00 PM',  done: true  },
              { label: 'Delivered',         time: '3:22 PM',  done: true  },
            ].map(({ label, time, done }, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.12, duration: 0.4 }}
              >
                <CheckCircle2 className={['size-3.5 shrink-0', done ? 'text-accent' : 'text-white/20'].join(' ')} />
                <span className="flex-1 text-xs font-body text-white/75">{label}</span>
                <span className="text-[10px] font-body text-white/35">{time}</span>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs font-body text-white/40">Express · 1 parcel</span>
            <span className="text-sm font-heading font-bold text-secondary">AED 55</span>
          </div>
        </div>

        {/* Floating mini badge */}
        <motion.div
          className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2"
          animate={reduce ? {} : { y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <span className="size-2 rounded-full bg-accent" />
          <span className="text-xs font-body font-semibold text-primary">Real-time updates</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Scroll indicator ───────────────────────────────────────────────────────────
function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8 }}
      aria-hidden="true"
    >
      <span className="text-[10px] font-body text-white/30 uppercase tracking-widest">Scroll</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="size-4 text-white/30" />
      </motion.div>
    </motion.div>
  );
}

// ── Trust badges ───────────────────────────────────────────────────────────────
const TRUST = [
  '50,000+ Deliveries',
  'All 7 Emirates',
  '99.2% On-Time',
  'Insured Shipments',
];

// ── Main component ─────────────────────────────────────────────────────────────
export function Hero() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState('');

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const id = trackingId.trim();
    if (!id) return;
    router.push(`/tracking/${encodeURIComponent(id)}`);
  }

  // Stagger variants
  const containerVariants = {
    hidden:   {},
    visible:  { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden:   { opacity: 0, y: 28 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } },
  };

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <MeshBackground />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28 lg:pt-36 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-8 items-center">

          {/* ── Left col — copy ───────────────────────────────────────────── */}
          <motion.div
            className="space-y-8 lg:max-w-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 w-fit">
              <span className="size-1.5 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
              <span className="text-xs font-body font-semibold text-secondary tracking-[0.08em] uppercase">
                UAE's Smart Courier Network
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants} className="space-y-2">
              <h1
                id="hero-heading"
                className="font-heading font-bold text-[2.75rem] sm:text-5xl xl:text-[3.5rem] text-white leading-[1.08] tracking-[-0.02em]"
              >
                Delivering Trust,
                <br />
                <span className="text-secondary">On Time.</span>
                <br />
                Every Time.
              </h1>
            </motion.div>

            {/* Subheadline */}
            <motion.p variants={itemVariants} className="text-lg font-body text-white/65 leading-relaxed max-w-md">
              Same-day, express & international courier across all seven emirates — with real-time tracking and instant booking.
            </motion.p>

            {/* Quick track */}
            <motion.form variants={itemVariants} onSubmit={handleTrack}>
              <div className="flex items-stretch bg-white/[0.08] border border-white/[0.14] rounded-2xl overflow-hidden backdrop-blur-sm focus-within:border-secondary/50 transition-colors shadow-[0_8px_32px_rgb(0,0,0,0.18)]">
                <div className="flex items-center pl-4 shrink-0">
                  <Search className="size-4.5 text-white/35" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value)}
                  placeholder="Enter tracking ID (e.g. SC29030001)"
                  aria-label="Tracking ID"
                  className="flex-1 h-14 px-3.5 bg-transparent font-mono text-sm text-white placeholder:text-white/30
                             focus:outline-none"
                />
                <button
                  type="submit"
                  className="m-1.5 px-5 h-[calc(100%-12px)] rounded-xl bg-secondary text-primary font-body font-bold text-sm
                             hover:bg-secondary/90 transition-colors shrink-0 flex items-center gap-2"
                >
                  Track
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.form>

            {/* CTA buttons */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-secondary text-primary
                           font-body font-bold text-sm hover:bg-secondary/90 active:scale-[0.98]
                           transition-all shadow-[0_4px_20px_rgb(245_158_11/0.40)]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                <Package className="size-4" aria-hidden="true" />
                Book a Shipment
              </Link>
              <Link
                href="/tracking"
                className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl
                           border border-white/20 text-white font-body font-semibold text-sm
                           hover:bg-white/10 hover:border-white/30 active:scale-[0.98] transition-all
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Track Your Package
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.ul variants={itemVariants} className="flex flex-wrap items-center gap-x-5 gap-y-2" role="list">
              {TRUST.map((badge, i) => (
                <li key={badge} className="flex items-center gap-1.5 text-white/50 text-xs font-body">
                  {i > 0 && <span className="text-white/15 mr-0.5" aria-hidden="true">·</span>}
                  <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
                  {badge}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* ── Right col — visual card ────────────────────────────────────── */}
          <div className="hidden lg:flex justify-center items-center">
            <ShipmentCard />
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}

export default Hero;
