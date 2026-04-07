import React from 'react';

type LogoVariant = 'full' | 'icon';
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  /** Use 'light' on dark/navy backgrounds — inverts text color, adds border to icon */
  theme?: 'default' | 'light';
  className?: string;
}

const sizeConfig: Record<LogoSize, { icon: number; gap: number; name: string; tag: string }> = {
  xs: { icon: 24, gap: 8,  name: '0.875rem', tag: '0.5rem'  },
  sm: { icon: 32, gap: 10, name: '1.0625rem',tag: '0.5625rem'},
  md: { icon: 40, gap: 12, name: '1.25rem',  tag: '0.625rem' },
  lg: { icon: 52, gap: 14, name: '1.5625rem',tag: '0.75rem'  },
  xl: { icon: 64, gap: 16, name: '1.875rem', tag: '0.875rem' },
};

// ─── The Icon Mark ────────────────────────────────────────────────────────────
// Three progressive chevrons (>>>) inside a rounded navy square.
// Symbol meaning:
//   · Three chevrons  → speed, forward momentum, delivery
//   · Amber gold tip  → premium, destination reached
// ─────────────────────────────────────────────────────────────────────────────
function SCMark({
  px,
  onDark = false,
}: {
  px: number;
  onDark?: boolean;
}) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Background square ── */}
      <rect
        width="44"
        height="44"
        rx="10"
        fill={onDark ? '#FFFFFF' : '#0F2B46'}
      />

      {/* ── Subtle diagonal speed stripe (texture, not dominant) ── */}
      <rect
        x="-4"
        y="28"
        width="60"
        height="5"
        rx="2.5"
        fill={onDark ? '#0F2B46' : '#FFFFFF'}
        opacity="0.04"
        transform="rotate(-35 22 22)"
      />

      {/* ── Chevron 1 · leftmost · ghost white ── */}
      <path
        d="M9 12 L18 22 L9 32"
        stroke={onDark ? '#0F2B46' : '#FFFFFF'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.25"
      />

      {/* ── Chevron 2 · middle · medium white ── */}
      <path
        d="M18 12 L27 22 L18 32"
        stroke={onDark ? '#0F2B46' : '#FFFFFF'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.62"
      />

      {/* ── Chevron 3 · foremost · Amber Gold ── */}
      <path
        d="M27 12 L36 22 L27 32"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Gold dot accent (delivery endpoint) ── */}
      <circle cx="37.5" cy="22" r="2" fill="#F59E0B" opacity="0.5" />
    </svg>
  );
}

// ─── Logo Component ──────────────────────────────────────────────────────────
export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'default',
  className = '',
}: LogoProps) {
  const { icon: px, gap, name: nameFz, tag: tagFz } = sizeConfig[size];
  const onDark = theme === 'light';

  const nameColor  = onDark ? '#FFFFFF'  : '#0F2B46';
  const tagColor   = onDark ? 'rgba(255,255,255,0.65)' : '#64748B';

  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        aria-label="SC Courier"
        role="img"
      >
        <SCMark px={px} onDark={onDark} />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap }}
      aria-label="SC Courier — Delivering Trust, On Time"
      role="banner"
    >
      <SCMark px={px} onDark={onDark} />

      <div className="flex flex-col" style={{ lineHeight: 1 }}>
        {/* Primary name */}
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: nameFz,
            fontWeight: 800,
            color: nameColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          SC
          <span
            style={{
              fontWeight: 400,
              opacity: 0.55,
              marginLeft: '0.18em',
              letterSpacing: '-0.01em',
            }}
          >
            ·
          </span>
        </span>

        {/* Sub-name */}
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: tagFz,
            fontWeight: 500,
            color: tagColor,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
            marginTop: '1px',
          }}
        >
          Courier
        </span>
      </div>
    </div>
  );
}

export default Logo;
