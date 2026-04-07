import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Package, Zap, Clock, Globe, Truck, FileText,
  CheckCircle2, ArrowRight, Shield, Banknote,
} from 'lucide-react';
import { FaqAccordion } from './_components/FaqAccordion';

export const metadata: Metadata = {
  title: 'Our Services',
  description:
    'Explore SC Courier\'s full range of courier and logistics services across the UAE — Standard, Express, Same-Day, International, and Cargo shipping with real-time tracking.',
  openGraph: {
    title: 'Courier Services — SC Courier UAE',
    description: 'Standard, Express, Same-Day, International & Cargo shipping across the UAE and worldwide.',
  },
};

// ── Data ──────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon:     Package,
    color:    'bg-slate-100 text-slate-600',
    badge:    null,
    name:     'Standard Delivery',
    tagline:  '2–3 Business Days',
    price:    'From AED 35',
    desc:     'Reliable, cost-effective delivery for non-urgent packages across the UAE. Perfect for e-commerce fulfillment and regular business shipments.',
    features: [
      'Door-to-door collection & delivery',
      'Real-time tracking',
      'Proof of delivery (signature + photo)',
      'Up to 30 kg per parcel',
      'Damage protection up to AED 100',
    ],
  },
  {
    icon:     Zap,
    color:    'bg-secondary/10 text-secondary-dark',
    badge:    'Most Popular',
    name:     'Express Delivery',
    tagline:  'Next Business Day',
    price:    'From AED 55',
    desc:     'Guaranteed next-day delivery across all Emirates. Ideal for urgent documents, time-sensitive business materials, and priority parcels.',
    features: [
      'Next business day guarantee',
      'Priority handling at sorting hubs',
      'SMS + email notifications',
      'Enhanced tracking updates every 30 min',
      'Free re-delivery on first attempt',
    ],
  },
  {
    icon:     Clock,
    color:    'bg-accent/10 text-accent-dark',
    badge:    'Fastest',
    name:     'Same-Day Delivery',
    tagline:  'Within 6 Hours',
    price:    'From AED 90',
    desc:     'Booked by noon? Delivered by evening. Our fastest service for critical documents, gifts, medical supplies, and anything that can\'t wait.',
    features: [
      'Delivery within 6 hours of pickup',
      'Dedicated rider assigned',
      'Live GPS tracking for recipient',
      'Available in Dubai, Abu Dhabi & Sharjah',
      'WhatsApp notifications to recipient',
    ],
  },
  {
    icon:     Globe,
    color:    'bg-blue-50 text-blue-600',
    badge:    null,
    name:     'International Shipping',
    tagline:  '5–10 Business Days',
    price:    'From AED 120',
    desc:     'Ship anywhere in the world from the UAE. We handle customs documentation, duties, and last-mile delivery in 40+ destination countries.',
    features: [
      'Door-to-door worldwide',
      'Full customs documentation support',
      'DDP (Delivery Duties Paid) option',
      'Tracking in destination country',
      'Prohibited items advisory included',
    ],
  },
  {
    icon:     Truck,
    color:    'bg-orange-50 text-orange-600',
    badge:    null,
    name:     'Cargo & Freight',
    tagline:  'Heavy & Bulk Shipments',
    price:    'Quote Required',
    desc:     'For shipments over 30 kg, pallets, and bulk commercial cargo. We provide tailored logistics solutions for B2B and industrial clients.',
    features: [
      'Shipments from 30 kg to several tonnes',
      'Pallet and crate handling',
      'Dedicated account manager',
      'Temperature-controlled options',
      'Warehousing & storage available',
    ],
  },
  {
    icon:     FileText,
    color:    'bg-primary/10 text-primary',
    badge:    null,
    name:     'Document Courier',
    tagline:  'Legal & Business Documents',
    price:    'From AED 25',
    desc:     'Secure handling of legal, financial, and government documents. Tamper-evident packaging and signature-upon-delivery for complete peace of mind.',
    features: [
      'Tamper-evident sealed envelopes',
      'Signature confirmation required',
      'Chain of custody documentation',
      'Same-day & next-day options',
      'DIFC & legal firm specialists',
    ],
  },
];

