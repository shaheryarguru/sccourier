import type { Metadata } from 'next';
import Link from 'next/link';
import { Package, Search, Home, ArrowRight, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 — Package Not Found',
  description: 'The page you are looking for could not be found.',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-lg mx-auto">

        {/* Animated icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="size-32 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center">
            <Package
              className="size-16 text-primary/30"
              aria-hidden="true"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            />
          </div>
          <div
            className="absolute -top-3 -right-3 size-8 rounded-full bg-secondary flex items-center justify-center shadow-gold"
            aria-hidden="true"
          >
            <Search className="size-4 text-white" />
          </div>
        </div>

        {/* Error code */}
        <p className="font-heading font-bold text-8xl text-primary/10 leading-none select-none mb-2" aria-hidden="true">
          404
        </p>

        {/* Heading */}
        <h1 className="font-heading font-bold text-2xl text-primary mb-3">
          Lost Package?
        </h1>
        <p className="font-body text-text-secondary leading-relaxed mb-8">
          This page seems to have gone astray somewhere on its delivery route.
          Let&apos;s get you back on track.
        </p>

        {/* Track a shipment shortcut */}
        <div className="bg-surface rounded-2xl border border-border p-4 mb-6 text-left">
          <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MapPin className="size-3" aria-hidden="true" />
            Track a shipment instead
          </p>
          <form action="/tracking" method="get" className="flex gap-2">
            <input
              name="q"
              type="text"
              placeholder="Enter tracking ID (e.g. SC15060001)"
              className="flex-1 h-10 px-3 text-sm font-body bg-white border border-border rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors placeholder:text-text-disabled"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-primary text-white text-sm font-body font-semibold rounded-xl hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Search className="size-3.5" aria-hidden="true" />
              Track
            </button>
          </form>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 h-11 px-6 bg-primary text-white font-body font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Home className="size-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            href="/booking"
            className="flex items-center justify-center gap-2 h-11 px-6 bg-white border border-border text-text-primary font-body font-semibold text-sm rounded-xl hover:bg-surface transition-colors"
          >
            Book a Shipment
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Help link */}
        <p className="mt-8 text-sm font-body text-text-disabled">
          Need help?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
