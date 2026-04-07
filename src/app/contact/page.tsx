import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight,
} from 'lucide-react';

// Brand icons removed from lucide-react v1.x — use minimal inline SVGs
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function IconTwitterX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
import { ContactForm } from './_components/ContactForm';
import { getCompanySettings } from '@/lib/utils/company-settings';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with SC Courier. Reach our support team by phone, email, or WhatsApp. Office in Business Bay, Dubai — open Sunday to Thursday 8AM–8PM.',
  openGraph: {
    title: 'Contact SC Courier | UAE Courier Support',
    description: 'Phone, email, WhatsApp and office address. We respond within 1 business day.',
  },
};

// ── Static data ───────────────────────────────────────────────────────────────

const HOURS = [
  { days: 'Sunday – Thursday', hours: '8:00 AM – 8:00 PM' },
  { days: 'Friday – Saturday', hours: '9:00 AM – 5:00 PM' },
  { days: 'Public Holidays',   hours: 'Closed (emergency line active)' },
];

const SOCIALS = [
  { icon: IconInstagram, label: 'Instagram', href: 'https://instagram.com/sccourier' },
  { icon: IconTwitterX,  label: 'X (Twitter)', href: 'https://twitter.com/sccourier' },
  { icon: IconLinkedin,  label: 'LinkedIn',  href: 'https://linkedin.com/company/sccourier' },
  { icon: IconFacebook,  label: 'Facebook',  href: 'https://facebook.com/sccourier' },
];

const SUPPORT_TOPICS = [
  { label: 'Track a Shipment',     href: '/tracking',  icon: '📦' },
  { label: 'Book a Delivery',      href: '/booking',   icon: '🚀' },
  { label: 'View Invoice',         href: '/invoice/verify', icon: '🧾' },
  { label: 'Check Our Services',   href: '/services',  icon: '📋' },
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

export default async function ContactPage() {
  const settings = await getCompanySettings();
  const telHref  = `tel:${settings.company_phone.replace(/\s/g, '')}`;

  const CONTACT_CARDS = [
    {
      icon:    Phone,
      color:   'bg-primary/10 text-primary',
      label:   'Call Us',
      primary: settings.company_phone,
      note:    'Sun–Thu: 8AM–8PM · Fri–Sat: 9AM–5PM',
      href:    telHref,
      cta:     'Call now',
    },
    {
      icon:    MessageCircle,
      color:   'bg-accent/10 text-accent',
      label:   'WhatsApp',
      primary: '+971 50 234 5678',
      note:    'Fastest response · typically < 30 min',
      href:    'https://wa.me/97150234567',
      cta:     'Open WhatsApp',
    },
    {
      icon:    Mail,
      color:   'bg-secondary/10 text-secondary-dark',
      label:   'Email',
      primary: settings.company_email,
      note:    'Response within 1 business day',
      href:    `mailto:${settings.company_email}`,
      cta:     'Send email',
    },
  ];

  return (
    <div className="font-body">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-primary overflow-hidden py-20 px-4">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-4 leading-tight">
            We&apos;re Here to Help
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Questions about a shipment? Need a quote? Want to open a corporate account?
            Our team responds within 1 business day — or faster on WhatsApp.
          </p>
        </div>
      </section>

      {/* ── Contact cards ──────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-surface border-b border-border" aria-label="Contact methods">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {CONTACT_CARDS.map(({ icon: Icon, color, label, primary, note, href, cta }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-hover transition-all duration-300 group flex flex-col gap-3"
            >
              <div className={`size-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform`}>
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider">{label}</p>
                <p className="font-heading font-bold text-base text-primary mt-0.5">{primary}</p>
                <p className="text-xs font-body text-text-secondary mt-0.5">{note}</p>
              </div>
              <span className="text-xs font-body font-semibold text-primary flex items-center gap-1 mt-auto">
                {cta} <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Main content: form + sidebar ───────────────────────────────────── */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">

          {/* Contact form */}
          <div>
            <SectionLabel>Send a Message</SectionLabel>
            <h2 className="font-heading font-bold text-2xl text-primary mb-6">
              How Can We Help You?
            </h2>
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <ContactForm />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Office info */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-primary px-5 py-4">
                <h3 className="font-heading font-semibold text-base text-white">Dubai Head Office</h3>
              </div>
              <div className="p-5 space-y-3.5">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="size-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <address className="font-body not-italic text-text-secondary leading-relaxed">
                    {settings.company_address}
                  </address>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 text-secondary shrink-0" aria-hidden="true" />
                  <a href={telHref} className="font-body text-text-primary hover:text-primary transition-colors">
                    {settings.company_phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-secondary shrink-0" aria-hidden="true" />
                  <a href={`mailto:${settings.company_email}`} className="font-body text-text-primary hover:text-primary transition-colors">
                    {settings.company_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Working hours */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="font-heading font-semibold text-base text-primary mb-4 flex items-center gap-2">
                <Clock className="size-4 text-secondary" aria-hidden="true" />
                Working Hours
              </h3>
              <dl className="space-y-2.5">
                {HOURS.map(({ days, hours }) => (
                  <div key={days} className="flex items-start justify-between gap-3 text-sm">
                    <dt className="font-body text-text-secondary">{days}</dt>
                    <dd className="font-body font-semibold text-text-primary text-right">{hours}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs font-body text-text-disabled mt-4 pt-3 border-t border-border">
                All times are Gulf Standard Time (GST/UTC+4).
              </p>
            </div>

            {/* Self-service links */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="font-heading font-semibold text-sm text-text-secondary uppercase tracking-wider mb-3">
                Quick Self-Service
              </h3>
              <nav aria-label="Self-service links">
                <ul className="space-y-1">
                  {SUPPORT_TOPICS.map(({ label, href, icon }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface transition-colors text-sm font-body text-text-primary group"
                      >
                        <span aria-hidden="true">{icon}</span>
                        {label}
                        <ArrowRight className="size-3.5 text-text-disabled ml-auto group-hover:text-primary transition-colors" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Social media */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
              <h3 className="font-heading font-semibold text-sm text-text-secondary uppercase tracking-wider mb-3">
                Follow Us
              </h3>
              <div className="flex gap-2">
                {SOCIALS.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="size-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp floating hint ─────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-accent/5 border-t border-accent/20">
        <div className="max-w-2xl mx-auto text-center">
          <MessageCircle className="size-8 text-accent mx-auto mb-3" aria-hidden="true" />
          <h2 className="font-heading font-semibold text-lg text-primary mb-2">
            Need a Faster Response?
          </h2>
          <p className="font-body text-text-secondary text-sm mb-5">
            Message us on WhatsApp for real-time support. Our team responds in under 30 minutes
            during business hours.
          </p>
          <a
            href="https://wa.me/97150234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#25D366] text-white font-body font-semibold text-sm rounded-xl hover:bg-[#1ebe59] transition-colors shadow-sm"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </div>
      </section>

    </div>
  );
}
