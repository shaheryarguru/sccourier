'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Package2, MapPin, Clock, Star } from 'lucide-react';

// ── Stat definitions ──────────────────────────────────────────────────────────
const STATS = [
  {
    icon:    Package2,
    value:   10000,
    suffix:  '+',
    label:   'Deliveries Completed',
    desc:    'Parcels successfully delivered',
  },
  {
    icon:    MapPin,
    value:   7,
    suffix:  '',
    label:   'Emirates Covered',
    desc:    'Full UAE nationwide reach',
  },
  {
    icon:    Clock,
    value:   99.2,
    suffix:  '%',
    label:   'On-Time Rate',
    desc:    'Industry-leading reliability',
  },
  {
    icon:    Star,
    value:   4.9,
    suffix:  '/5',
    label:   'Customer Rating',
    desc:    'From 2,000+ verified reviews',
  },
] as const;

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, started: boolean, decimals: number = 0): string {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const start    = performance.now();

    function tick(now: number) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 4);
      setCount(target * ease);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else setCount(target);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, started]);

  if (decimals > 0) return count.toFixed(decimals);
  const rounded = Math.round(count);
  return rounded >= 1000 ? (rounded / 1000).toFixed(0) + 'K' : rounded.toLocaleString();
}

// ── Single stat item ──────────────────────────────────────────────────────────
function StatItem({
  icon: Icon,
  value,
  suffix,
  label,
  desc,
  started,
  index,
}: (typeof STATS)[number] & { started: boolean; index: number }) {
  const reduce = useReducedMotion();
  const decimals = value % 1 !== 0 ? 1 : 0;
  const display  = useCountUp(value as number, started, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={started ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' as const }}
      className="flex flex-col items-center text-center group"
    >
      {/* Icon ring */}
      <motion.div
        className="size-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-secondary/15 group-hover:border-secondary/30 transition-all duration-300"
        whileHover={reduce ? {} : { scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Icon className="size-6 text-secondary" aria-hidden="true" />
      </motion.div>

      {/* Counter */}
      <div className="tabular-nums">
        <span className="font-heading font-bold text-4xl sm:text-5xl text-white tracking-[-0.02em] leading-none">
          {display}{suffix}
        </span>
      </div>

      {/* Label */}
      <p className="mt-2.5 font-heading font-semibold text-base text-white/85">
        {label}
      </p>
      <p className="mt-1 text-xs font-body text-white/40 leading-snug">
        {desc}
      </p>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Stats() {
  const ref      = useRef<HTMLElement>(null);
  const inView   = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section
      ref={ref}
      className="relative py-20 overflow-hidden bg-primary"
      aria-label="Company statistics"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #F59E0B 0%, transparent 70%)' }}
        />
      </div>

      {/* Amber top line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <motion.p
          className="text-center text-xs font-body font-semibold text-secondary/70 uppercase tracking-[0.15em] mb-12"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          Our Track Record
        </motion.p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.label}
              {...stat}
              started={inView}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
