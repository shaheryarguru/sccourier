'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Zap, Clock, Rocket, Globe, Package, ArrowRight } from 'lucide-react';

// ── Service definitions ───────────────────────────────────────────────────────
const SERVICES = [
  {
    icon:        Rocket,
    title:       'Same Day Delivery',
    description: 'Lightning-fast delivery within 6 hours — perfect for urgent business shipments across the UAE.',
    price:       'From AED 90',
    badge:       'Fastest',
    badgeColor:  'bg-danger/10 text-danger border-danger/20',
    accentColor: 'group-hover:bg-danger/8',
    href:        '/services#same-day',
  },
  {
    icon:        Zap,
    title:       'Express Delivery',
    description: 'Next business day delivery with priority handling, real-time tracking, and guaranteed timeslots.',
    price:       'From AED 55',
    badge:       'Popular',
    badgeColor:  'bg-secondary/10 text-secondary border-secondary/20',
    accentColor: 'group-hover:bg-secondary/8',
    href:        '/services#express',
  },
  {
    icon:        Clock,
    title:       'Standard Delivery',
    description: 'Reliable 2–3 business day delivery across all seven emirates at the most affordable rates.',
    price:       'From AED 35',
    badge:       '',
    badgeColor:  '',
    accentColor: 'group-hover:bg-primary/5',
    href:        '/services#standard',
  },
  {
    icon:        Globe,
    title:       'International',
    description: 'Seamless worldwide shipping with full customs clearance support and end-to-end tracking.',
    price:       'From AED 120',
    badge:       '',
    badgeColor:  '',
    accentColor: 'group-hover:bg-accent/8',
    href:        '/services#international',
  },
  {
    icon:        Package,
    title:       'Cargo & Freight',
    description: 'Heavy and bulk cargo solutions for businesses — dedicated vehicles, competitive pricing, custom quotes.',
    price:       'Custom Quote',
    badge:       'B2B',
    badgeColor:  'bg-primary/8 text-primary border-primary/15',
    accentColor: 'group-hover:bg-primary/5',
    href:        '/services#cargo',
  },
] as const;

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 32 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function Services() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      className="py-24 bg-surface relative overflow-hidden"
      aria-labelledby="services-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: 'easeOut' as const }}
        >
          <p className="text-xs font-body font-semibold text-secondary uppercase tracking-[0.15em]">
            What We Offer
          </p>
          <h2
            id="services-heading"
            className="font-heading font-bold text-3xl sm:text-4xl text-primary tracking-tight"
          >
            Shipping Solutions for Every Need
          </h2>
          <p className="text-base font-body text-text-secondary leading-relaxed">
            From urgent same-day deliveries to international freight — choose a service that fits your timeline and budget.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {SERVICES.map(({ icon: Icon, title, description, price, badge, badgeColor, accentColor, href }) => (
            <motion.div key={title} variants={cardVariants}>
              <Link
                href={href}
                className={[
                  'group relative flex flex-col bg-white rounded-2xl border border-border p-6',
                  'shadow-[0_1px_3px_rgba(15,43,70,0.06),0_4px_12px_rgba(15,43,70,0.04)]',
                  'hover:-translate-y-1.5 hover:shadow-[0_8px_28px_rgba(15,43,70,0.12)] hover:border-primary/15',
                  'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
                ].join(' ')}
              >
                {/* Badge */}
                {badge && (
                  <span className={[
                    'absolute top-5 right-5 px-2.5 py-0.5 rounded-full text-xs font-body font-semibold border',
                    badgeColor,
                  ].join(' ')}>
                    {badge}
                  </span>
                )}

                {/* Icon */}
                <div className={[
                  'size-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-5',
                  'transition-colors duration-200',
                  accentColor,
                ].join(' ')}>
                  <Icon className="size-5.5 text-primary" aria-hidden="true" />
                </div>

                {/* Content */}
                <h3 className="font-heading font-semibold text-lg text-primary mb-2 leading-snug">
                  {title}
                </h3>
                <p className="text-sm font-body text-text-secondary leading-relaxed flex-1 mb-5">
                  {description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <span className="text-sm font-body font-semibold text-secondary">
                    {price}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-body text-text-disabled group-hover:text-primary group-hover:gap-2 transition-all duration-150">
                    Learn more
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            href="/booking"
            className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-primary text-white
                       font-body font-semibold text-sm hover:bg-primary/90 active:scale-[0.98]
                       transition-all shadow-[0_4px_16px_rgba(15,43,70,0.22)]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            <Package className="size-4" aria-hidden="true" />
            Book Your Shipment
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default Services;
