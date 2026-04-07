'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Package, Search } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { MobileNav } from './MobileNav';

// ── Nav link definitions ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/',          label: 'Home'            },
  { href: '/services',  label: 'Services'        },
  { href: '/booking',   label: 'Book Now'        },
  { href: '/tracking',  label: 'Track Shipment'  },
  { href: '/contact',   label: 'Contact'         },
] as const;

// ── Hook: detect if we're past the hero area ──────────────────────────────────
function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Initialise state immediately (avoids flash on SSR hydration)
    setScrolled(window.scrollY > threshold);

    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  return scrolled;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname    = usePathname();
  const scrolled    = useScrolled(80);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuBtnId   = useId();

  // Transparent only on the home page while not scrolled
  const isHome        = pathname === '/';
  const isTransparent = isHome && !scrolled;

  // Close drawer when navigating
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const openMenu  = useCallback(() => setMobileOpen(true),  []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  // ── Link style helpers ──────────────────────────────────────────────────────
  function linkClass(href: string) {
    const active =
      href === '/'
        ? pathname === '/'
        : pathname === href || pathname.startsWith(href + '/');

    const base =
      'relative inline-flex items-center px-1 py-1 text-sm font-body font-medium ' +
      'transition-colors duration-150 focus-visible:outline-none ' +
      'focus-visible:ring-2 focus-visible:ring-secondary focus-visible:rounded';

    // Active indicator: amber underline bar
    const indicator = active
      ? 'after:absolute after:bottom-[-4px] after:left-0 after:right-0 ' +
        'after:h-[2px] after:rounded-full after:bg-secondary'
      : '';

    // Text colour varies with background
    const colour = isTransparent
      ? active
        ? 'text-secondary'
        : 'text-white/80 hover:text-white'
      : active
        ? 'text-primary'
        : 'text-text-secondary hover:text-primary';

    return [base, indicator, colour].join(' ');
  }

  return (
    <>
      <header
        className={[
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          isTransparent
            ? 'bg-transparent py-5'
            : 'bg-white/98 backdrop-blur-md shadow-[0_1px_0_0_rgb(15_43_70/0.07),0_4px_16px_-4px_rgb(15_43_70/0.06)] py-3',
        ].join(' ')}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">

            {/* ── Logo ─────────────────────────────────────────────────────── */}
            <Link
              href="/"
              aria-label="SC Courier — back to home"
              className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:rounded"
            >
              {/* Desktop: full wordmark  |  Mobile: icon only */}
              <span className="hidden sm:block">
                <Logo size="md" theme={isTransparent ? 'light' : 'default'} />
              </span>
              <span className="sm:hidden">
                <Logo variant="icon" size="md" theme={isTransparent ? 'light' : 'default'} />
              </span>
            </Link>

            {/* ── Desktop nav links ─────────────────────────────────────────── */}
            <nav aria-label="Primary navigation" className="hidden lg:block">
              <ul className="flex items-center gap-6" role="list">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={linkClass(href)}
                      aria-current={
                        (href === '/' ? pathname === '/' : pathname.startsWith(href))
                          ? 'page'
                          : undefined
                      }
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ── Desktop CTA ───────────────────────────────────────────────── */}
            <div className="hidden lg:flex items-center">
              <Link
                href="/booking"
                className={[
                  'inline-flex items-center gap-2 h-10 px-5 rounded-xl',
                  'font-body font-semibold text-sm transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
                  'bg-secondary text-primary',
                  'hover:bg-secondary/90 active:scale-[0.98]',
                  'shadow-[0_4px_14px_rgb(245_158_11/0.30)]',
                ].join(' ')}
              >
                <Package className="size-4" aria-hidden="true" />
                Book Now
              </Link>
            </div>

            {/* ── Mobile hamburger ──────────────────────────────────────────── */}
            <button
              id={menuBtnId}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={openMenu}
              className={[
                'lg:hidden flex items-center justify-center',
                'size-10 rounded-xl transition-colors',
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-text-secondary hover:bg-surface hover:text-primary',
              ].join(' ')}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile navigation drawer ─────────────────────────────────────────── */}
      <MobileNav
        id="mobile-nav"
        open={mobileOpen}
        onClose={closeMenu}
        triggerBtnId={menuBtnId}
      />
    </>
  );
}

export default Navbar;
