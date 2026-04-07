import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, Zap, Eye, Heart, MapPin, Package, Users, Star,
  CheckCircle2, ArrowRight, TrendingUp, Clock, Award,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about SC Courier (Smart City Courier) — UAE\'s trusted courier and logistics partner serving all 7 Emirates with speed, reliability, and transparency since 2018.',
  openGraph: {
    title: 'About SC Courier | Smart City Courier UAE',
    description: 'Trusted courier & logistics across the UAE since 2018. Learn our story, mission, and values.',
  },
};

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Years of Service',  value: '6+',    icon: Award },
  { label: 'Shipments Handled', value: '500K+', icon: Package },
  { label: 'Happy Customers',   value: '25K+',  icon: Users },
  { label: 'On-Time Rate',      value: '98.4%', icon: TrendingUp },
  { label: 'Emirates Covered',  value: '7',     icon: MapPin },
  { label: 'Avg. Delivery Time', value: '< 24h', icon: Clock },
];

const VALUES = [
  {
    icon:  Shield,
    color: 'bg-primary/10 text-primary',
    title: 'Reliability',
    desc:  'Every package is a promise. We treat each shipment as if it were our own, with full accountability from pickup to delivery.',
  },
  {
    icon:  Zap,
    color: 'bg-secondary/10 text-secondary',
    title: 'Speed',
    desc:  'Time is money. Our optimised routing and dedicated riders ensure your packages move as fast as possible across the UAE.',
  },
  {
    icon:  Eye,
    color: 'bg-accent/10 text-accent',
    title: 'Transparency',
    desc:  'Real-time tracking, instant notifications, and clear pricing — no hidden fees, no surprises. You always know where your parcel is.',
  },
  {
    icon:  Heart,
    color: 'bg-purple-100 text-purple-600',
    title: 'Customer-First',
    desc:  "Your satisfaction defines our success. We go above and beyond to resolve issues, accommodate special requests, and earn your trust.",
  },
];

const EMIRATES = [
  { name: 'Dubai',          hub: 'HUB-DXB', highlight: true  },
  { name: 'Abu Dhabi',      hub: 'HUB-AUH', highlight: true  },
  { name: 'Sharjah',        hub: 'HUB-SHJ', highlight: false },
  { name: 'Ajman',          hub: 'HUB-AJM', highlight: false },
  { name: 'Ras Al Khaimah', hub: 'HUB-RAK', highlight: false },
  { name: 'Fujairah',       hub: 'HUB-FUJ', highlight: false },
  { name: 'Umm Al Quwain',  hub: 'HUB-UAQ', highlight: false },
];

const TEAM = [
  {
    name:    'Ahmed Al Rashidi',
    role:    'Chief Executive Officer',
    initials: 'AR',
    color:   'bg-primary/10 text-primary',
    bio:     '15 years in UAE logistics and supply chain management.',
  },
  {
    name:    'Sarah Mitchell',
    role:    'Chief Operations Officer',
    initials: 'SM',
    color:   'bg-secondary/10 text-secondary-dark',
    bio:     'Former operations lead at DHL Express MENA.',
  },
  {
    name:    'Omar Khalifa',
    role:    'Head of Technology',
    initials: 'OK',
    color:   'bg-accent/10 text-accent-dark',
    bio:     'Built real-time tracking platforms serving 50+ countries.',
  },
  {
    name:    'Priya Nair',
    role:    'Customer Experience Director',
    initials: 'PN',
    color:   'bg-purple-100 text-purple-700',
    bio:     'Passionate about turning logistics into a delightful experience.',
  },
];

const MILESTONES = [
  { year: '2018', event: 'Founded in Dubai with a fleet of 5 riders.' },
  { year: '2019', event: 'Expanded to Abu Dhabi and Sharjah hubs.' },
  { year: '2020', event: 'Launched online booking and real-time tracking.' },
  { year: '2021', event: 'Crossed 100,000 shipments milestone.' },
  { year: '2022', event: 'Covered all 7 Emirates with overnight guarantees.' },
  { year: '2023', event: 'Launched international shipping to 40+ countries.' },
  { year: '2024', event: 'Achieved 500K+ deliveries with 98%+ on-time rate.' },
];