const COMPARISON = [
  { feature: 'Delivery Speed',           std: '2–3 days',  exp: 'Next day',   sd: '< 6 hours', intl: '5–10 days' },
  { feature: 'Max Weight',               std: '30 kg',     exp: '30 kg',      sd: '15 kg',     intl: '30 kg'     },
  { feature: 'Real-time Tracking',        std: '✓',         exp: '✓',          sd: 'GPS live',  intl: '✓'         },
  { feature: 'Proof of Delivery',         std: '✓',         exp: '✓',          sd: '✓',         intl: '✓'         },
  { feature: 'SMS Notifications',         std: '✗',         exp: '✓',          sd: 'WhatsApp',  intl: '✓'         },
  { feature: 'Re-delivery (free)',         std: '1st',       exp: '1st',        sd: '1st',       intl: '1st'       },
  { feature: 'Insurance Coverage',        std: 'AED 100',   exp: 'AED 500',    sd: 'AED 200',   intl: 'AED 500'   },
  { feature: 'Customs Support',           std: '✗',         exp: '✗',          sd: '✗',         intl: '✓'         },
];

const ADDONS = [
  { icon: Shield,   name: 'Shipment Insurance',   desc: '2% of declared value. Protects against loss or damage.' },
  { icon: Banknote, name: 'Cash on Delivery',      desc: 'AED 15 fee. Collect payment from receiver on your behalf.' },
  { icon: Clock,    name: 'Pickup Scheduling',     desc: 'Free for orders above AED 80. Schedule morning, afternoon, or evening.' },
];

