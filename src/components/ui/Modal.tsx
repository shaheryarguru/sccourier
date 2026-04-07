'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  title?:     React.ReactNode;
  children?:  React.ReactNode;
  footer?:    React.ReactNode;
  size?:      ModalSize;
  /** Prevent closing when clicking the backdrop */
  noBackdropClose?: boolean;
  /** Prevent closing with Escape */
  noEscapeClose?: boolean;
  className?: string;
  titleClassName?: string;
}

const SIZES: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

// Selectors for focusable elements
const FOCUSABLE =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ── Component ─────────────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size            = 'md',
  noBackdropClose = false,
  noEscapeClose   = false,
  className       = '',
  titleClassName  = '',
}: ModalProps) {
  const uid         = useId();
  const titleId     = `modal-title-${uid}`;
  const modalRef    = useRef<HTMLDivElement>(null);

  // Animate state: render → visible transition → invisible → unmount
  const [mounted,   setMounted]   = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Next frame: add visible class (triggers CSS transition)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus first focusable element
    const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusable[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !noEscapeClose) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const elements = Array.from(modal!.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (elements.length === 0) return;

      const first = elements[0];
      const last  = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, mounted, noEscapeClose, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!noBackdropClose && e.target === e.currentTarget) onClose();
    },
    [noBackdropClose, onClose]
  );

  if (!mounted) return null;

  return createPortal(
    // ── Backdrop ──────────────────────────────────────────────────────
    <div
      aria-hidden={!isOpen}
      onClick={handleBackdropClick}
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-primary/60 backdrop-blur-sm',
        'transition-opacity duration-200',
        animating ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {/* ── Dialog ──────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={[
          'relative w-full bg-card rounded-2xl shadow-modal',
          'flex flex-col max-h-[90vh]',
          'transition-all duration-220',
          animating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3',
          SIZES[size],
          className,
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        {(title != null) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
            <h2
              id={titleId}
              className={`font-heading font-semibold text-xl text-primary leading-tight ${titleClassName}`}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="shrink-0 p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Close button (no title variant) */}
        {title == null && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 font-body text-text-primary">
          {children}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        {footer && (
          <div className="px-6 pb-6 pt-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
