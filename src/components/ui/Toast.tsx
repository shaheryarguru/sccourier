'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id:        string;
  variant:   ToastVariant;
  title:     string;
  message?:  string;
  duration?: number;  // ms, 0 = persist
}

export type AddToastOptions = Omit<ToastData, 'id'>;

interface ToastContextValue {
  toast:   (opts: AddToastOptions)     => string;
  success: (title: string, msg?: string) => string;
  error:   (title: string, msg?: string) => string;
  warning: (title: string, msg?: string) => string;
  info:    (title: string, msg?: string) => string;
  dismiss: (id: string)                 => void;
  dismissAll: ()                        => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ── Variant config ────────────────────────────────────────────────────────────
const CONFIG: Record<
  ToastVariant,
  { icon: React.ElementType; bg: string; border: string; iconCls: string; bar: string }
> = {
  success: {
    icon:    CheckCircle2,
    bg:      'bg-card',
    border:  'border-accent/50',
    iconCls: 'text-accent',
    bar:     'bg-accent',
  },
  error: {
    icon:    XCircle,
    bg:      'bg-card',
    border:  'border-danger/50',
    iconCls: 'text-danger',
    bar:     'bg-danger',
  },
  warning: {
    icon:    AlertTriangle,
    bg:      'bg-card',
    border:  'border-secondary/50',
    iconCls: 'text-secondary',
    bar:     'bg-secondary',
  },
  info: {
    icon:    Info,
    bg:      'bg-card',
    border:  'border-blue-400/50',
    iconCls: 'text-blue-500',
    bar:     'bg-blue-500',
  },
};

// ── Single toast item ─────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onDismiss,
}: {
  toast:     ToastData;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, bg, border, iconCls, bar } = CONFIG[toast.variant];
  const duration = toast.duration ?? 5000;

  // Mount animation
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  // Progress bar: start at 100%, animate to 0% over duration
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (duration === 0) return;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct     = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // Auto-dismiss
  useEffect(() => {
    if (duration === 0) return;
    const t = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(t);
  }, [toast.id, duration, onDismiss]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 220);
  }

  return (
    <div
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={[
        'relative w-80 rounded-xl border shadow-elevated overflow-hidden',
        'transition-all duration-220',
        bg, border,
        visible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-[calc(100%+1.5rem)]',
      ].join(' ')}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Content row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`size-5 mt-0.5 shrink-0 ${iconCls}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-text-primary leading-tight">
            {toast.title}
          </p>
          {toast.message && (
            <p className="font-body text-xs text-text-secondary mt-0.5 leading-snug">
              {toast.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 p-0.5 rounded text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-surface">
          <div
            className={`h-full rounded-full transition-none ${bar} opacity-40`}
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

// ── Toast container (portal) ──────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback((opts: AddToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-9), { ...opts, id }]); // max 10
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string) => toast({ variant: 'success', title, message }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string) => toast({ variant: 'error', title, message }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string) => toast({ variant: 'warning', title, message }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string) => toast({ variant: 'info', title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export default ToastProvider;
