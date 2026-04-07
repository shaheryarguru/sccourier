'use client';

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children?:    React.ReactNode;
  padding?:     CardPadding;
  hoverable?:   boolean;
  clickable?:   boolean;
  onClick?:     React.MouseEventHandler<HTMLElement>;
  className?:   string;
  as?:          'div' | 'article' | 'section' | 'li';
  role?:        string;
  tabIndex?:    number;
}

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

const BASE =
  'bg-card rounded-2xl border border-border ' +
  'shadow-[0_1px_3px_0_rgb(0_0_0/0.07),_0_1px_2px_-1px_rgb(0_0_0/0.07)]';

// ── Component ─────────────────────────────────────────────────────────────────
export function Card({
  children,
  padding   = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  as: Tag   = 'div',
  ...rest
}: CardProps) {
  const interactive = clickable || !!onClick;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any;
  return (
    <TagAny
      onClick={onClick}
      className={[
        BASE,
        PADDING[padding],
        hoverable || interactive
          ? 'transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_-5px_rgb(15_43_70/0.12),_0_4px_6px_-2px_rgb(15_43_70/0.06)]'
          : '',
        interactive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      tabIndex={interactive ? (rest.tabIndex ?? 0) : rest.tabIndex}
      {...rest}
    >
      {children}
    </TagAny>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
export function CardHeader({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>{children}</div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`font-heading font-semibold text-lg text-primary leading-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm font-body text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}

export default Card;
