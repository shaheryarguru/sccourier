import type { Metadata, Viewport } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar }      from '@/components/layout/Navbar';
import { Footer }      from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui';

/* ── Outfit — geometric, modern headings ─────────────────────────────────── */
const outfit = Outfit({
  variable:  '--font-outfit',
  subsets:   ['latin'],
  display:   'swap',
  weight:    ['300', '400', '500', '600', '700', '800', '900'],
});

/* ── DM Sans — clean, highly readable body copy ──────────────────────────── */
const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets:  ['latin'],
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700'],
});

/* ── Metadata ────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com'
  ),

  title: {
    default:  'SC Courier — Delivering Trust, On Time. Every Time.',
    template: '%s | SC Courier',
  },
  description:
    'SC Courier (Smart City Courier) — Premium courier & logistics services across the UAE. Same-day, express, and international shipping. Book online, track in real time.',

  keywords: [
    'courier UAE',
    'same day delivery Dubai',
    'express delivery Abu Dhabi',
    'parcel delivery UAE',
    'smart city courier',
    'SC courier',
    'freight logistics UAE',
    'package tracking',
    'international shipping UAE',
  ],

  authors: [{ name: 'SC Courier LLC' }],
  creator: 'SC Courier LLC',
  publisher: 'SC Courier LLC',

  openGraph: {
    type:        'website',
    locale:      'en_AE',
    url:         'https://sccourier.com',
    siteName:    'SC Courier',
    title:       'SC Courier — Delivering Trust, On Time. Every Time.',
    description:
      'Premium courier & logistics across the UAE. Same-day, express, and international shipping.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'SC Courier — Smart City Courier',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'SC Courier — Delivering Trust, On Time',
    description: 'Premium courier & logistics across the UAE.',
    images:      ['/og-image.png'],
  },

  robots: {
    index:               true,
    follow:              true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  icons: {
    icon:        '/favicon.ico',
    shortcut:    '/favicon.ico',
    apple:       '/apple-touch-icon.png',
  },

  manifest: '/manifest.json',
};

/* ── Viewport ────────────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  themeColor:         '#0F2B46',
  colorScheme:        'light',
};

/* ── JSON-LD: LocalBusiness structured data ──────────────────────────────── */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://sccourier.com/#business',
  name: 'SC Courier',
  alternateName: 'Smart City Courier',
  description:
    'Premium courier & logistics services across the UAE. Same-day, express, and international shipping.',
  url: 'https://sccourier.com',
  logo: 'https://sccourier.com/logo.svg',
  image: 'https://sccourier.com/og-image.png',
  telephone: '+971-4-000-0000',
  email: 'info@sccourier.com',
  priceRange: 'AED 15 – AED 500+',
  currenciesAccepted: 'AED',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Business Bay',
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '25.1856',
    longitude: '55.2592',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '22:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/scccourier',
    'https://www.linkedin.com/company/scc-courier',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Courier Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Same-Day Delivery' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Express Delivery' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Standard Delivery' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'International Shipping' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cargo & Freight' } },
    ],
  },
};

/* ── Root Layout ─────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${outfit.variable} ${dmSans.variable} h-full`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body antialiased bg-surface text-text-primary" suppressHydrationWarning>
        <ToastProvider>
          {/* Navbar renders MobileNav internally via createPortal */}
          <Navbar />
          <main id="main-content" className="flex-1 min-h-0" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