const FAQS = [
  {
    q: 'What is the latest cut-off time for Same-Day delivery?',
    a: 'Bookings must be placed by 12:00 PM (noon) for same-day delivery. The package is collected within 1–2 hours and delivered within 6 hours of pickup. Available in Dubai, Abu Dhabi, and Sharjah on business days (Sunday–Thursday).',
  },
  {
    q: 'How is the shipping cost calculated?',
    a: 'Cost is based on (1) service type, (2) package weight, and (3) delivery zone. The first kilogram is included in the base price; each additional kg is charged at AED 2. Volumetric weight applies for large, light packages. Use our booking form for an instant quote.',
  },
  {
    q: 'Can I ship internationally from the UAE?',
    a: 'Yes. We ship to 40+ countries worldwide. International rates depend on destination, weight, and service level (economy or express). We handle all export documentation, and our team advises on restricted and prohibited items for each destination.',
  },
  {
    q: 'What happens if my package is not delivered on the first attempt?',
    a: 'The first re-delivery attempt is free, within the next 2 business days. We\'ll contact the recipient first to arrange a suitable time. A second re-delivery incurs an AED 15 surcharge. After three failed attempts, the package is held at the nearest hub for collection or returned to sender.',
  },
  {
    q: 'Are there items you cannot ship?',
    a: 'Yes. Prohibited items include: flammable/explosive materials, weapons and ammunition, live animals, perishable food (without special arrangement), counterfeit goods, and items banned under UAE law. Our booking form includes a full prohibited items checklist.',
  },
  {
    q: 'How does insurance work?',
    a: 'Basic coverage is included (AED 100 for standard, AED 500 for express/international). Additional insurance is available at 2% of the declared value at booking. Claims must be submitted within 7 days of the expected delivery date with supporting documentation.',
  },
  {
    q: 'Can I track my shipment in real time?',
    a: 'Yes. Every booking receives a tracking ID (format: SCDDMMXXXX). Track instantly at sccourier.com/tracking or via the link in your confirmation SMS/email. Same-day deliveries have live GPS tracking for the recipient.',
  },
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

function Tick({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2 text-sm font-body text-text-secondary">
      <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
      {label}
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  return (
    <div className="font-body">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-primary overflow-hidden py-24 px-4">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-6 leading-tight">
            Every Shipment,<br />
            <span className="text-secondary">Every Distance</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            From same-day letters to international freight — we have the service, the technology,
            and the team to get it there on time.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 h-12 px-8 bg-secondary text-primary font-heading font-bold text-sm rounded-xl hover:bg-secondary/90 transition-colors shadow-gold"
          >
            Get Instant Quote <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Service Cards ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-7xl mx-auto" aria-labelledby="services-heading">
        <div className="text-center mb-12">
          <SectionLabel>Our Services</SectionLabel>
          <h2 id="services-heading" className="font-heading font-bold text-3xl text-primary">
            Delivery Solutions for Every Need
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, color, badge, name, tagline, price, desc, features }) => (
            <article
              key={name}
              className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-hover transition-shadow duration-300 flex flex-col"
            >
              <div className="p-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`size-11 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  {badge && (
                    <span className="text-[10px] font-body font-bold bg-secondary text-primary px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {badge}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-lg text-primary">{name}</h3>
                <p className="text-xs font-body font-semibold text-secondary mt-0.5 mb-3">{tagline}</p>
                <p className="font-body text-sm text-text-secondary mb-5 leading-relaxed">{desc}</p>

                {/* Features */}
                <ul className="space-y-2">
                  {features.map(f => <Tick key={f} label={f} />)}
                </ul>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-body text-text-disabled uppercase tracking-wider">Starting from</p>
                  <p className="font-heading font-bold text-lg text-primary">{price}</p>
                </div>
                <Link
                  href="/booking"
                  className="flex items-center gap-1.5 text-xs font-body font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Book now <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Add-ons ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface" aria-labelledby="addons-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Add-ons</SectionLabel>
            <h2 id="addons-heading" className="font-heading font-bold text-2xl text-primary">
              Enhance Your Shipment
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {ADDONS.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center mb-3">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-heading font-semibold text-base text-primary mb-1">{name}</h3>
                <p className="text-sm font-body text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto" aria-labelledby="compare-heading">
        <div className="text-center mb-10">
          <SectionLabel>Compare</SectionLabel>
          <h2 id="compare-heading" className="font-heading font-bold text-2xl text-primary">
            Side-by-Side Comparison
          </h2>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm bg-white">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-5 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-48">Feature</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Standard</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-secondary uppercase tracking-wider bg-secondary/5">Express</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Same-Day</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">International</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON.map(({ feature, std, exp, sd, intl }) => (
                <tr key={feature} className="hover:bg-surface/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-text-primary">{feature}</td>
                  <td className="px-5 py-3.5 text-center text-text-secondary">{std}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-text-primary bg-secondary/5">{exp}</td>
                  <td className="px-5 py-3.5 text-center text-text-secondary">{sd}</td>
                  <td className="px-5 py-3.5 text-center text-text-secondary">{intl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs font-body text-text-disabled mt-4">
          ✓ = Included · ✗ = Not included · All prices in AED and exclusive of 5% UAE VAT
        </p>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-surface" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>FAQ</SectionLabel>
            <h2 id="faq-heading" className="font-heading font-bold text-2xl text-primary">
              Frequently Asked Questions
            </h2>
          </div>
          <FaqAccordion items={FAQS} />
          <p className="text-center text-sm font-body text-text-secondary mt-8">
            Still have questions?{' '}
            <Link href="/contact" className="text-primary hover:underline font-semibold">
              Contact our team
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl text-white mb-4">
            Not Sure Which Service?
          </h2>
          <p className="font-body text-white/70 mb-8">
            Our booking form gives you an instant price based on your specific shipment.
            No registration required to get a quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-secondary text-primary font-heading font-bold text-sm rounded-xl hover:bg-secondary/90 transition-colors shadow-gold"
            >
              Get Instant Quote <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/10 text-white font-body font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              Speak to a Specialist
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
