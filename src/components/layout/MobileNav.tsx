'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Package, Search, Phone, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/',          label: 'Home'           },
  { href: '/services',  label: 'Services'       },
  { href: '/booking',   label: 'Book Now'       },
  { href: '/tracking',  label: 'Track Shipment' },
  { href: '/about',     label: 'About Us'       },
  { href: '/contact',   label: 'Contact'        },
] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

// ── Props ─────────────────────────────────────────────────────────────────────
interface MobileNavProps {
  id:           string;
  open:         boolean;
  onClose:      () => void;
  triggerBtnId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MobileNav({ id, open, onClose, triggerBtnId }: MobileNavProps) {
  const pathname  = usePathname();
  const panelRef  = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element in panel after paint
      requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      });
    } else {
      document.body.style.overflow = '';

      // Return focus to trigger button
      const btn = document.getElementById(triggerBtnId);
      btn?.focus();
    }

    return () => { document.body.style.overflow = ''; };
  }, [open, triggerBtnId]);

  // ── Escape key ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Focus trap ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const panel     = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // ── Close on route change ────────────────────────────────────────────────────
  useEffect(() => { onClose(); }, [pathname, onClose]);

  // ── SSR guard — don't render until mounted ───────────────────────────────────
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      id={id}
      onKeyDown={handleKeyDown}
    >
      {/* ── Backdrop ─────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm',
          'transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* ── Drawer panel ─────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={[
          'fixed top-0 right-0 bottom-0 z-50',
          'w-full max-w-xs sm:max-w-sm',
          'flex flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <Link href="/" onClick={onClose} aria-label="SC Courier — home">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="size-10 flex items-center justify-center rounded-xl text-text-secondary hover:text-primary hover:bg-surface transition-colors"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Nav links (scrollable if needed) ─────────────────────────────── */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          <ul className="space-y-1" role="list">
            {NAV_LINKS.map(({ href, label }, idx) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      // min 48px touch target
                      'flex items-center min-h-[48px] px-4 rounded-xl',
                      'text-base font-body font-medium transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                      // stagger via inline style below
                      open ? 'animate-fade-in' : 'opacity-0',
                      active
                        ? 'text-primary bg-primary/5 font-semibold border-l-[3px] border-secondary pl-[13px]'
                        : 'text-text-secondary hover:text-primary hover:bg-surface',
                    ].join(' ')}
                    style={{ animationDelay: open ? `${idx * 40 + 60}ms` : '0ms' }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── CTA buttons ──────────────────────────────────────────────────── */}
        <div
          className={[
            'px-4 pt-4 pb-2 space-y-2.5 border-t border-border shrink-0',
            open ? 'animate-slide-up' : 'opacity-0',
          ].join(' ')}
          style={{ animationDelay: open ? '320ms' : '0ms' }}
        >
          <Link
            href="/booking"
            onClick={onClose}
            className={[
              'flex items-center justify-center gap-2.5',
              'w-full h-12 rounded-xl',
              'bg-secondary text-primary font-body font-bold text-sm',
              'hover:bg-secondary/90 transition-colors',
              'shadow-[0_4px_14px_rgb(245_158_11/0.30)]',
            ].join(' ')}
          >
            <Package className="size-4.5" aria-hidden="true" />
            Book Now
          </Link>
          <Link
            href="/tracking"
            onClick={onClose}
            className={[
              'flex items-center justify-center gap-2.5',
              'w-full h-12 rounded-xl',
              'border border-border text-text-secondary font-body font-semibold text-sm',
              'hover:border-primary/30 hover:text-primary hover:bg-surface transition-colors',
            ].join(' ')}
          >
            <Search className="size-4" aria-hidden="true" />
            Track Shipment
          </Link>
        </div>

        {/* ── Contact info ─────────────────────────────────────────────────── */}
        <div
          className={[
            'px-5 py-4 bg-surface border-t border-border shrink-0',
            open ? 'animate-fade-in' : 'opacity-0',
          ].join(' ')}
          style={{ animationDelay: open ? '380ms' : '0ms' }}
        >
          <ul className="space-y-2" role="list">
            <li>
              <a
                href="tel:+97140000000"
                className="flex items-center gap-2.5 text-sm font-body text-text-secondary hover:text-primary transition-colors"
              >
                <Phone className="size-4 text-secondary shrink-0" aria-hidden="true" />
                +971 4 000 0000
              </a>
            </li>
            <li>
              <a
                href="mailto:info@sccourier.com"
                className="flex items-center gap-2.5 text-sm font-body text-text-secondary hover:text-primary transition-colors"
              >
                <Mail className="size-4 text-secondary shrink-0" aria-hidden="true" />
                info@sccourier.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default MobileNav;
