'use client';

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'table-row' | 'avatar-row';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?:   string | number;
  height?:  string | number;
  /** Repeat the skeleton N times (stacked) */
  count?:   number;
  rounded?: boolean;
  className?: string;
}

// ── Base shimmer pulse ────────────────────────────────────────────────────────
const SHIMMER =
  'bg-gradient-to-r from-[#eef2f7] via-[#e2e8f0] to-[#eef2f7] ' +
  'bg-[length:200%_100%] animate-shimmer rounded';

// ── Individual skeleton shapes ────────────────────────────────────────────────
function SkeletonBase({
  width,
  height,
  rounded,
  className = '',
}: Pick<SkeletonProps, 'width' | 'height' | 'rounded' | 'className'>) {
  return (
    <span
      aria-hidden="true"
      className={`block ${SHIMMER} ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{
        width:  width  !== undefined ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

// ── Variant renderers ─────────────────────────────────────────────────────────
function SkeletonText({ width, className }: Pick<SkeletonProps, 'width' | 'className'>) {
  return <SkeletonBase height={14} width={width ?? '75%'} className={`rounded-full ${className ?? ''}`} />;
}

function SkeletonCircle({ width = 40, className }: Pick<SkeletonProps, 'width' | 'className'>) {
  return <SkeletonBase width={width} height={width} rounded className={`shrink-0 ${className ?? ''}`} />;
}

function SkeletonCard({ className }: Pick<SkeletonProps, 'className'>) {
  return (
    <div
      aria-hidden="true"
      className={`bg-card rounded-2xl border border-border p-6 space-y-4 shadow-card ${className ?? ''}`}
    >
      {/* Header row: avatar + two lines */}
      <div className="flex items-center gap-3">
        <SkeletonBase width={40} height={40} rounded className="shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase height={12} width="55%" className="rounded-full" />
          <SkeletonBase height={10} width="35%" className="rounded-full" />
        </div>
      </div>
      {/* Body lines */}
      <div className="space-y-2">
        <SkeletonBase height={12} className="rounded-full" />
        <SkeletonBase height={12} width="88%" className="rounded-full" />
        <SkeletonBase height={12} width="65%" className="rounded-full" />
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2">
        <SkeletonBase height={32} width={80} className="rounded-xl" />
        <SkeletonBase height={32} width={100} className="rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ className }: Pick<SkeletonProps, 'className'>) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 ${className ?? ''}`}
    >
      <SkeletonBase height={12} width={24}  className="rounded-full shrink-0" />
      <SkeletonBase height={12} width="20%" className="rounded-full" />
      <SkeletonBase height={12} width="30%" className="rounded-full" />
      <SkeletonBase height={12} width="15%" className="rounded-full" />
      <SkeletonBase height={20} width={70}  className="rounded-full ml-auto" />
    </div>
  );
}

function SkeletonAvatarRow({ className }: Pick<SkeletonProps, 'className'>) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className ?? ''}`}>
      <SkeletonBase width={44} height={44} rounded className="shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBase height={13} width="50%" className="rounded-full" />
        <SkeletonBase height={11} width="35%" className="rounded-full" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function Skeleton({
  variant   = 'text',
  width,
  height,
  count     = 1,
  rounded   = false,
  className = '',
}: SkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  function renderOne(i: number) {
    const key = i;
    switch (variant) {
      case 'circle':    return <SkeletonCircle   key={key} width={width ?? 40} className={className} />;
      case 'rect':      return <SkeletonBase     key={key} width={width} height={height} rounded={rounded} className={className} />;
      case 'card':      return <SkeletonCard     key={key} className={className} />;
      case 'table-row': return <SkeletonTableRow key={key} className={className} />;
      case 'avatar-row':return <SkeletonAvatarRow key={key} className={className} />;
      case 'text':
      default:          return <SkeletonText     key={key} width={width} className={className} />;
    }
  }

  if (count === 1) return <>{renderOne(0)}</>;

  return (
    <div
      aria-label="Loading…"
      aria-busy="true"
      className={['flex flex-col', variant === 'text' ? 'gap-2' : 'gap-3'].join(' ')}
    >
      {items.map((_, i) => renderOne(i))}
    </div>
  );
}

export default Skeleton;
