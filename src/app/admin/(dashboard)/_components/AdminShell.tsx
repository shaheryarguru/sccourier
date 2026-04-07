'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';

// ── Breadcrumb labels ─────────────────────────────────────────────────────────
const CRUMB_LABELS: Record<string, string> = {
  admin:     'Dashboard',
  bookings:  'Bookings',
  shipments: 'Shipments',
  invoices:  'Invoices',
  customers: 'Customers',
  settings:  'Settings',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm font-body">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label  = CRUMB_LABELS[seg] ?? seg;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 text-text-disabled" aria-hidden="true" />}
            <span className={isLast ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

interface Props {
  children:   React.ReactNode;
  userEmail?: string;
  userName?:  string;
}

export function AdminShell({ children, userEmail, userName }: Props) {
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  // Auto-collapse on smaller screens
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 1024) setCollapsed(true);
      else setCollapsed(false);
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* ── Mobile overlay ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (desktop: always visible, mobile: slide-over) ────── */}
      <div className={[
        'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto flex-shrink-0',
        'transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          userEmail={userEmail}
          userName={userName}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-border flex items-center gap-3 px-4 shrink-0 shadow-sm">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <Breadcrumbs />
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary"
              aria-label="Notifications"
            >
              <Bell className="size-5" aria-hidden="true" />
            </button>

            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-heading font-bold text-primary">
                    {(userName ?? userEmail).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-body font-semibold text-text-primary leading-none">
                    {userName ?? userEmail.split('@')[0]}
                  </p>
                  <p className="text-[10px] font-body text-text-disabled leading-none mt-0.5">Administrator</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