// ── Components ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px w-8 bg-secondary" aria-hidden="true" />
      <span className="text-xs font-body font-semibold text-secondary uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="font-body">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-primary overflow-hidden py-24 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          aria-hidden="true"
        />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 65%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Star className="size-3.5 text-secondary" aria-hidden="true" />
            Trusted since 2018 · 500K+ deliveries
          </div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-6 leading-tight">
            Delivering Trust,<br />
            <span className="text-secondary">On Time — Every Time</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            SC Courier (Smart City Courier) is the UAE&apos;s premium last-mile delivery partner —
            built on technology, driven by reliability, and powered by a passion for exceptional service.
          </p>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border" aria-label="Company statistics">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-border">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                <Icon className="size-5 text-secondary mb-1" aria-hidden="true" />
                <p className="font-heading font-bold text-2xl text-primary">{value}</p>
                <p className="text-xs font-body text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="font-heading font-bold text-3xl text-primary mb-6 leading-tight">
              Born in Dubai,<br />Built for the UAE
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                In 2018, our founders — frustrated with unreliable courier services and zero visibility
                into where their parcels were — decided to build something better. They started with
                five riders, a WhatsApp group, and an unshakeable belief that logistics could be
                simple, transparent, and on time.
              </p>
              <p>
                Today, SC Courier operates across all 7 Emirates with a network of sorting hubs,
                dedicated last-mile riders, and a technology platform that gives customers
                real-time visibility at every step of the journey.
              </p>
              <p>
                We serve everyone from individual customers sending gifts to major e-commerce brands
                handling thousands of shipments daily — all with the same promise: your parcel,
                delivered on time, every time.
              </p>
            </div>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 mt-8 h-11 px-6 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
            >
              Book a Shipment <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
            <ol className="space-y-6 pl-10">
              {MILESTONES.map(({ year, event }) => (
                <li key={year} className="relative">
                  <div className="absolute -left-[26px] top-1 size-4 rounded-full bg-secondary border-2 border-white shadow-sm" aria-hidden="true" />
                  <time className="text-xs font-body font-bold text-secondary uppercase tracking-wider">{year}</time>
                  <p className="font-body text-sm text-text-secondary mt-0.5">{event}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface" aria-labelledby="values-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Our Values</SectionLabel>
            <h2 id="values-heading" className="font-heading font-bold text-3xl text-primary">
              What Drives Us Every Day
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-hover transition-shadow duration-300"
              >
                <div className={`size-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-primary mb-2">{title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coverage ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto" aria-labelledby="coverage-heading">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Coverage</SectionLabel>
            <h2 id="coverage-heading" className="font-heading font-bold text-3xl text-primary mb-4 leading-tight">
              Serving All 7 Emirates
            </h2>
            <p className="font-body text-text-secondary mb-8 leading-relaxed">
              From the skyscrapers of Dubai to the mountains of Fujairah, our network covers
              every corner of the UAE. Each emirate has a dedicated sorting hub staffed by
              local riders who know the roads, the buildings, and the communities.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EMIRATES.map(({ name, hub, highlight }) => (
                <div
                  key={hub}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border ${
                    highlight
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white border-border text-text-primary'
                  }`}
                >
                  <CheckCircle2 className={`size-4 shrink-0 ${highlight ? 'text-secondary' : 'text-accent'}`} aria-hidden="true" />
                  <div>
                    <p className={`text-sm font-semibold ${highlight ? 'text-white' : 'text-text-primary'}`}>{name}</p>
                    <p className={`text-[10px] font-mono ${highlight ? 'text-white/60' : 'text-text-disabled'}`}>{hub}</p>
                  </div>
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2.5 rounded-xl px-4 py-3 border border-dashed border-border bg-surface text-text-secondary">
                <Package className="size-4 text-secondary shrink-0" aria-hidden="true" />
                <p className="text-sm font-body">+ International shipping to 40+ countries</p>
              </div>
            </div>
          </div>

          {/* Visual map placeholder */}
          <div
            className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border border-primary/10 p-8 flex items-center justify-center min-h-[360px]"
            role="img"
            aria-label="UAE coverage map — all 7 emirates"
          >
            <div className="text-center">
              <MapPin className="size-16 text-primary/20 mx-auto mb-4" aria-hidden="true" />
              <p className="font-heading font-bold text-primary/40 text-lg">UAE Coverage</p>
              <p className="text-sm font-body text-primary/30 mt-1">All 7 Emirates · Door-to-door</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {EMIRATES.map(({ name }) => (
                  <span key={name} className="text-xs bg-white/60 text-primary/60 px-2 py-1 rounded-full border border-primary/10">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface" aria-labelledby="team-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Leadership Team</SectionLabel>
            <h2 id="team-heading" className="font-heading font-bold text-3xl text-primary">
              The People Behind SC Courier
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, initials, color, bio }) => (
              <article
                key={name}
                className="bg-white rounded-2xl border border-border p-6 text-center shadow-sm"
              >
                {/* Avatar */}
                <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${color}`}>
                  <span className="font-heading font-bold text-xl">{initials}</span>
                </div>
                <h3 className="font-heading font-semibold text-base text-primary">{name}</h3>
                <p className="text-xs font-body font-semibold text-secondary mt-0.5 mb-3">{role}</p>
                <p className="text-xs font-body text-text-secondary leading-relaxed">{bio}</p>
              </article>
            ))}
          </div>

          <p className="text-center text-sm font-body text-text-disabled mt-10">
            Plus 200+ dedicated riders, hub staff, and customer support specialists across the UAE.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            Ready to Ship with Confidence?
          </h2>
          <p className="font-body text-white/70 mb-8 leading-relaxed">
            Join 25,000+ customers who trust SC Courier for their most important deliveries.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-secondary text-primary font-heading font-bold text-sm rounded-xl hover:bg-secondary/90 transition-colors shadow-gold"
            >
              Book a Shipment <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/10 text-white font-body font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
