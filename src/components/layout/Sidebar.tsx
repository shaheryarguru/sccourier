'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, FileText,
  Users, Settings, ChevronLeft, LogOut, UserCircle,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/admin',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/bookings',  icon: Package,         label: 'Bookings'  },
  { href: '/admin/shipments', icon: Truck,           label: 'Shipments' },
  { href: '/admin/invoices',  icon: FileText,        label: 'Invoices'  },
  { href: '/admin/customers', icon: Users,           label: 'Customers' },
  { href: '/admin/settings',  icon: Settings,        label: 'Settings'  },
];

interface SidebarProps {
  collapsed?:  boolean;
  onToggle?:   () => void;
  userEmail?:  string;
  userName?:   string;
}

export function Sidebar({ collapsed = false, onToggle, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside
      className={[
        'flex flex-col h-full bg-primary text-white',
        'transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
      aria-label="Admin navigation"
    >
      {/* Header */}
      <div className={[
        'flex items-center border-b border-white/10 shrink-0',
        collapsed ? 'justify-center py-5' : 'justify-between px-4 py-4',
      ].join(' ')}>
        {!collapsed && <Logo size="sm" theme="light" />}
        {collapsed && <Logo variant="icon" size="sm" theme="light" />}

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <ChevronLeft
              className={[
                'size-4 transition-transform duration-300',
                collapsed ? 'rotate-180' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1" role="list">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? label : undefined}
                  className={[
                    'flex items-center rounded-xl transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                    collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-secondary text-primary font-semibold shadow-[0_2px_8px_rgb(245_158_11/0.3)]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  {!collapsed && (
                    <span className="text-sm font-body font-medium">{label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: user info + logout */}
      <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
        {/* User info */}
        {!collapsed && (userEmail || userName) && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="size-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <UserCircle className="size-4 text-white/60" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              {userName && <p className="text-xs font-body font-semibold text-white truncate">{userName}</p>}
              {userEmail && <p className="text-[10px] font-body text-white/50 truncate">{userEmail}</p>}
            </div>
          </div>
        )}

        {/* Back to site */}
        <Link
          href="/"
          className={[
            'flex items-center rounded-xl text-xs font-body text-white/50 hover:text-white hover:bg-white/10 transition-colors',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2 px-3 py-2',
          ].join(' ')}
          title={collapsed ? 'Back to site' : undefined}
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          {!collapsed && 'Back to site'}
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={[
            'w-full flex items-center rounded-xl text-xs font-body text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2 px-3 py-2',
          ].join(' ')}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          {!collapsed && (loggingOut ? 'Signing out…' : 'Sign out')}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
