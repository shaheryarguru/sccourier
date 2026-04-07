'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    name:    'Ahmed Hassan',
    role:    'Operations Manager',
    company: 'LogiTech Solutions, Dubai',
    avatar:  'AH',
    rating:  5,
    text:    'SC Courier has been our go-to logistics partner for 2 years. Their express delivery is always on time, and the real-time tracking gives our clients complete peace of mind.',
  },
  {
    name:    'Sara Mohammed',
    role:    'Founder & CEO',
    company: 'Desert Boutique, Abu Dhabi',
    avatar:  'SM',
    rating:  5,
    text:    'The booking process is incredibly smooth, and their drivers are always professional. Same-day delivery in Dubai has been a game-changer for my e-commerce store.',
  },
  {
    name:    'Khalid Al Mansoori',
    role:    'Procurement Director',
    company: 'Gulf Trade Group, Sharjah',
    avatar:  'KA',
    rating:  5,
    text:    'We ship heavy cargo regularly and SC Courier handles it flawlessly. The invoice system with QR verification is a nice professional touch that our accounting team loves.',
  },
  {
    name:    'Fatima Al Zaabi',
    role:    'Business Owner',
    company: 'Bloom Flowers, Ajman',
    avatar:  'FZ',
    rating:  5,
    text:    'Switched from another courier 6 months ago and never looked back. Prices are fair, the staff are genuinely helpful, and packages always arrive in perfect condition.',
  },
  {
    name:    'Ravi Nair',
    role:    'Supply Chain Lead',
    company: 'TechParts UAE, Ras Al Khaimah',
    avatar:  'RN',
    rating:  5,
    text:    "International shipping used to be a headache. SC Courier's customs clearance support is exceptional — they handle everything and keep you updated every step of the way.",
  },
];

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={['size-3.5', i < rating ? 'text-secondary fill-secondary' : 'text-border'].join(' ')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-primary',
  'bg-secondary text-primary',
  'bg-accent',
  'bg-[#7C3AED]',
  'bg-[#DB2777]',
];

// ── Component ─────────────────────────────────────────────────────────────────
export function Testimonials() {
  const ref          = useRef<HTMLElement>(null);
  const inView       = useInView(ref, { once: true, amount: 0.2 });
  const [active, setActive] = useState(0);
  const [dir, setDir]       = useState<1 | -1>(1);
  const timerRef     = useRef<ReturnType<typeof setTimeout>>(undefined);

  const go = useCallback((next: number, direction: 1 | -1) => {
    setDir(direction);
    setActive((next + REVIEWS.length) % REVIEWS.length);
  }, []);

  // Auto-rotate
  useEffect(() => {
    timerRef.current = setTimeout(() => go(active + 1, 1), 5000);
    return () => clearTimeout(timerRef.current);
  }, [active, go]);

  const prev = () => go(active - 1, -1);
  const next = () => go(active + 1,  1);

  const slideVariants = {
    enter:  (d: number) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: 'easeOut' as const } },
    exit:   (d: number) => ({ x: d * -40, opacity: 0, transition: { duration: 0.3 } }),
  };

  return (
    <section
      ref={ref}
      className="py-24 bg-white relative overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(245,158,11,0.04),transparent)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <motion.div
          className="text-center max-w-xl mx-auto mb-16 space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-body font-semibold text-secondary uppercase tracking-[0.15em]">
            Customer Stories
          </p>
          <h2
            id="testimonials-heading"
            className="font-heading font-bold text-3xl sm:text-4xl text-primary tracking-tight"
          >
            Trusted by Thousands Across the UAE
          </h2>
        </motion.div>

        {/* Desktop: 3 cards + 2 peeking */}
        <motion.div
          className="hidden lg:grid grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {REVIEWS.slice(0, 3).map(({ name, role, company, avatar, rating, text }, i) => (
            <blockquote
              key={name}
              className="relative bg-surface rounded-2xl border border-border p-7 shadow-sm flex flex-col space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              {/* Big quote mark */}
              <Quote className="size-8 text-secondary/15 absolute top-6 right-6" aria-hidden="true" />

              <Stars rating={rating} />
              <p className="text-sm font-body text-text-secondary leading-relaxed flex-1">
                &ldquo;{text}&rdquo;
              </p>
              <footer className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div
                  className={['size-10 rounded-full flex items-center justify-center text-white text-xs font-heading font-bold shrink-0', AVATAR_COLORS[i % AVATAR_COLORS.length]].join(' ')}
                  aria-hidden="true"
                >
                  {avatar}
                </div>
                <div>
                  <cite className="not-italic font-body font-semibold text-sm text-primary block">{name}</cite>
                  <span className="text-xs font-body text-text-disabled">{role} · {company}</span>
                </div>
              </footer>
            </blockquote>
          ))}
        </motion.div>

        {/* Mobile: auto-rotating carousel */}
        <div className="lg:hidden">
          <div className="relative overflow-hidden rounded-2xl">
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.blockquote
                key={active}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-surface rounded-2xl border border-border p-7 space-y-4 relative"
              >
                <Quote className="size-8 text-secondary/15 absolute top-6 right-6" aria-hidden="true" />
                <Stars rating={REVIEWS[active].rating} />
                <p className="text-sm font-body text-text-secondary leading-relaxed">
                  &ldquo;{REVIEWS[active].text}&rdquo;
                </p>
                <footer className="flex items-center gap-3 pt-4 border-t border-border/60">
                  <div
                    className={['size-10 rounded-full flex items-center justify-center text-white text-xs font-heading font-bold shrink-0', AVATAR_COLORS[active % AVATAR_COLORS.length]].join(' ')}
                    aria-hidden="true"
                  >
                    {REVIEWS[active].avatar}
                  </div>
                  <div>
                    <cite className="not-italic font-body font-semibold text-sm text-primary block">
                      {REVIEWS[active].name}
                    </cite>
                    <span className="text-xs font-body text-text-disabled">
                      {REVIEWS[active].role} · {REVIEWS[active].company}
                    </span>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="size-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>

            {/* Dots */}
            <div className="flex gap-1.5" role="tablist" aria-label="Testimonials">
              {REVIEWS.map((r, i) => (
                <button
                  key={r.name}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => go(i, i > active ? 1 : -1)}
                  className={[
                    'rounded-full transition-all duration-200',
                    i === active
                      ? 'w-5 h-1.5 bg-secondary'
                      : 'w-1.5 h-1.5 bg-border hover:bg-text-disabled',
                  ].join(' ')}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="size-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Trust line */}
        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {[
            { label: '4.9/5 average rating', sub: '2,000+ reviews' },
            { label: '50,000+ shipments', sub: 'Successfully delivered' },
            { label: 'All UAE emirates', sub: 'Nationwide coverage' },
          ].map(({ label, sub }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-body font-semibold text-primary">{label}</p>
              <p className="text-xs font-body text-text-disabled">{sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Testimonials;
