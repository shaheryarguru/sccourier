import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { getCompanySettings } from '@/lib/utils/company-settings';

// ── Social icons (lucide-react v3 removed social icons) ───────────────────────
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[15px]">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[15px]">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[15px]">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[15px]">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL = [
  { href: 'https://facebook.com',  Icon: FacebookIcon,  label: 'Facebook'    },
  { href: 'https://instagram.com', Icon: InstagramIcon, label: 'Instagram'   },
  { href: 'https://linkedin.com',  Icon: LinkedInIcon,  label: 'LinkedIn'    },
  { href: 'https://x.com',         Icon: XIcon,         label: 'X (Twitter)' },
];

const QUICK_LINKS = [
  { href: '/',         label: 'Home'     },
  { href: '/about',    label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/tracking', label: 'Track Shipment' },
  { href: '/contact',  label: 'Contact'  },
];

const SERVICE_LINKS = [
  { href: '/services#standard',      label: 'Standard Delivery'  },
  { href: '/services#express',        label: 'Express Delivery'   },
  { href: '/services#same-day',       label: 'Same Day Delivery'  },
  { href: '/services#international',  label: 'International'      },
  { href: '/services#cargo',          label: 'Cargo & Freight'    },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy'   },
  { href: '/terms',   label: 'Terms of Service' },
];

// ── Reusable column heading ────────────────────────────────────────────────────
function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading font-semibold text-xs uppercase tracking-[0.12em] text-white/40 mb-5">
      {children}
    </h3>
  );
}

// ── Reusable footer link ───────────────────────────────────────────────────────
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-body text-white/65 hover:text-secondary transition-colors duration-150"
    >
      {children}
    </Link>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export async function Footer() {
  const year     = new Date().getFullYear();
  const settings = await getCompanySettings();
  const telHref  = `tel:${settings.company_phone.replace(/\s/g, '')}`;

  return (
    <footer className="relative bg-primary text-white" role="contentinfo">

      {/* Amber accent line */}
      <div className="h-[3px] bg-gradient-to-r from-secondary/80 via-secondary to-secondary/60" aria-hidden="true" />

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Col 1 — Brand ─────────────────────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <Logo size="md" theme="light" />
            <p className="text-sm font-body text-white/60 leading-relaxed">
              Delivering trust, on time — every time. UAE‑based courier
              connecting businesses and individuals across all seven emirates.
            </p>

            {/* Social links */}
            <div>
              <p className="text-xs font-body text-white/30 uppercase tracking-wider mb-3">
                Follow us
              </p>
              <ul className="flex items-center gap-2" role="list" aria-label="Social media">
                {SOCIAL.map(({ href, Icon, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={[
                        'flex items-center justify-center size-8 rounded-lg',
                        'bg-white/8 border border-white/10',
                        'text-white/60 hover:text-primary hover:bg-secondary hover:border-secondary',
                        'transition-all duration-150',
                      ].join(' ')}
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Col 2 — Quick Links ────────────────────────────────────────── */}
          <div>
            <ColHeading>Quick Links</ColHeading>
            <ul className="space-y-3" role="list">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3 — Our Services ──────────────────────────────────────── */}
          <div>
            <ColHeading>Our Services</ColHeading>
            <ul className="space-y-3" role="list">
              {SERVICE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 4 — Contact Us ─────────────────────────────────────────── */}
          <div>
            <ColHeading>Contact Us</ColHeading>
            <ul className="space-y-4" role="list">
              <li className="flex items-start gap-3">
                <MapPin
                  className="size-4 text-secondary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-body text-white/65 leading-snug">
                  {settings.company_address}
                </span>
              </li>
              <li>
                <a
                  href={telHref}
                  className="flex items-center gap-3 text-sm font-body text-white/65 hover:text-secondary transition-colors group"
                >
                  <Phone className="size-4 text-secondary shrink-0" aria-hidden="true" />
                  {settings.company_phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.company_email}`}
                  className="flex items-center gap-3 text-sm font-body text-white/65 hover:text-secondary transition-colors"
                >
                  <Mail className="size-4 text-secondary shrink-0" aria-hidden="true" />
                  {settings.company_email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock
                  className="size-4 text-secondary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-body text-white/65 leading-snug">
                  Mon – Sat: 8:00 AM – 9:00 PM<br />
                  Sunday: 10:00 AM – 6:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

            {/* Copyright + TRN */}
            <p className="text-xs font-body text-white/40 text-center sm:text-left">
              © {year} {settings.company_name}. All rights reserved.
              <span className="mx-2 text-white/20" aria-hidden="true">·</span>
              TRN: {settings.company_trn}
            </p>

            {/* Legal links */}
            <ul className="flex items-center gap-4" role="list">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs font-body text-white/40 hover:text-white/70 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
