'use client';

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
  children?:  React.ReactNode;
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin shrink-0 ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
           7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ── Style maps ────────────────────────────────────────────────────────────────
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white ' +
    'hover:bg-primary-dark active:bg-primary-dark active:scale-[0.97] ' +
    'shadow-[0_4px_14px_rgb(15_43_70/0.2)] hover:shadow-[0_6px_20px_rgb(15_43_70/0.3)]',

  secondary:
    'bg-secondary text-primary ' +
    'hover:bg-secondary-dark hover:text-white active:scale-[0.97] ' +
    'shadow-[0_4px_14px_rgb(245_158_11/0.28)] hover:shadow-[0_6px_20px_rgb(245_158_11/0.4)]',

  outline:
    'bg-transparent border-2 border-primary text-primary ' +
    'hover:bg-primary hover:text-white active:scale-[0.97]',

  ghost:
    'bg-transparent text-primary ' +
    'hover:bg-primary-50 active:bg-primary-100 active:scale-[0.97]',

  danger:
    'bg-danger text-white ' +
    'hover:bg-danger-dark active:scale-[0.97] ' +
    'shadow-[0_4px_14px_rgb(239_68_68/0.22)] hover:shadow-[0_6px_20px_rgb(239_68_68/0.32)]',
};

const SIZES: Record<ButtonSize, { root: string; icon: string }> = {
  sm: { root: 'h-8  px-3.5 text-xs  gap-1.5', icon: 'size-3.5' },
  md: { root: 'h-10 px-5   text-sm  gap-2',   icon: 'size-4'   },
  lg: { root: 'h-12 px-6   text-base gap-2.5', icon: 'size-5'  },
};

const BASE =
  'inline-flex items-center justify-center ' +
  'font-body font-semibold rounded-xl ' +
  'transition-all duration-150 ease-out cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'select-none whitespace-nowrap';

// ── Component ─────────────────────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const { root, icon } = SIZES[size];

    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[BASE, VARIANTS[variant], root, fullWidth ? 'w-full' : '', className]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Left: spinner while loading, else icon */}
        {loading ? (
          <Spinner className={icon} />
        ) : leftIcon ? (
          <span
            className={`${icon} inline-flex items-center justify-center shrink-0`}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        ) : null}

        {/* Label */}
        {children !== undefined && <span>{children}</span>}

        {/* Right icon — hidden during loading */}
        {!loading && rightIcon ? (
          <span
            className={`${icon} inline-flex items-center justify-center shrink-0`}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
